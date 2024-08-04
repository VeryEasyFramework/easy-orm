//https://www.postgresql.org/docs/16/protocol-flow.html
//https://www.postgresql.org/docs/16/protocol-message-formats.html

import { errorCodeMap, pgErrorMap } from "./maps/errorMap.ts";
import { PgError } from "#/database/adapter/adapters/postgres/pgError.ts";
import { toCamelCase } from "@vef/string-utils";
import type {
  ColumnDescription,
  PgClientConfig,
  QueryResponse,
  ServerStatus,
  SimpleQueryResponse,
} from "#/database/adapter/adapters/postgres/pgTypes.ts";
import { MessageWriter } from "#/database/adapter/adapters/postgres/messageWriter.ts";
import { MessageReader } from "#/database/adapter/adapters/postgres/messageReader.ts";
import {
  convertToDataType,
  getDataType,
  statusMap,
} from "#/database/adapter/adapters/postgres/maps/maps.ts";

export class PostgresClient {
  private conn!: Deno.Conn;
  private connectionParams: PgClientConfig;
  private camelCase: boolean;
  cancelInfo: {
    pid: number;
    secret: number;
  };
  private serverParams: Record<string, string>;

  private readonly writer: MessageWriter;
  private reader!: MessageReader;
  private decoder: TextDecoder = new TextDecoder();
  serverStatus: ServerStatus;
  private status: "connected" | "notConnected" = "notConnected";

  get connected() {
    return this.status === "connected";
  }
  constructor(options: PgClientConfig) {
    if (!options.options) {
      options.options = {};
    }
    if (!options.options.client_encoding) {
      options.options.client_encoding = "UTF8";
    }
    this.connectionParams = options;

    this.camelCase = options.camelCase || false;
    this.writer = new MessageWriter();
    this.serverParams = {};
    this.serverStatus = "notConnected";
    this.cancelInfo = {
      pid: 0,
      secret: 0,
    };
  }
  private decode(data: Uint8Array): string {
    return this.decoder.decode(data);
  }
  private async readResponseHeader() {
    const buffer = new Uint8Array(5);
    await this.conn.read(buffer);
  }

  async connect() {
    if (this.connected) {
      return;
    }
    const options = {
      host: this.connectionParams.host,
      port: this.connectionParams.port,
      unixPath: this.connectionParams.unixPath,
    };
    if (options.unixPath) {
      if (options.host || options.port) {
        throw new Error("Cannot use both unixPath and host/port");
      }
      console.log(`Connecting to ${options.unixPath}`);
      this.conn = await Deno.connect({
        path: options.unixPath,
        transport: "unix",
      });
    }

    if (options?.port || options?.host || !options) {
      if (options?.unixPath) {
        throw new Error("Cannot use both unixPath and host/port");
      }
      console.log(`Connecting to ${options.host}:${options.port}`);
      this.conn = await Deno.connect({
        port: options?.port || 5432,
        hostname: options?.host || "localhost",
      });
      console.log("Connected to Postgres");
    }

    this.reader = new MessageReader(this.conn);
    const writer = this.writer;
    writer.addInt32(196608);
    writer.addCString("user");
    writer.addCString(this.connectionParams.user);
    writer.addCString("database");
    writer.addCString(this.connectionParams.database);
    if (this.connectionParams.options) {
      for (
        const [key, value] of Object.entries(
          this.connectionParams.options,
        )
      ) {
        writer.addCString(key);
        writer.addCString(value);
      }
    }
    writer.addCString("");
    await this.conn.write(writer.message);
    // const data = await reader(this.conn)
    // messageParser(data)
    // return

    while (this.status !== "connected") {
      await this.reader.nextMessage();
      switch (this.reader.messageType) {
        case "R": {
          const authTypeMap = {
            0: "AuthenticationOk",
            3: "AuthenticationCleartextPassword",
            5: "AuthenticationMD5Password",
            10: "AuthenticationSASL",
            11: "AuthenticationSASLContinue",
            12: "AuthenticationSASLFinal",
          };
          const authType = this.reader.readInt32();
          console.log({ authType });
          switch (authType) {
            case 0: {
              break;
            }
            case 3: {
              const password = this.connectionParams.password;
              this.writer.setMessageType("p");
              this.writer.addCString(password);
              await this.conn.write(this.writer.message);
              break;
            }
            case 5: {
              throw new Error("MD5 authentication not implemented");
              const salt = this.reader.readBytes(4);
              //  md5 authentication
              break;
            }
            case 10: {
              throw new Error("SASL authentication not implemented");
              const saslMechanism = this.reader.readCString();
              const password = this.connectionParams.password as string;
              console.log({ saslMechanism });
              if (saslMechanism === "SCRAM-SHA-256") {
                console.log("SCRAM-SHA-256");
                this.writer.setMessageType("p");
                this.writer.addCString("SCRAM-SHA-256");
                this.writer.addNegativeOne();

                await this.conn.write(this.writer.message);
              }

              break;
            }
            case 11: {
              // get the length of the message from the server

              const length = this.reader.messageLength - 4;

              const message = this.reader.readAllBytes();
              console.log({ message });

              this.writer.setMessageType("p");
              const password = this.connectionParams.password as string;

              // SCRAM-SHA-256 authentication

              this.writer.addCString(password);

              await this.conn.write(this.writer.message);

              break;
            }
            default: {
              console.log({ authType });
              throw new Error("Unknown authentication type");
            }
          }

          break;
        }
        case "S": {
          const param = this.reader.readCString();
          this.serverParams[param] = this.reader.readCString();

          break;
        }
        case "Z": {
          this.status = "connected";
          const status = this.reader.readString(1) as "I" | "T" | "E";

          this.serverStatus = statusMap[status];

          break;
        }
        case "E": {
          // const errorLength = this.reader.readInt32();
          // const error = this.reader.readBytes(errorLength);
          this.readError();
          throw new Error("Error connecting to Postgres");
          break;
        }
        case "K": {
          // const keyData = new DataView(this.reader.readAllBytes().buffer);
          const pid = this.reader.readInt32();
          const key = this.reader.readInt32();
          this.cancelInfo = { pid, secret: key };
          break;
        }
        default: {
          console.log({ messageType: this.reader.messageType });
          throw new Error("Unknown message type");
        }
      }
    }
  }

  private async read() {
  }

  private readError() {
    const errorFields: Record<string, any> = {};
    let offset = 0;
    while (this.reader.offset < this.reader.messageLength) {
      const field = this.reader.readChar() as
        | keyof typeof errorCodeMap
        | null;
      if (!field) {
        break;
      }
      const value = this.reader.readCString();

      errorFields[errorCodeMap[field]] = value;
      offset++;
      if (offset > this.reader.messageLength) {
        break;
      }
    }
    console.log({ errorFields });
    errorFields["name"] = pgErrorMap[
      errorFields["code"] as keyof typeof pgErrorMap
    ];
    throw new PgError(errorFields);
  }
  private parseRowDescription(): ColumnDescription[] {
    const columnCount = this.reader.readInt16();

    const columns: ColumnDescription[] = [];
    for (let i = 0; i < columnCount; i++) {
      const name = this.reader.readCString();
      const tableID = this.reader.readInt32();
      const columnID = this.reader.readInt16();
      const dataTypeID = this.reader.readInt32();
      const dataTypeSize = this.reader.readInt16();
      const dataTypeModifier = this.reader.readInt32();
      const format = this.reader.readInt16();
      const column: ColumnDescription = {
        name,
        camelName: toCamelCase(name),
        tableID,
        columnID,
        dataTypeID,
        dataType: getDataType(dataTypeID),
        dataTypeSize,
        dataTypeModifier,
        format,
      };
      columns.push(column);
    }
    return columns;
  }
  async query<T>(
    query: string,
  ): Promise<QueryResponse<T>> {
    console.log({ query });
    const writer = this.writer;
    writer.setMessageType("Q");
    writer.addCString(query);
    await this.conn.write(writer.message);
    let status;
    const fields: ColumnDescription[] = [];
    const data: T[] = [];

    while (!status) {
      await this.reader.nextMessage();
      const messageType = this.reader.messageType as keyof SimpleQueryResponse;

      switch (messageType) {
        case "T": {
          const columns = this.parseRowDescription();
          fields.push(...columns);
          break;
        }
        case "D": {
          const columnCount = this.reader.readInt16();
          const row = {} as Record<string, any>;
          for (let i = 0; i < columnCount; i++) {
            const field = fields[i];

            const length = this.reader.readInt32(); //
            if (length === -1) {
              row[field.camelName] = null;
              continue;
            }
            const column = this.reader.readBytes(length);
            row[field.camelName] = convertToDataType(
              this.decode(column),
              field.dataTypeID,
            );
          }
          data.push(row as T);
          break;
        }
        case "Z": {
          const serverStatus = this.reader.readString(1) as
            | "I"
            | "T"
            | "E";
          this.serverStatus = statusMap[serverStatus];
          status = "done";
          break;
        }
        case "E": {
          this.readError();
          break;
        }
      }
    }

    const result: QueryResponse<T> = {
      rowCount: data.length,
      rows: data,
      columns: fields,
    };
    return result;
  }
}

if (import.meta.main) {
  const client = new PostgresClient({
    database: "irl",
    unixPath: "/var/run/postgresql/.s.PGSQL.5432",
    user: "eliveffer",
    options: {
      "client_encoding": "UTF8",
      "application_name": "deno-postgres",
    },
  });
  await client.connect();
  const query = 'SELECT * FROM irl_app."user";';
  await client.query(query);
}

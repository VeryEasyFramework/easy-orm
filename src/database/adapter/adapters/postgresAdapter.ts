import type { ListOptions } from "../../database.ts";
import { DatabaseAdapter, type RowsResult } from "../databaseAdapter.ts";
import { camelToSnakeCase } from "@eveffer/string-utils";
import {
  type ClientOptions,
  Pool,
  type QueryObjectOptions,
  type QueryObjectResult,
} from "../../../../deps.ts";

export interface PostgresConfig {
  connection_params: ClientOptions;
  size: number;
  lazy?: boolean;
  camelCase?: boolean;
}
export class PostgresAdapter extends DatabaseAdapter<PostgresConfig> {
  private pool!: Pool;
  camelCase: boolean = false;

  async init() {
    const config = this.config;
    const params = config.connection_params;
    const size = config.size;
    const lazy = config.lazy || false;
    this.camelCase = config.camelCase || false;
    this.pool = new Pool(params, size, lazy);
    await this.pool.initialized();
  }
  update(
    tableName: string,
    id: any,
    fields: Record<string, any>,
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }
  delete(tableName: string, field: string, value: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async disconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async query<T>(query: QueryObjectOptions): Promise<QueryObjectResult<T>> {
    using client = await this.pool.connect();
    const result = await client.queryObject<T>({
      ...query,
      camelCase: this.camelCase,
    });
    return result;
  }
  async queryRaw(query: string): Promise<any> {
    using client = await this.pool.connect();
    const result = await client.queryArray(query);
    return result;
  }
  async createTable(tableName: string, fields: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async dropTable(tableName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async insert(tableName: string, data: Record<string, any>): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>> {
    let query = `SELECT * FROM ${tableName}`;
    if (options?.filter) {
      for (let [key, value] of Object.entries(options.filter)) {
        key = camelToSnakeCase(key);
        query += ` WHERE ${key} = ${value}`;
      }
    }
    const result = await this.query<T>({
      text: query,
    });
    // const result = await this.queryRaw(query);
    const output = {
      rowCount: result.rowCount || 0,
      data: result.rows,
      columns: result.columns || [],
    };
    return output;
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    // select 1 row from table where field = value
    const query = `SELECT * FROM ${tableName} WHERE ${field} = $1`;
    const result = await this.query<T>({
      text: query,
      args: [value],
    });
    if (result.rowCount === 0) {
      throw new Error("Row not found");
    }
    return result.rows[0];
  }
}

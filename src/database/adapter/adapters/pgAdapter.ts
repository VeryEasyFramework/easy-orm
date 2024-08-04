import type { ListOptions } from "../../database.ts";
import {
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import { camelToSnakeCase } from "@vef/string-utils";
import { PostgresPool } from "#/database/adapter/adapters/postgres/pgPool.ts";
import type { PgClientConfig } from "#/database/adapter/adapters/postgres/pgTypes.ts";

export interface PostgresConfig {
  clientOptions: PgClientConfig;
  size: number;
  lazy?: boolean;
  camelCase?: boolean;
}
export class PostgresAdapter extends DatabaseAdapter<PostgresConfig> {
  private pool!: PostgresPool;
  camelCase: boolean = false;

  async init(): Promise<void> {
    const config = this.config;
    this.camelCase = config.camelCase || false;
    this.pool = new PostgresPool(this.config);
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
  async query<T>(query: string): Promise<RowsResult<T>> {
    const result = await this.pool.query<T>(query);
    const columns = result.columns.map((column) => {
      return this.camelCase ? column.camelName : column.name;
    });

    return {
      rowCount: result.rowCount,
      data: result.rows,
      columns: columns,
    };
  }

  async createTable(tableName: string, fields: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async dropTable(tableName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async insert(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
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
    const result = await this.query<T>(query);

    return result;
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    const query = `SELECT * FROM ${tableName} WHERE ${field} = ${value}`;
    const result = await this.query<T>(query);
    if (result.rowCount === 0) {
      throw new Error("Row not found");
    }
    return result.data[0];
  }
}

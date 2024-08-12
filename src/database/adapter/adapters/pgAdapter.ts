import type { ListOptions } from "../../database.ts";
import {
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import { camelToSnakeCase, toSnakeCase } from "@vef/string-utils";
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
    const columns = Object.keys(data).map((key) => camelToSnakeCase(key));
    const values = Object.values(data).map((value) => {
      if (typeof value === "string") {
        return `'${value}'`;
      }
      return value;
    });
    const query = `INSERT INTO ${tableName} (${
      columns.join(
        ", ",
      )
    }) VALUES (${values.join(", ")})`;
    const result = await this.query(query);
    return result;
  }

  async delete(tableName: string, field: string, value: any): Promise<void> {
    const query = `DELETE FROM ${tableName} WHERE ${field} = ${value}`;
    await this.query(query);
  }
  async update(
    tableName: string,
    id: string,
    fields: Record<string, any>,
  ): Promise<any> {
    const query = `UPDATE ${tableName} SET ${
      Object.entries(fields)
        .map(([key, value]) => {
          key = camelToSnakeCase(key);
          return `${key} = ${value}`;
        })
        .join(", ")
    } WHERE id = ${id}`;
    const result = await this.query(query);
    return result;
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

    if (options?.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    if (options?.orderBy) {
      query += ` ORDER BY ${camelToSnakeCase(options.orderBy)}`;
      const order = options.order || "ASC";
      query += ` ${order}`;
    }

    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    const result = await this.query<T>(query);

    return result;
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    field = toSnakeCase(field);
    const query = `SELECT * FROM ${tableName} WHERE ${field} = ${value}`;
    const result = await this.query<T>(query);
    if (result.rowCount === 0) {
      throw new Error("Row not found");
    }
    return result.data[0];
  }
  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ): Promise<void> {
    let query = `UPDATE ${tableName} SET ${field} = ${value}`;
    if (filters) {
      query += " WHERE ";
      query += Object.entries(filters)
        .map(([key, value]) => {
          key = camelToSnakeCase(key);
          return `${key} = ${value}`;
        })
        .join(" AND ");
    }
    await this.query(query);
  }
}

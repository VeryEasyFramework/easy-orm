import {
  PostgresAdapter,
  PostgresConfig,
} from "./adapter/adapters/postgresAdapter.ts";
import { DatabaseAdapter, RowsResult } from "./adapter/databaseAdapter.ts";

export type DatabaseType = "postgres" | "json";

export type ListOptions = {
  filter?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: "asc" | "desc";
};
export type DatabaseConfig = {
  "postgres": PostgresConfig;
  "json": Record<string, any>;
};
export class Database<A extends DatabaseType> {
  adapter: DatabaseAdapter<DatabaseConfig[A]>;

  private config: DatabaseConfig[A];

  constructor(options: {
    adapter: A;
    config: DatabaseConfig[A];
  }) {
    this.config = options.config;
    switch (options.adapter) {
      case "postgres": {
        const config = options.config as PostgresConfig;
        this.adapter = new PostgresAdapter(config);
        break;
      }
      default:
        throw new Error("Invalid adapter");
    }
  }

  init() {
    this.adapter.init();
  }
  async connect(): Promise<void> {
    await this.adapter.connect();
  }
  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
  }
  async query(query: string): Promise<any> {
    return await this.adapter.query(query);
  }
  async createTable(tableName: string, fields: any): Promise<void> {
    await this.adapter.createTable(tableName, fields);
  }
  async dropTable(tableName: string): Promise<void> {
    await this.adapter.dropTable(tableName);
  }
  async insertRow<T>(tableName: string, data: Record<string, any>): Promise<T> {
    return await this.adapter.insert(tableName, data);
  }
  async updateRow<T>(
    tableName: string,
    id: any,
    data: Record<string, any>,
  ): Promise<T> {
    return await this.adapter.update(tableName, id, data);
  }
  async deleteRow(tableName: string, field: string, value: any): Promise<void> {
    await this.adapter.delete(tableName, field, value);
  }
  async getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>> {
    return await this.adapter.getRows(tableName, options);
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    return await this.adapter.getRow(tableName, field, value);
  }
}

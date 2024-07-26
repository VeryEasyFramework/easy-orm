import { PostgresAdapter } from "./adapter/adapters/postgresAdapter.ts";
import { DatabaseAdapter } from "./adapter/databaseAdapter.ts";

export type DatabaseType = "postgres" | "json";
export class Database {
  adapter: DatabaseAdapter;

  private config: Record<string, any>;

  constructor(options: {
    adapter: DatabaseType;
    config: Record<string, any>;
  }) {
    this.config = options.config;
    switch (options.adapter) {
      case "postgres":
        this.adapter = new PostgresAdapter(options.config);
        break;
      default:
        throw new Error("Invalid adapter");
    }
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
  async getRows<T>(tableName: string): Promise<T[]> {
    return await this.adapter.getRows(tableName);
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    return await this.adapter.getRow(tableName, field, value);
  }
  async getRowByField<T>(
    tableName: string,
    field: string,
    value: any,
  ): Promise<T> {
    return await this.adapter.getRowByField(tableName, field, value);
  }
  async getRowsByField<T>(
    tableName: string,
    field: string,
    value: any,
  ): Promise<T[]> {
    return await this.adapter.getRowsByField(tableName, field, value);
  }
}

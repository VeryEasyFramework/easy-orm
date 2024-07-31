import {
  MemcachedAdapter,
  MemcachedConfig,
} from "#/database/adapter/adapters/memcachedAdapter.ts";
import {
  PostgresAdapter,
  type PostgresConfig,
} from "./adapter/adapters/postgresAdapter.ts";
import type { RowsResult } from "./adapter/databaseAdapter.ts";

export type ListOptions = {
  filter?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: "asc" | "desc";
};
export interface DatabaseConfig {
  postgres: PostgresConfig;
  memcached: MemcachedConfig;
  json: Record<string, any>;
}

export interface AdapterMap {
  "postgres": PostgresAdapter;
  "memcached": MemcachedAdapter;
  "json": any;
}

type ExtractConfig<A extends keyof DatabaseConfig> = A extends
  keyof DatabaseConfig ? DatabaseConfig[A] : never;

export class Database<
  A extends keyof DatabaseConfig,
> {
  adapter: AdapterMap[A];

  private config: DatabaseConfig[A];

  constructor(options: {
    adapter: A;
    config: DatabaseConfig[A];
  }) {
    this.config = options.config;
    switch (options.adapter) {
      case "postgres": {
        this.adapter = new PostgresAdapter(options.config as PostgresConfig);
        break;
      }
      case "memcached": {
        this.adapter = new MemcachedAdapter(options.config as MemcachedConfig);
        break;
      }
      default:
        throw new Error("Invalid adapter");
    }
  }

  async init() {
    await this.adapter.init();
  }
  async connect(): Promise<void> {
    await this.adapter.connect();
  }
  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
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

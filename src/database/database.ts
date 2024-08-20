import {
  MemcachedAdapter,
  type MemcachedConfig,
} from "#/database/adapter/adapters/memcachedAdapter.ts";
import {
  PostgresAdapter,
  type PostgresConfig,
} from "#/database/adapter/adapters/pgAdapter.ts";
import {
  JSONAdapter,
  type JSONConfig,
} from "#/database/adapter/adapters/jsonAdapter.ts";
import type { DatabaseAdapter, RowsResult } from "./adapter/databaseAdapter.ts";
import type { EasyField } from "#/entity/field/ormField.ts";
import { EasyFieldType } from "../../mod.ts";

export interface AdvancedFilter {
  op:
    | "contains"
    | "not contains"
    | "in list"
    | "not in list"
    | "between"
    | "not between"
    | "is"
    | "is not"
    | ">"
    | "<"
    | ">="
    | "<=";
  value: any;
}
export interface ListOptions {
  columns?: string[];
  filter?: Record<string, string | number | AdvancedFilter>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}
export interface DatabaseConfig {
  postgres: PostgresConfig;
  memcached: MemcachedConfig;
  json: JSONConfig;
}

export interface AdapterMap {
  "postgres": PostgresAdapter;
  "memcached": MemcachedAdapter;
  "json": JSONAdapter;
}

type ExtractConfig<A extends keyof DatabaseConfig> = A extends
  keyof DatabaseConfig ? DatabaseConfig[A] : never;

export class Database<
  A extends keyof DatabaseConfig,
> {
  adapter: DatabaseAdapter<any>;

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
      case "json": {
        this.adapter = new JSONAdapter(options.config as JSONConfig);
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

  adaptLoadValue(field: EasyField, value: any) {
    return this.adapter.adaptLoadValue(field, value);
  }
  adaptSaveValue(field: EasyField | EasyFieldType, value: any) {
    return this.adapter.adaptSaveValue(field, value);
  }

  async createTable(tableName: string, fields: any): Promise<void> {
    await this.adapter.createTable(tableName, fields);
  }
  async dropTable(tableName: string): Promise<void> {
    await this.adapter.dropTable(tableName);
  }
  async insertRow<T>(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<T> {
    return await this.adapter.insert(tableName, id, data);
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
    if (options?.filter) {
      const keys = Object.keys(options.filter);
      if (keys.length == 0) {
        options.filter = undefined;
      }
    }
    return await this.adapter.getRows(tableName, options);
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    return await this.adapter.getRow(tableName, field, value);
  }

  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ) {
    await this.adapter.batchUpdateField(tableName, field, value, filters);
  }
}

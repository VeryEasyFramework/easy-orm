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
import type { EasyField } from "#/entity/field/easyField.ts";
import type { EasyFieldType, SafeType } from "#/entity/field/fieldTypes.ts";
import {
  DenoKvAdapter,
  type DenoKvConfig,
} from "#/database/adapter/adapters/denoKvAdapter.ts";

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
    | "<="
    | "="
    | "!="
    | "starts with"
    | "ends with";
  value: any;
}
export interface ListOptions {
  columns?: string[];
  filter?: Record<string, string | number | AdvancedFilter>;
  orFilter?: Record<string, string | number | AdvancedFilter>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}
export interface DatabaseConfig {
  postgres: PostgresConfig;
  memcached: MemcachedConfig;
  json: JSONConfig;
  denoKv: DenoKvConfig;
}

export type DBType = keyof DatabaseConfig;

export interface AdapterMap {
  "postgres": PostgresAdapter;
  "memcached": MemcachedAdapter;
  "json": JSONAdapter;
  "denoKv": DenoKvAdapter;
}

type ExtractConfig<A extends keyof DatabaseConfig> = A extends
  keyof DatabaseConfig ? DatabaseConfig[A] : never;

export class Database<
  A extends keyof DatabaseConfig,
> {
  adapter: DatabaseAdapter<DatabaseConfig[keyof DatabaseConfig]>;

  private config: DatabaseConfig[A];
  idFieldType: EasyFieldType = "IDField";
  constructor(options: {
    adapter: A;
    config: DatabaseConfig[A];
    idFieldType?: EasyFieldType;
  }) {
    this.config = options.config;
    if (options.idFieldType) {
      this.idFieldType = options.idFieldType;
    }
    switch (options.adapter) {
      case "postgres":
        this.adapter = new PostgresAdapter(options.config as PostgresConfig);
        break;
      case "memcached":
        this.adapter = new MemcachedAdapter(options.config as MemcachedConfig);
        break;
      case "json":
        this.adapter = new JSONAdapter(options.config as JSONConfig);
        break;
      case "denoKv":
        this.adapter = new DenoKvAdapter(options.config as DenoKvConfig);
        break;

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

  stop() {
    this.adapter.disconnect();
  }
  adaptLoadValue(field: EasyField, value: any): any {
    return this.adapter.adaptLoadValue(field, value);
  }
  adaptSaveValue(field: EasyField | EasyFieldType, value: any): any {
    return this.adapter.adaptSaveValue(field, value);
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
  async getRows<T extends Record<string, SafeType>>(
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
  async getRow<T extends Record<string, SafeType>>(
    tableName: string,
    field: string,
    value: any,
  ): Promise<T> {
    return await this.adapter.getRow(tableName, field, value);
  }

  async getValue<SafeType>(
    tableName: string,
    id: string,
    field: string,
  ): Promise<SafeType> {
    return await this.adapter.getValue(tableName, id, field);
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

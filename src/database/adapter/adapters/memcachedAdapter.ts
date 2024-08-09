import {
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import type { ListOptions } from "#/database/database.ts";
import { MemcachePool } from "./memcached/mcPool.ts";
import type { PoolConfig } from "./memcached/mcTypes.ts";
{
}
export interface MemcachedConfig extends PoolConfig {
}

export class MemcachedAdapter extends DatabaseAdapter<MemcachedConfig> {
  private pool!: MemcachePool;

  init(): void {
    this.pool = new MemcachePool(this.config);
  }
  async connect(): Promise<void> {
  }

  async disconnect(): Promise<void> {
  }

  async createTable(tableName: string, fields: any): Promise<void> {
  }

  async dropTable(tableName: string): Promise<void> {
  }

  async insert(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
  }

  async update(
    tableName: string,
    id: any,
    fields: Record<string, any>,
  ): Promise<any> {
  }

  async delete(tableName: string, field: string, value: any): Promise<void> {
  }

  async getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>> {
    return {} as RowsResult<T>;
  }

  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    return {} as T;
  }

  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ): Promise<void> {
    return;
  }
}

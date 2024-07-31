import type { ListOptions } from "../database.ts";

export interface RowsResult<T> {
  rowCount: number;
  data: T[];
  columns: string[];
}
export abstract class DatabaseAdapter<C> {
  // require constructor with a config object
  protected config: C;
  constructor(config: C) {
    this.config = config;
    this.init();
  }

  abstract init(): Promise<void> | void;
  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract createTable(tableName: string, fields: any): Promise<void>;

  abstract dropTable(tableName: string): Promise<void>;

  abstract insert(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any>;

  abstract update(
    tableName: string,
    id: any,
    fields: Record<string, any>,
  ): Promise<any>;

  abstract delete(tableName: string, field: string, value: any): Promise<void>;

  abstract getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>>;

  abstract getRow<T>(tableName: string, field: string, value: any): Promise<T>;
}

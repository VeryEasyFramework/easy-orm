export abstract class DatabaseAdapter<C> {
  // require constructor with a config object
  protected config: C;
  constructor(config: C) {
    this.config = config;
    this.init();
  }

  abstract init(): void;
  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract query(query: string): Promise<any>;

  abstract createTable(tableName: string, fields: any): Promise<void>;

  abstract dropTable(tableName: string): Promise<void>;

  abstract insert(tableName: string, data: Record<string, any>): Promise<any>;

  abstract update(
    tableName: string,
    id: any,
    fields: Record<string, any>,
  ): Promise<any>;

  abstract delete(tableName: string, field: string, value: any): Promise<void>;

  abstract getRows(tableName: string): Promise<any[]>;

  abstract getRow(tableName: string, field: string, value: any): Promise<any>;

  abstract getRowByField(
    tableName: string,
    field: string,
    value: any,
  ): Promise<any>;

  abstract getRowsByField(
    tableName: string,
    field: string,
    value: any,
  ): Promise<any[]>;
}

import { DatabaseAdapter } from "../databaseAdapter.ts";

export class PostgresAdapter extends DatabaseAdapter {
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
  async query(query: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async createTable(tableName: string, fields: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async dropTable(tableName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async insert(tableName: string, data: Record<string, any>): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async getRows(tableName: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  async getRow(tableName: string, field: string, value: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async getRowByField(
    tableName: string,
    field: string,
    value: any,
  ): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async getRowsByField(
    tableName: string,
    field: string,
    value: any,
  ): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
}

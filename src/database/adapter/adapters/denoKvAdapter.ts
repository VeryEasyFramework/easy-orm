import {
  AdapterColumn,
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";
import type { EntityDefinition } from "#/entity/defineEntityTypes.ts";
import type { ListOptions } from "#/database/database.ts";
import type { EasyField } from "#/entity/field/ormField.ts";

export interface DenoKvConfig {
  path?: string;
}
export class DenoKvAdapter extends DatabaseAdapter<DenoKvConfig> {
  getTableColumns(tableName: string): Promise<AdapterColumn[]> {
    throw new Error("Method not implemented.");
  }
  addColumn(tableName: string, easyField: EasyField): Promise<void> {
    throw new Error("Method not implemented.");
  }
  tableExists(tableName: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  kv!: Deno.Kv;

  async init(): Promise<void> {
    this.config.path = this.config.path || ".data/kv.db";
    const path = this.config.path.split("/")
      .slice(0, -1)
      .join("/");

    Deno.mkdirSync(path, { recursive: true });
    this.kv = await Deno.openKv(this.config.path);
  }
  async connect(): Promise<void> {
  }
  async disconnect(): Promise<void> {
  }
  async createTable(tableName: string): Promise<void> {
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
    return {} as any;
  }

  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    return {} as any;
  }
  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ): Promise<void> {
  }
  async adaptLoadValue(field: EasyField, value: any) {
  }
  async adaptSaveValue(field: EasyField | EasyFieldType, value: any) {
  }
  async syncTable(
    tableName: string,
    entity: EntityDefinition,
  ): Promise<string> {
    return "";
  }
}

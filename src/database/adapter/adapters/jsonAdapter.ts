import {
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import type { ListOptions } from "#/database/database.ts";
import type { EasyField } from "#/entity/field/ormField.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";
import { EntityDefinition } from "../../../entity/defineEntityTypes.ts";

export interface JSONConfig {
  dataPath: string;
}
export class JSONAdapter extends DatabaseAdapter<JSONConfig> {
  syncTable(tableName: string, entity: EntityDefinition): Promise<string> {
    throw new Error("Method not implemented.");
  }
  adaptLoadValue(field: EasyField, value: any): any {
    switch (field.fieldType as EasyFieldType) {
      case "BooleanField":
        break;
      case "DateField":
        break;
      case "IntField":
        break;
      case "BigIntField":
        break;
      case "DecimalField":
        break;
      case "DataField":
        break;
      case "JSONField":
        break;
      case "EmailField":
        break;
      case "ImageField":
        break;
      case "TextField":
        break;
      case "ChoicesField":
        break;
      case "MultiChoiceField":
        break;
      case "PasswordField":
        break;
      case "PhoneField":
        break;
      case "ConnectionField":
        break;
      default:
        break;
    }
    return value;
  }
  adaptSaveValue(field: EasyField, value: any): any {
    switch (field.fieldType as EasyFieldType) {
      case "BooleanField":
        break;
      case "DateField":
        break;
      case "IntField":
        break;
      case "BigIntField":
        break;
      case "DecimalField":
        break;
      case "DataField":
        break;
      case "JSONField":
        break;
      case "EmailField":
        break;
      case "ImageField":
        break;
      case "TextField":
        break;
      case "ChoicesField":
        break;
      case "MultiChoiceField":
        break;
      case "PasswordField":
        break;
      case "PhoneField":
        break;
      case "ConnectionField":
        break;
      default:
        break;
    }
    return value;
  }
  init(): Promise<void> | void {
    this.createDataPath();
  }

  private createDataPath(): void {
    try {
      Deno.mkdirSync(this.config.dataPath, { recursive: true });
    } catch (e) {
      console.log(`Error creating data path: ${e.message}`);
    }
  }
  async connect(): Promise<void> {
  }
  async disconnect(): Promise<void> {
  }
  createTable(tableName: string, fields: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dropTable(tableName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async insert(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
    const rows = await this.loadDataFromFile(tableName);
    data.id = id;
    rows.push(data);
    await this.writeDataToFile(tableName, rows);
    return data;
  }
  async update(
    tableName: string,
    id: any,
    fields: Record<string, any>,
  ): Promise<any> {
    const data = await this.loadDataFromFile(tableName);
    const index = data.findIndex((row) => row.id === id);
    if (index === -1) {
      throw new Error("Row not found");
    }
    const updatedRow = { ...data[index], ...fields };
    data[index] = updatedRow;
    await this.writeDataToFile(tableName, data);
    return updatedRow;
  }
  async delete(tableName: string, field: string, value: any): Promise<void> {
    const data = await this.loadDataFromFile(tableName);
    const index = data.findIndex((row) => row[field] === value);
    if (index === -1) {
      throw new Error("Row not found");
    }
    data.splice(index, 1);
    await this.writeDataToFile(tableName, data);
  }
  async getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>> {
    let data = await this.loadDataFromFile(tableName);
    if (data.length === 0) {
      return {
        rowCount: 0,
        totalCount: 0,
        data: [],
        columns: [],
      };
    }
    if (options?.filter) {
      for (let [key, value] of Object.entries(options.filter)) {
        data = data.filter((row) => row[key] === value);
      }
    }
    return {
      rowCount: data.length,
      totalCount: data.length,
      data: data,
      columns: Object.keys(data[0]),
    };
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    const data = await this.loadDataFromFile(tableName);
    return data.find((row) => row[field] === value);
  }
  private async writeDataToFile(tableName: string, data: any): Promise<void> {
    const path = `${this.config.dataPath}/${tableName}.json`;
    await Deno.writeTextFile(path, JSON.stringify(data, null, 2));
  }

  private async createEmptyFile(tableName: string): Promise<void> {
    const path = `${this.config.dataPath}/${tableName}.json`;
    await Deno.writeTextFile(path, "[]");
  }
  private async loadDataFromFile(tableName: string): Promise<any[]> {
    let data: any[] = [];
    try {
      const path = `${this.config.dataPath}/${tableName}.json`;
      const dataContent = await Deno.readTextFile(path);
      data = JSON.parse(dataContent);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        await this.createEmptyFile(tableName);
      }
    }
    return data;
  }
  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ): Promise<void> {
    const data = await this.loadDataFromFile(tableName);
    const newData = data.map((row) => {
      let matchesFilter = true;
      for (const [key, filterValue] of Object.entries(filters)) {
        if (row[key] !== filterValue) {
          matchesFilter = false;
          break;
        }
      }
      if (matchesFilter) {
        row[field] = value;
      }
      return row;
    });

    await this.writeDataToFile(tableName, newData);
  }
}

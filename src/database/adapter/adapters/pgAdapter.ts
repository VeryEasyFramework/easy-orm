import type { ListOptions } from "../../database.ts";
import {
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import { camelToSnakeCase, toSnakeCase } from "@vef/string-utils";
import { PostgresPool } from "#/database/adapter/adapters/postgres/pgPool.ts";
import type { PgClientConfig } from "#/database/adapter/adapters/postgres/pgTypes.ts";
import { PgError } from "#/database/adapter/adapters/postgres/pgError.ts";
import type { EasyField } from "#/entity/field/ormField.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";

export interface PostgresConfig {
  clientOptions: PgClientConfig;
  size: number;
  lazy?: boolean;
  camelCase?: boolean;
}
export class PostgresAdapter extends DatabaseAdapter<PostgresConfig> {
  adaptLoadValue(field: EasyField, value: any) {
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
        value = JSON.parse(value);
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
      case "TimeStampField":
        break;
      default:
        break;
    }
    return value;
  }
  adaptSaveValue(field: EasyField, value: any) {
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
        value = JSON.stringify(value);
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
      case "TimeStampField":
        break;
      default:
        break;
    }
    return value;
  }
  private pool!: PostgresPool;
  camelCase: boolean = false;

  async init(): Promise<void> {
    const config = this.config;
    this.camelCase = config.camelCase || false;
    this.pool = new PostgresPool(this.config);
    await this.pool.initialized();
  }

  async connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async disconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async query<T>(query: string): Promise<RowsResult<T>> {
    const result = await this.pool.query<T>(query);
    const columns = result.columns.map((column) => {
      return this.camelCase ? column.camelName : column.name;
    });

    return {
      rowCount: result.rowCount,
      data: result.rows,
      columns: columns,
    };
  }

  async createTable(tableName: string, fields: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async dropTable(tableName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async insert(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
    const columns = this.getColumns(data);
    const values = this.getValues(data);
    const valuesWithColumns = columns.join(", ");
    const valuesString = values.join(", ");
    const query =
      `INSERT INTO ${tableName} (${valuesWithColumns}) VALUES (${valuesString}) RETURNING *`;
    const result = await this.query(query);
    return result;
  }

  async delete(tableName: string, field: string, value: any): Promise<void> {
    const query = `DELETE FROM ${tableName} WHERE ${field} = ${value}`;
    await this.query(query);
  }
  private getColumns(data: Record<string, any>): string[] {
    return Object.keys(data).map((key) => camelToSnakeCase(key));
  }
  private getValues(data: Record<string, any>): string[] {
    const values = Object.values(data);
    return values.map((value) => {
      if (typeof value === "string") {
        return `'${value}'`;
      }
      return value;
    });
  }
  async update(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
    const columns = this.getColumns(data);
    const values = this.getValues(data);
    const valuesWithColumns = columns.map((column, index) => {
      return `${column} = ${values[index]}`;
    });
    const query = `UPDATE ${tableName} SET ${
      valuesWithColumns.join(
        ", ",
      )
    } WHERE id = ${id}`;
    const result = await this.query(query);
    return result;
  }
  async getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>> {
    if (!options) {
      options = {} as ListOptions;
    }
    let columns = "*";
    if (options.columns) {
      columns = options.columns.map((column) => {
        return camelToSnakeCase(column);
      }).join(", ");
    }
    let query = `SELECT ${columns} FROM ${tableName}`;

    if (options.filter) {
      const keys = Object.keys(options.filter);
      const filters = keys.map((key) => {
        const value = options!.filter![key];
        return `${toSnakeCase(key)} = ${formatValue(value)}`;
      });
      query += ` WHERE ${filters.join(" AND ")}`;
    }

    if (options.orderBy) {
      query += ` ORDER BY ${camelToSnakeCase(options.orderBy)}`;
      const order = options.order || "ASC";
      query += ` ${order}`;
    }

    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }

    const result = await this.query<T>(query);

    return result;
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    if (this.camelCase) {
      field = camelToSnakeCase(field);
    }
    value = formatValue(value);
    const query = `SELECT * FROM ${tableName} WHERE ${field} = ${value}`;
    const result = await this.query<T>(query);
    if (result.rowCount === 0) {
      throw new PgError({
        message: `No row found in ${tableName} where ${field} = ${value}`,
      });
    }
    return result.data[0];
  }
  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ): Promise<void> {
    let query = `UPDATE ${tableName} SET ${field} = ${value}`;
    if (filters) {
      query += " WHERE ";
      query += Object.entries(filters)
        .map(([key, value]) => {
          key = camelToSnakeCase(key);
          return `${key} = ${value}`;
        })
        .join(" AND ");
    }
    await this.query(query);
  }
}

function formatValue(value: any): string {
  if (typeof value === "string") {
    return `'${value}'`;
  }
  return value;
}

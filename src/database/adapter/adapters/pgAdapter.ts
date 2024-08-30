import type { ListOptions } from "../../database.ts";
import {
  type AdapterColumn,
  DatabaseAdapter,
  type RowsResult,
} from "#/database/adapter/databaseAdapter.ts";
import { camelToSnakeCase, toCamelCase } from "@vef/string-utils";
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
  schema?: string;
}

interface PostgresColumn {
  columnName: string;
  dataType: string;
  columnDefault: any;
  isNullable: string;
  isIdentity: string;
}
export class PostgresAdapter extends DatabaseAdapter<PostgresConfig> {
  // columns: AdapterColumn[];
  // name: string;
  // type: string;
  // nullable: boolean;
  // default: any;
  // primaryKey: boolean;
  // unique: boolean;

  private pool!: PostgresPool;
  camelCase: boolean = false;

  schema: string = "public";

  toSnake(value: string): string {
    return camelToSnakeCase(value);
  }
  async init(): Promise<void> {
    const config = this.config;
    this.camelCase = config.camelCase || false;
    this.pool = new PostgresPool(this.config);
    await this.pool.initialized();
  }

  async connect(): Promise<void> {
  }
  async disconnect(): Promise<void> {
  }
  async query<T>(query: string): Promise<RowsResult<T>> {
    const result = await this.pool.query<T>(query);
    const columns = result.columns.map((column) => {
      return this.camelCase ? column.camelName : column.name;
    });

    return {
      rowCount: result.rowCount,
      totalCount: result.rowCount,
      data: result.rows,
      columns: columns,
    };
  }

  async getTableColumns(tableName: string): Promise<AdapterColumn[]> {
    tableName = this.toSnake(tableName);
    const query =
      `SELECT column_name, data_type, column_default, is_nullable, is_identity FROM information_schema.columns WHERE table_schema = '${this.schema}' AND table_name = '${tableName}'`;
    const result = await this.query<PostgresColumn>(query);
    return result.data.map((column) => {
      return {
        name: toCamelCase(column.columnName),
        type: column.dataType,
        nullable: column.isNullable === "YES",
        default: column.columnDefault,
        primaryKey: column.isIdentity === "YES",
        unique: false,
      };
    });
  }
  async addColumn(tableName: string, easyField: EasyField): Promise<void> {
    tableName = this.toSnake(tableName);
    const columnName = camelToSnakeCase(easyField.key as string);
    const columnType = this.getColumnType(easyField);
    const query =
      `ALTER TABLE ${this.schema}.${tableName} ADD "${columnName}" ${columnType}`;
    // return query;
    await this.query(query);
  }
  async tableExists(tableName: string): Promise<boolean> {
    tableName = this.toSnake(tableName);
    const query =
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.schema}' AND table_name = '${tableName}'`;
    const result = await this.query<{ tableName: string }>(query);
    return result.rowCount > 0;
  }
  async createTable(tableName: string, idField: EasyField): Promise<void> {
    tableName = this.toSnake(tableName);
    const columnName = camelToSnakeCase(idField.key as string);

    const columnType = this.getColumnType(idField);

    const query =
      `CREATE TABLE ${this.schema}.${tableName} (${columnName} ${columnType} PRIMARY KEY)`;
    await this.query<any>(query);
  }
  async dropTable(tableName: string): Promise<void> {
    tableName = this.toSnake(tableName);
    throw new Error(`dropTable not implemented for postgres`);
  }

  async insert(
    tableName: string,
    id: string,
    data: Record<string, any>,
  ): Promise<any> {
    tableName = this.toSnake(tableName);
    const columns = this.getColumns(data);
    const values = this.getValues(data);
    const valuesWithColumns = columns.join(", ");
    const valuesString = values.join(", ");
    const query =
      `INSERT INTO ${this.schema}.${tableName} (${valuesWithColumns}) VALUES (${valuesString}) RETURNING *`;
    const result = await this.query(query);
    return result;
  }

  async delete(tableName: string, field: string, value: any): Promise<void> {
    tableName = this.toSnake(tableName);
    const query =
      `DELETE FROM ${this.schema}.${tableName} WHERE ${field} = ${value}`;
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
    id: string | number,
    data: Record<string, any>,
  ): Promise<any> {
    tableName = this.toSnake(tableName);
    const columns = this.getColumns(data);
    const values = this.getValues(data);
    const idValue = typeof id === "string" ? `'${id}'` : id;
    const valuesWithColumns = columns.map((column, index) => {
      return `${column} = ${values[index]}`;
    });
    const query = `UPDATE ${this.schema}.${tableName} SET ${
      valuesWithColumns.join(
        ", ",
      )
    } WHERE id = ${idValue}`;
    const result = await this.query(query);
    return result;
  }

  async getRows<T>(
    tableName: string,
    options?: ListOptions,
  ): Promise<RowsResult<T>> {
    tableName = this.toSnake(tableName);
    if (!options) {
      options = {} as ListOptions;
    }
    let columns = "*";
    if (options.columns) {
      columns = options.columns.map((column) => {
        return camelToSnakeCase(column);
      }).join(", ");
    }
    let query = `SELECT ${columns} FROM ${this.schema}.${tableName}`;
    let countQuery = `SELECT COUNT(*) FROM ${this.schema}.${tableName}`;

    if (options.filter) {
      const keys = Object.keys(options.filter);
      const filters = keys.map((key) => {
        const value = options!.filter![key];
        const filter = `${camelToSnakeCase(key)} = ${formatValue(value)}`;
        return filter;
      });
      const filterQuery = ` WHERE ${filters.join(" AND ")}`;
      query += filterQuery;
      countQuery += filterQuery;
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
    result.totalCount = result.rowCount;
    if (options.limit) {
      const countResult = await this.query<{ count: number }>(countQuery);
      result.totalCount = countResult.data[0].count;
    }

    return result;
  }
  async getRow<T>(tableName: string, field: string, value: any): Promise<T> {
    tableName = this.toSnake(tableName);
    if (this.camelCase) {
      field = camelToSnakeCase(field);
    }
    value = formatValue(value);
    const query =
      `SELECT * FROM ${this.schema}.${tableName} WHERE ${field} = ${value}`;
    const result = await this.query<T>(query);
    if (result.rowCount === 0) {
      throw new PgError({
        message: `No row found in ${tableName} where ${field} = ${value}`,
      });
    }
    return result.data[0];
  }

  private makeFilter(filters: Record<string, any>): string {
    return Object.entries(filters)
      .map(([key, value]) => {
        key = camelToSnakeCase(key);
        return `${key} = ${formatValue(value)}`;
      })
      .join(" AND ");
  }
  async batchUpdateField(
    tableName: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ): Promise<void> {
    tableName = this.toSnake(tableName);
    let query = `UPDATE ${this.schema}.${tableName} SET ${
      camelToSnakeCase(field)
    } = ${formatValue(value)}`;
    if (filters) {
      query += " WHERE ";
      query += this.makeFilter(filters);
    }
    await this.query(query);
  }

  getColumnType(field: EasyField): string {
    switch (field.fieldType as EasyFieldType) {
      case "BooleanField":
        return "BOOLEAN";
      case "DateField":
        return "DATE";
      case "IntField":
        return "INTEGER";
      case "BigIntField":
        return "BIGINT";
      case "DecimalField":
        return "DECIMAL";
      case "DataField":
        return "VARCHAR(255)";
      case "JSONField":
        return "JSONB";
      case "EmailField":
        return "TEXT";
      case "ImageField":
        return "TEXT";
      case "TextField":
        return "TEXT";
      case "ChoicesField":
        return "TEXT";
      case "MultiChoiceField":
        return "TEXT";
      case "PasswordField":
        return "TEXT";
      case "PhoneField":
        return "TEXT";
      case "ConnectionField":
        return "TEXT";
      case "TimeStampField":
        return "TIMESTAMP";
      case "IDField":
        return "VARCHAR(255)";
      default:
        return "TEXT";
    }
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
        value = new Date(value).getTime();
        break;
      default:
        break;
    }
    return value;
  }
  adaptSaveValue(field: EasyField | EasyFieldType, value: any): any {
    const fieldType = typeof field === "string" ? field : field.fieldType;
    if (value === null) {
      return null;
    }
    switch (fieldType as EasyFieldType) {
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
        value = value ? JSON.stringify(value) : null;
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
        value = new Date(value).toISOString();
        break;
      default:
        break;
    }
    return value;
  }
}

function formatValue(value: any): string {
  if (typeof value === "string") {
    // check if there's already a single quote
    if (value.includes("'")) {
      // escape the single quote
      value = value.replace(/'/g, "''");
    }
    return `'${value}'`;
  }
  if (!value) {
    return "null";
  }
  return value;
}

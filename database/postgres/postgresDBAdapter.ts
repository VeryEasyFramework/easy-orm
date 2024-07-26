import {EntityMeta, IRLRecord} from "../../model/modelTypes.ts";
import {AccountName, IRLDBAdapterClass, RecordId, TableName} from "../dbTypes.ts";
import {PostgresClient} from "./postgresClient.ts";
import {raiseIRLException} from "../../exceptions/exceptions.ts";
import {PgError} from "./pgError.ts";


//
// | "ID"
// | "Serial"
// | "Link"
// | "Data"
// | "Text"
// | "LongText"
// | "Json"
// | "Boolean"
// | "Number"
// | "Integer"
// | "Float"
// | "Datetime"
// | "Date"
// | "Time"
// | "Duration"
// | "Password"
// | "Email"
// | "Phone"
// | "Currency"
// | "Select"
// | "Image"
// | "File"
const columnTypeMap: Record<string, string> = {
    ID: 'VARCHAR(24)',
    Serial: 'SERIAL',
    Link: 'VARCHAR(24)',
    Data: 'VARCHAR(255)',
    Text: 'TEXT',
    LongText: 'TEXT',
    Json: 'JSON',
    Boolean: 'BOOLEAN',
    Number: 'FLOAT',
    Integer: 'INTEGER',
    Float: 'FLOAT',
    Datetime: 'TIMESTAMP',
    Date: 'DATE',
    Time: 'TIME',
    Duration: 'VARCHAR(24)',
    Password: 'VARCHAR(24)',
    Email: 'VARCHAR(255)',
    Phone: 'VARCHAR(24)',
    Currency: 'FLOAT',
    Select: 'VARCHAR(24)',
    Image: 'VARCHAR(255)',
    File: 'VARCHAR(255)',

}

export class PostgresDB extends IRLDBAdapterClass {
    client: PostgresClient;

    constructor() {
        super();
        console.log('PostgresDB instance created');
        this.client = new PostgresClient({
            database: 'irl',
            unixPath: '/var/run/postgresql/.s.PGSQL.5432',
            user: 'eliveffer',
            options: {
                'client_encoding': 'UTF8',
                'application_name': 'deno-postgres',
            }
        });
    }

    async boot() {
        await this.client.connect();
    }

    async query(query: string) {
        try {
            const response = this.client.query(query);
            return response;
        } catch (e) {
            console.log('Error in query', e);
            if (e instanceof PgError) {

                raiseIRLException(e.message, 'DatabaseError', e.name);
            }
        }
    }

    get connection() {
        return this.client.conn;
    }

    async accountExists(accountName: AccountName): Promise<boolean> {
        return Promise.resolve(false);
    }

    async createAccount(accountName: AccountName): Promise<void> {
        await this.query(`CREATE SCHEMA IF NOT EXISTS ${accountName};`);
    }

    async createTable(accountName: AccountName, tableName: TableName): Promise<void> {
        const query = `CREATE TABLE IF NOT EXISTS ${accountName}.${tableName}
                       (
                           id         VARCHAR(24) PRIMARY KEY,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                       );`;
        await this.query(query);
    }

    async addColumn(accountName: AccountName, tableName: TableName, columnName: string, columnType: string): Promise<void> {
        columnType = columnTypeMap[columnType];
        const query = `ALTER TABLE ${accountName}.${tableName}
            ADD COLUMN ${columnName} ${columnType};`;
        await this.query(query);
    }

    async deleteTable(accountName: AccountName, tableName: TableName): Promise<void> {
        const query = `DROP TABLE IF EXISTS ${accountName}.${tableName};`;
        await this.query(query);
    }

    getRows(accountName: AccountName, tableName: TableName): Promise<Record<string, any>[]> {

        return Promise.resolve([]);
    }

    deleteRow(accountName: AccountName, tableName: TableName, id: RecordId): Promise<void> {
        return Promise.resolve(undefined);
    }

    updateRow(accountName: AccountName, tableName: TableName, id: RecordId, data: Record<string, any>): Promise<void> {
        return Promise.resolve(undefined);
    }

    addRow(accountName: AccountName, tableName: TableName, data: Record<string, any>): Promise<void> {
        return Promise.resolve(undefined);
    }

    getRow(accountName: AccountName, tableName: TableName, id: RecordId): Promise<Record<string, any>> {

        return Promise.resolve({});
    }


}


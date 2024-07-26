import {IRLModel, IRLRecord} from "../model/modelTypes.ts";

export type AccountName = string;
export type TableName = string;
export type ModelId = string;
export type RecordId = string;

export interface IRLDBAdapter {
    table: {
        writer: (accountName: AccountName, tableName: TableName) => Promise<void>;
        reader: (
            accountName: AccountName,
            tableName?: TableName,
        ) => Promise<string[] | boolean>;
    };
    record: {
        create: (
            accountName: AccountName,
            model: IRLModel,
            data: IRLRecord,
        ) => Promise<void>;
        update: (
            accountName: AccountName,
            model: IRLModel,
            data: IRLRecord,
        ) => Promise<IRLRecord>;
        delete: (
            accountName: AccountName,
            model: IRLModel,
            id: RecordId,
        ) => Promise<IRLRecord>;
        getSingle: (
            accountName: AccountName,
            model: IRLModel,
            id: RecordId,
        ) => Promise<IRLRecord>;
        getList: (accountName: AccountName, model: IRLModel, options?: {
            columns?: string[];
            filters?: Record<string, any>;
        }) => Promise<IRLRecord[]>;
    };
}

export abstract class IRLDBAdapterClass {
    abstract boot(): Promise<void>;

    abstract createAccount(accountName: AccountName): Promise<void>;

    abstract createTable(accountName: AccountName, tableName: TableName): Promise<void>;

    abstract deleteTable(accountName: AccountName, tableName: TableName): Promise<void>;

    abstract addRow(accountName: AccountName, tableName: TableName, data: Record<string, any>): Promise<void>;

    abstract getRow(accountName: AccountName, tableName: TableName, id: RecordId): Promise<Record<string, any>>;

    abstract getRows(accountName: AccountName, tableName: TableName): Promise<Record<string, any>[]>;

    abstract updateRow(accountName: AccountName, tableName: TableName, id: RecordId, data: Record<string, any>): Promise<void>;

    abstract deleteRow(accountName: AccountName, tableName: TableName, id: RecordId): Promise<void>;


}

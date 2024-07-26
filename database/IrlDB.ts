import {EntityMeta, IRLRecord} from "../model/modelTypes.ts";
import {AccountName, IRLDBAdapter, IRLDBAdapterClass, ModelId, RecordId} from "./dbTypes.ts";
import {jsonDBAdapter} from "./adapters/jsonAdapter.ts";
import {PostgresDB} from "./postgres/postgresDBAdapter.ts";
import {MemcachePool} from "../../wip/cache/main.ts";

export class IRLDB {
    name: string = "DbAdapter";
    dbName: string = "DbAdapter";
    cache: MemcachePool;
    adapter: PostgresDB;
    models: EntityMeta[] = [];
    accountName: AccountName = "default_account";


    constructor(cache: MemcachePool) {
        this.cache = cache;
        this.adapter = new PostgresDB();
    }


    async boot() {
        await this.refreshModels();
        await this.adapter.boot();
    }

    async refreshModels() {
        this.models = await this.cache.getList("models");
    }


    async migrate() {
        await this.refreshModels();
        const syncModel = (account: AccountName, model: EntityMeta) => {
            this.adapter.createTable(account, model.id);
            for (const field of model.fields) {
                this.adapter.addColumn(account, model.id, field.id, field.fieldType);
            }
        }
        const globalModels = this.models.filter((m) => m.global);
        const accountModels = this.models.filter((m) => !m.global);
        const account = this.accountName;
        this.accountName = "global";
        if (!await this.adapter.accountExists("global")) {
            await this.adapter.createAccount("global");
        }
        if (!await this.adapter.accountExists(account)) {
            await this.adapter.createAccount(account);
        }
        for (const model of globalModels) {
            await syncModel("global", model);
        }
        this.accountName = account;

        for (const model of accountModels) {
            await syncModel(account, model);
        }
    }

    async createRecord<T extends IRLRecord>(
        modelId: ModelId,
        data: Partial<T>,
    ): Promise<IRLRecord> {
        const model = this.models.find((m) => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }
        const account = model.global ? "global" : this.accountName;

        const id = Math.random().toString(36).substring(7);
        const newRecord = {
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...data,
        } as IRLRecord;
        await this.adapter.addRow(account, model.id, newRecord);
        return newRecord;
    }

    async getRecord<T extends IRLRecord>(
        modelId: ModelId,
        id: RecordId,
    ): Promise<T> {
        const model = this.models.find((m) => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${model} not found`);
        }
        const account = model.global ? "global" : this.accountName;
        // return await this.adapter.record.getSingle(account, model, id) as T;
        return {} as T;
    }

    async updateRecord<T extends IRLRecord>(
        modelId: ModelId,
        id: RecordId,
        data: Partial<T>,
    ): Promise<T> {
        const model = this.models.find((m) => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${model} not found`);
        }
        const account = model.global ? "global" : this.accountName;
        const recordData = {
            id,
            updated_at: new Date().toISOString(),
            ...data,
        } as IRLRecord;
        // return await this.adapter.record.update(account, model, recordData) as T;
        return {} as T;
    }

    async deleteRecord<T extends IRLRecord>(
        modelId: ModelId,
        id: RecordId,
    ): Promise<T> {
        const model = this.models.find((m) => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${model} not found`);
        }
        const account = model.global ? "global" : this.accountName;
        // return await this.adapter.record.delete(account, model, id) as T;
        return {} as T;
    }

    async listRecords<T extends IRLRecord>(modelId: ModelId, options?: {
        columns?: string[];
        filters?: Record<string, any>;
    }): Promise<Partial<T>[]> {
        const model = this.models.find((m) => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${model} not found`);
        }
        const account = model.global ? "global" : this.accountName;
        // return await this.adapter.record.getList(account, model, options) as T[];
        return [] as T[];
    }
}

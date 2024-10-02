import type {
   EntityAction,
   EntityDefinition,
} from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import type { HookFunction } from "#/entity/entity/entityRecord/entityRecordTypes.ts";
import type {
   EasyFieldType,
   EasyFieldTypeMap,
   SafeType,
} from "#/entity/field/fieldTypes.ts";
import { raiseOrmException } from "#/ormException.ts";
import type { EasyOrm } from "#/orm.ts";
import { dateUtils } from "#/utils/dateUtils.ts";
import { generateId, isEmpty } from "#/utils/misc.ts";
import { validateField } from "#/entity/field/validateField.ts";

export interface EntityRecord {
   beforeInsert(): Promise<void>;
   afterInsert(): Promise<void>;
   beforeSave(): Promise<void>;
   afterSave(): Promise<void>;
   validate(data: Record<string, any>): Promise<void>;
   load(id: string | number): Promise<void>;
   save(): Promise<Record<string, any>>;
   delete(): Promise<void>;
   update(data: Record<string, any>): Promise<void>;
   syncFetchFields(): Promise<void>;

   [key: string]: SafeType | undefined;
}
export class EntityRecord implements EntityRecord {
   private _data: Record<string, any> = {};
   private _prevData: Record<string, any> = {};
   private _isNew: boolean = false;
   private _primaryKey?: string;
   orm!: EasyOrm;

   get primaryKey(): string | undefined {
      return this._primaryKey;
   }
   set primaryKey(value: string | undefined) {
      this._primaryKey
         ? raiseOrmException(
            "PrimaryKeyAlreadySet",
            "Primary key is already set",
         )
         : this._primaryKey = value;
   }
   get id(): EasyFieldTypeMap["IDField"] {
      if (this.primaryKey) {
         return this._data[this.primaryKey];
      }
      return this._data.id;
   }

   get createdAt(): EasyFieldTypeMap["TimeStampField"] {
      return this._data.createdAt;
   }

   set createdAt(value: EasyFieldTypeMap["TimeStampField"]) {
      this._data.createdAt = value;
   }

   get updatedAt(): EasyFieldTypeMap["TimeStampField"] {
      return this._data.updatedAt;
   }

   set updatedAt(value: EasyFieldTypeMap["TimeStampField"]) {
      this._data.updatedAt = value;
   }
   get data(): Record<string, SafeType> {
      const keys = this.entityDefinition.fields.filter((field) => field.hidden)
         .map((field) => field.key);
      const data = { ...this._data };
      for (const key of keys) {
         delete data[key];
      }

      return data;
   }
   entityDefinition!: EntityDefinition;

   _beforeInsert!: Array<HookFunction>;

   _afterInsert!: Array<HookFunction>;

   _beforeSave!: Array<HookFunction>;

   _afterSave!: Array<HookFunction>;

   _validate!: Array<HookFunction>;

   _beforeValidate!: Array<HookFunction>;

   actions!: Record<string, EntityAction>;

   async beforeInsert() {
      this._data = this.setDefaultValues(this._data);
      for (const hook of this._beforeInsert) {
         await hook(this);
      }
      this.setCreatedAt();
   }
   async afterInsert() {
      for (const hook of this._afterInsert) {
         await hook(this);
      }
   }
   async beforeSave() {
      for (const hook of this._beforeSave) {
         await hook(this);
      }
      this.setUpdatedAt();
   }
   async afterSave() {
      await this.syncFetchFields();
      for (const hook of this._afterSave) {
         await hook(this);
      }
   }
   async validate(data: Record<string, any>) {
      data = this.dropExtraFields(data);
      data = this.validateFieldTypes(data);

      data = await this.validateConnections(data);

      this._data = data;
      for (const hook of this._beforeValidate) {
         await hook(this);
      }
      this.setIdIfNew();
      for (const hook of this._validate) {
         await hook(this);
      }
   }

   async load(id: string | number) {
      const idKey = this.primaryKey || "id";
      const data = await this.orm.database.getRow(
         this.entityDefinition.config.tableName,
         idKey,
         id,
      );
      this._data = this.parseDatabaseRow(data);
   }

   /**
    * This method is used to save the entity to the database.
    * It returns the changed data.
    */
   async save(): Promise<Record<string, any>> {
      await this.validate(this._data);

      await this.getFetchedFields();
      if (this._isNew) {
         await this.beforeInsert();
         await this.beforeSave();
         const changed = this.adaptChangedData(this._data);
         await this.orm.database.insertRow(
            this.entityDefinition.config.tableName,
            this.id,
            changed,
         );
         await this.afterInsert();
         await this.afterSave();
         this._isNew = false;
         return changed;
      }
      await this.beforeSave();
      let changedData = this.getChangedData();
      changedData = this.adaptChangedData(changedData);
      await this.orm.database.updateRow(
         this.entityDefinition.config.tableName,
         this.id,
         changedData,
      );
      await this.afterSave();
      return changedData;
   }
   async delete() {
      if (!this.id) {
         raiseOrmException("InvalidId", "Cannot delete entity without an id");
      }
      const idKey = this.primaryKey || "id";
      await this.orm.database.deleteRow(
         this.entityDefinition.config.tableName,
         idKey,
         this.id,
      );
   }

   async update(data: Record<string, any>): Promise<void> {
      data = this.validateFieldTypes(data);
      this._prevData = { ...this._data };
      const mergedData = { ...this._data, ...data };
      this._data = {
         ...mergedData,
      };
      await this.validate(mergedData);
   }

   async runAction<R = void>(
      actionKey: string,
      data?: Record<string, SafeType>,
   ): Promise<R> {
      const action = this.actions[actionKey];
      if (!action) {
         raiseOrmException(
            "InvalidAction",
            `Action ${actionKey} not found in entity ${this.entityDefinition.entityId}`,
         );
      }
      if (action.params) {
         for (const param of action.params) {
            if (param.required && !data?.[param.key]) {
               raiseOrmException(
                  "MissingActionParam",
                  `Missing required param ${param.key} for action ${actionKey}`,
               );
            }
         }
      }
      return await action.action(this, data) as R;
   }
   /**
    * Base fields
    */

   private setCreatedAt() {
      if (!this.createdAt) {
         this.createdAt = dateUtils.nowTimestamp();
      }
   }

   private setUpdatedAt() {
      this.updatedAt = dateUtils.nowTimestamp();
   }

   private async setIdIfNew() {
      if (!this.id) {
         this._isNew = true;
         const method = this.entityDefinition.config.idMethod;
         let id: string | number | null;
         switch (method.type) {
            case "hash":
               id = generateId(method.hashLength);
               break;
            case "number": {
               const result = await this.orm.database.getRows(
                  this.entityDefinition.config.tableName,
                  {
                     orderBy: "id",
                     order: "desc",
                     limit: 1,
                     columns: ["id"],
                  },
               );
               if (result.rowCount > 0) {
                  id = result.data[0].id as number + 1;
                  break;
               }
               id = 1;
               break;
            }
            case "uuid":
               id = crypto.randomUUID();
               break;
            case "series":
               id = null;
               break;
            case "data":
               id = null;
               break;
            case "field":
               if (!method.field) {
                  raiseOrmException(
                     "InvalidField",
                     "Field method requires a field name",
                  );
               }
               id = this._data[method.field];
               break;
         }
         if (this.primaryKey) {
            this._data[this.primaryKey] = id;
            return;
         }
         this._data.id = id;
      }
   }
   private parseDatabaseRow(row: Record<string, any>) {
      const data: Record<string, SafeType> = {};
      ["id", "createdAt", "updatedAt"].forEach((key) => {
         if (key in row) {
            data[key] = row[key];
         }
      });
      this.entityDefinition.fields.forEach((field) => {
         if (field.key in row) {
            data[field.key] = this.orm.database.adaptLoadValue(
               field,
               row[field.key],
            );
         }
      });
      return data;
   }
   private getChangedData() {
      const changedData: Record<string, any> = {};
      for (const key in this._data) {
         if (this._data[key] != this._prevData[key]) {
            changedData[key] = this._data[key];
         }
      }
      return changedData;
   }
   private adaptChangedData(changedData: Record<string, any>) {
      const adaptedData: Record<string, any> = {};
      for (const key in changedData) {
         if (key === "updatedAt" || key === "createdAt") {
            adaptedData[key] = this.orm.database.adaptSaveValue(
               "TimeStampField",
               changedData[key],
            );
            continue;
         }
         if (key === "id") {
            adaptedData[key] = this.orm.database.adaptSaveValue(
               this.orm.idFieldType,
               changedData[key],
            );
            continue;
         }
         let fieldType: EasyFieldType | undefined;
         this.entityDefinition.fields.forEach((field) => {
            if (field.key === key) {
               fieldType = field.fieldType;
            }
         });

         if (!fieldType) {
            raiseOrmException(
               "InvalidField",
               `Field ${key} not found in entity ${this.entityDefinition.entityId}`,
            );
         }

         adaptedData[key] = this.orm.database.adaptSaveValue(
            fieldType,
            changedData[key],
         );
      }
      return adaptedData;
   }
   /**
    * Fetch Fields Magic
    */

   async syncFetchFields() {
      // return;
      const entry = this.orm.registry.findInRegistry(
         this.entityDefinition.entityId,
      );
      if (!entry) {
         return;
      }
      const fieldKeys = Object.keys(entry);
      for (const key of fieldKeys) {
         const value = this._data[key];
         const oldValue = this._prevData[key];
         if (value === oldValue) {
            // continue;
         }
         const targets = entry[key];
         for (const target of targets) {
            await this.orm.batchUpdateField(
               target.entity,
               target.field as string,
               value,
               {
                  [target.idKey]: this.id,
               },
            );
         }
      }
   }

   private async getFetchedFields() {
      const fields = this.entityDefinition.fields.filter((field) =>
         field.fetchOptions
      );
      for (const field of fields) {
         //  field.fetchOptions!.thisIdKey

         const { fetchEntity, thatFieldKey, thisFieldKey, thisIdKey } = field
            .fetchOptions!;

         const id = this._data[thisIdKey];
         const value = await this.orm.getValue(
            fetchEntity,
            this._data[thisIdKey],
            thatFieldKey,
         );
         this._data[thisFieldKey] = value;
      }
   }
   /**
    * Validation Section
    */

   private validateFieldTypes(data: Record<string, any>) {
      for (const field of this.entityDefinition.fields) {
         if (field.fieldType === "ConnectionField") {
            continue;
         }
         if (!(field.key in data)) {
            continue;
         }
         let value = data[field.key as string];
         value = validateField(field, value);
         data[field.key as string] = value;
      }
      return data;
   }
   private dropExtraFields(data: Record<string, any>) {
      const fields = this.entityDefinition.fields.map((field) => field.key);
      for (const key in data) {
         if (key! in fields) {
            delete data[key];
         }
      }
      return data;
   }

   private setDefaultValues(data: Record<PropertyKey, any>) {
      for (const field of this.entityDefinition.fields) {
         if (field.key in data && !isEmpty(data[field.key])) {
            continue;
         }

         if (field.defaultValue) {
            data[field.key] = typeof field.defaultValue === "function"
               ? field.defaultValue()
               : field.defaultValue;
            continue;
         }
         switch (field.fieldType) {
            case "BooleanField":
               data[field.key] = false;
               break;
            case "JSONField":
               data[field.key] = {};
               break;
            case "IntField" || "BigIntField":
               data[field.key] = 0;
               break;
            default:
               if (Object.keys(data).includes(field.key as string)) {
                  data[field.key] = null;
               }
               break;
         }
      }
      return data;
   }
   private async validateConnections(data: Record<PropertyKey, any>) {
      const connectionFields = this.entityDefinition.fields.filter((field) =>
         field.fieldType === "ConnectionField"
      );
      for (const field of connectionFields) {
         // const connectionFields = field.connection!.fetchFields || [];
         // if it's empty, clear any fetch fields
         if (isEmpty(data[field.key])) {
            if (field.connectionTitleField) {
               data[field.connectionTitleField] = null;
            }
            continue;
         }
         if (!field.connectionEntity) {
            raiseOrmException(
               "InvalidConnection",
               `Connection field ${field
                  .key as string} in ${this.entityDefinition.entityId} is missing connectionEntity `,
            );
         }
         if (!await this.orm.exists(field.connectionEntity, data[field.key])) {
            raiseOrmException(
               "EntityNotFound",
               `Connection ${field.connectionEntity} with id ${
                  data[field.key]
               } does not exist`,
            );
         }

         // if (field.connectionTitleField) {
         //   const entity = await this.orm.getEntity(
         //     field.connectionEntity,
         //     data[field.key],
         //   );
         //   data[field.connectionTitleField] = entity[field.connectionTitleField];
         // }
      }
      return data;
   }
}

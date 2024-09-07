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
  save(): Promise<void>;
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
    return this._data;
  }
  entityDefinition!: EntityDefinition;

  _beforeInsert!: Array<HookFunction>;

  _afterInsert!: Array<HookFunction>;

  _beforeSave!: Array<HookFunction>;

  _afterSave!: Array<HookFunction>;

  _validate!: Array<HookFunction>;

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
  async save() {
    await this.validate(this._data);
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
      return;
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
    await this.validate(mergedData);
  }

  async runAction(
    actionKey: string,
    data?: Record<string, SafeType>,
  ): Promise<void | SafeType> {
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
    return await action.action(this, data);
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

  private setIdIfNew() {
    if (!this.id) {
      this._isNew = true;
      if (this.primaryKey) {
        this._data[this.primaryKey] = generateId();
        return;
      }
      this._data.id = generateId();
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
      if (this._data[key] !== this._prevData[key]) {
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
        for (const fetchField of connectionFields) {
          data[fetchField.key] = null;
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

      // Fetch fields
      if (connectionFields.length > 0) {
        const connectionData = await this.orm.getEntity(
          field.connectionEntity,
          data[field.key],
        );
        for (const connectionField of connectionFields) {
          if (connectionField.key in connectionData) {
            data[connectionField.key] =
              connectionData[connectionField.key as keyof EntityRecord];
          }
        }
      }
    }
    return data;
  }
}

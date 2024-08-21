import type {
  EntityClassConstructor,
  EntityDefFromModel,
  EntityDefinition,
  EntityHooks,
  Orm,
} from "#/entity/defineEntityTypes.ts";
import type { EasyField } from "#/entity/field/ormField.ts";
import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";
import { now } from "#/utils/dateUtils.ts";
import { generateId } from "#/utils/misc.ts";
import { raiseOrmException } from "#/ormException.ts";
import {
  validateBigInt,
  validateBoolean,
  validateChoices,
  validateData,
  validateDate,
  validateDecimal,
  validateEmail,
  validateInt,
  validateJson,
  validateMultiChoices,
  validatePassword,
  validatePhone,
  validateTextField,
  validateTimeStamp,
} from "#/entity/field/validateField.ts";

const isEmpty = (value: any) => {
  return value === null || value === undefined || value === "";
};
class EntityClass {
  private orm!: Orm;
  private fields!: EasyField[];

  private meta!: EntityDefinition;
  private _primaryKey?: string;

  get primaryKey() {
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
  private _prevData: Record<string, any> = {};
  private _isNew: boolean = false;
  get id(): EasyFieldTypeMap["IDField"] {
    if (this.primaryKey) {
      return this._data[this.primaryKey];
    }
    return this._data.id;
  }

  get createdAt(): EasyFieldTypeMap["DateField"] {
    return this._data.createdAt;
  }

  set createdAt(value: EasyFieldTypeMap["DateField"]) {
    this._data.createdAt = value;
  }

  get updatedAt(): EasyFieldTypeMap["DateField"] {
    return this._data.updatedAt;
  }

  set updatedAt(value: EasyFieldTypeMap["DateField"]) {
    this._data.updatedAt = value;
  }

  private _data: Record<string, any> = {};
  get data() {
    return this._data;
  }
  constructor() {
  }
  async load(id: EasyFieldTypeMap["IDField"]) {
    const idKey = this.primaryKey || "id";
    const result = await this.orm.database.getRow(
      this.meta.tableName,
      idKey,
      id,
    ) as Record<string, any>;
    this._data = this.parseDatabaseRow(result);
  }

  private parseDatabaseRow(row: Record<string, any>) {
    const data: Record<string, any> = {};
    ["id", "createdAt", "updatedAt"].forEach((key) => {
      if (key in row) {
        data[key] = row[key];
      }
    });
    for (const field of this.fields) {
      data[field.key as string] = this.orm.database.adaptLoadValue(
        field,
        row[field.key as string],
      );
    }

    return data;
  }

  async delete() {
    if (!this.id) {
      raiseOrmException("InvalidId", "Cannot delete entity without an id");
    }
    const idKey = this.primaryKey || "id";
    await this.orm.database.deleteRow(this.meta.tableName, idKey, this.id);
  }

  async _validate() {}

  async validate(data: Record<string, any>) {
    data = this.dropExtraFields(data);
    data = this.validateFieldTypes(data);
    data = await this.validateConnections(data);

    this._data = data;
    this.setIdIfNew();
    await this._validate();
  }

  async update(data: Record<string, any>) {
    data = this.validateFieldTypes(data);
    this._prevData = { ...this._data };
    const mergedData = { ...this._data, ...data };
    await this.validate(mergedData);
  }

  async _beforeInsert() {}
  async beforeInsert() {
    this._data = this.setDefaultValues(this._data);
    await this._beforeInsert();
    this.setCreatedAt();
  }
  async _beforeSave() {}
  async beforeSave() {
    await this._beforeSave();
    this.setUpdatedAt();
  }

  async _afterSave() {}

  async afterSave() {
    await this.syncFetchFields();
    await this._afterSave();
  }

  async _afterInsert() {}
  async afterInsert() {
    await this._afterInsert();
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
  private adaptSaveValue(field: EasyField | EasyFieldType, value: any) {
    return this.orm.database.adaptSaveValue(field, value);
  }

  private adaptChangedData(changedData: Record<string, any>) {
    const adaptedData: Record<string, any> = {};
    for (const key in changedData) {
      if (key === "updatedAt" || key === "createdAt") {
        adaptedData[key] = this.adaptSaveValue(
          "TimeStampField",
          changedData[key],
        );
        continue;
      }
      let fieldType: EasyFieldType | undefined;
      this.fields.forEach((field) => {
        if (field.key === key) {
          fieldType = field.fieldType;
        }
        // if (field.fieldType === "ConnectionField") {
        //   field.connection?.fetchFields?.forEach((fetchField) => {
        //     if (fetchField.key === key) {
        //       fieldType = fetchField.fieldType;
        //     }
        //   });
        // }
      });

      if (!fieldType) {
        raiseOrmException(
          "InvalidField",
          `Field ${key} not found in entity ${this.meta.entityId}`,
        );
      }

      adaptedData[key] = this.adaptSaveValue(fieldType, changedData[key]);
    }
    return adaptedData;
  }

  async save() {
    await this.validate(this._data);
    if (this._isNew) {
      await this.beforeInsert();
      await this.beforeSave();
      await this.orm.database.insertRow(
        this.meta.tableName,
        this.id,
        this._data,
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
      this.meta.tableName,
      this.id,
      changedData,
    );
    await this.afterSave();
  }

  /**
   * Base fields
   */

  private setCreatedAt() {
    if (!this.createdAt) {
      this.createdAt = now();
    }
  }

  private setUpdatedAt() {
    this.updatedAt = now();
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

  /**
   * Fetch Fields Magic
   */

  private async syncFetchFields() {
    // return;
    const entry = this.orm.findInRegistry(this.meta.entityId);
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
    for (const field of this.fields) {
      if (field.fieldType === "ConnectionField") {
        continue;
      }
      if (!(field.key in data)) {
        continue;
      }
      let value = data[field.key as string];
      value = this.validateField(field, value);
      data[field.key as string] = value;
    }
    return data;
  }

  private validateField(field: EasyField, value: any) {
    switch (field.fieldType as EasyFieldType) {
      case "BooleanField":
        value = validateBoolean(field, value);
        break;
      case "DateField":
        value = validateDate(field, value);
        break;
      case "IntField":
        value = validateInt(field, value);
        break;
      case "BigIntField":
        value = validateBigInt(field, value);
        break;
      case "DecimalField":
        value = validateDecimal(field, value);
        break;
      case "DataField":
        value = validateData(field, value);
        break;
      case "JSONField":
        value = validateJson(field, value);
        break;
      case "EmailField":
        value = validateEmail(field, value);
        break;
      case "ImageField":
        raiseOrmException("NotImplemented", "ImageField is not supported yet");
        break;
      case "TextField":
        value = validateTextField(field, value);
        break;
      case "ChoicesField":
        value = validateChoices(field, value);
        break;
      case "MultiChoiceField":
        value = validateMultiChoices(field, value);
        break;
      case "PasswordField":
        value = validatePassword(field, value);
        break;
      case "PhoneField":
        value = validatePhone(field, value);
        break;
      case "TimeStampField":
        value = validateTimeStamp(field, value);
        break;
      case "ConnectionField":
        raiseOrmException(
          "InvalidFieldType",
          `ConnectionField ${field.key as string} must be handled separately`,
        );
        break;
      default:
        raiseOrmException(
          "NotImplemented",
          `Field type ${field.fieldType} is not implemented`,
        );
    }

    return value;
  }

  private dropExtraFields(data: Record<string, any>) {
    const fields = this.fields.map((field) => field.key);
    for (const key in data) {
      if (key! in fields) {
        delete data[key];
      }
    }
    return data;
  }
  private setDefaultValues(data: Record<PropertyKey, any>) {
    for (const field of this.fields) {
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
          data[field.key] = null;
          break;
      }
    }
    return data;
  }

  private async validateConnections(data: Record<PropertyKey, any>) {
    const connectionFields = this.fields.filter((field) =>
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
            data[connectionField.key] = connectionData[connectionField.key];
          }
        }
      }
    }
    return data;
  }
}
export function createEntityClass<
  D extends EntityDefinition,
  E extends EntityDefFromModel<D>,
>(
  entityDef: D,
  orm: Orm,
): EntityClassConstructor<E> {
  const entityClass = class extends EntityClass {
    constructor() {
      super();

      Object.defineProperty(this, "fields", {
        value: entityDef.fields,
        writable: false,
      });
      Object.defineProperty(this, "orm", {
        value: orm,
        writable: false,
      });
      Object.defineProperty(this, "meta", {
        value: entityDef,
        writable: false,
      });
      entityDef.fields.forEach((field) => {
        Object.defineProperty(this, field.key, {
          get: function () {
            return this._data[field.key];
          },
          set: function (value) {
            this._data[field.key] = value;
          },
        });
      });
    }
  } as EntityClassConstructor<E>;

  for (const hook in entityDef.hooks) {
    const hookKey = hook as keyof EntityHooks;
    const privName = `_${hook}`;
    entityClass.prototype[privName] = entityDef.hooks[hookKey];
  }

  for (const action in entityDef.actions) {
    entityClass.prototype[action] = entityDef.actions[action];
  }

  for (const hook in entityDef.hooks) {
    const privName = `_${hook}`;
    entityClass.prototype[privName].bind(entityClass);
  }
  for (const action in entityDef.actions) {
    entityClass.prototype[action].bind(entityClass);
  }
  return entityClass;
}

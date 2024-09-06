import { EntityDefinition } from "#/entity/easyEntity/entityDefinition/entityDefTypes.ts";
import { HookFunction } from "#/entity/easyEntity/entityRecord/entityRecordTypes.ts";
import { EasyFieldTypeMap } from "#/entity/field/fieldTypes.ts";
import { raiseOrmException } from "#/ormException.ts";

export class EntityRecord {
  private _data: Record<string, any> = {};
  private _prevData: Record<string, any> = {};
  private _isNew: boolean = false;
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
  get data() {
    return this._data;
  }
  entityDefinition!: EntityDefinition;

  _beforeInsert!: Array<HookFunction>;

  _afterInsert!: Array<HookFunction>;

  _beforeSave!: Array<HookFunction>;

  _afterSave!: Array<HookFunction>;

  _validate!: Array<HookFunction>;

  async beforeInsert() {}
  async afterInsert() {}
  async beforeSave() {}
  async afterSave() {}
  async validate() {}

  async load(id: string | number) {}
  async save() {}
  async delete() {}

  async update(data: Record<string, any>) {}
}

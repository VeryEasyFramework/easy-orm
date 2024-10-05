import type {
  EntityAction,
  EntityDefinition,
  EntityHook,
  EntityHookDefinition,
} from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import { EntityRecord } from "#/entity/entity/entityRecord/entityRecord.ts";
import type { EntitityHookFunction } from "#/entity/entity/entityRecord/entityRecordTypes.ts";
import type { EasyOrm } from "#/orm.ts";
import {
  validateConnection,
  validateField,
} from "#/entity/field/validateField.ts";
import { EasyField } from "../../../../mod.ts";

export function buildRecordClass(orm: EasyOrm, entity: EntityDefinition) {
  const hooks = extractHooks(entity);
  const actions = extractActions(entity);
  const entityRecordClass = class extends EntityRecord {
    entityDefinition = entity;
    _beforeInsert: Array<EntitityHookFunction> = hooks.beforeInsert;

    _afterInsert: Array<EntitityHookFunction> = hooks.afterInsert;

    _beforeSave: Array<EntitityHookFunction> = hooks.beforeSave;
    _afterSave: Array<EntitityHookFunction> = hooks.afterSave;

    _validate: Array<EntitityHookFunction> = hooks.validate;
    _beforeValidate: Array<EntitityHookFunction> = hooks.beforeValidate;

    actions: Record<string, EntityAction> = actions;
    orm = orm;
  };

  // entityRecordClass = bindHooks(entityRecordClass, entity);
  setFields(entityRecordClass, entity);
  return entityRecordClass;
}

function extractActions(entity: EntityDefinition) {
  const actions: Record<string, EntityAction> = {};
  entity.actions.forEach((action) => {
    actions[action.key] = action;
  });
  return actions;
}

function setFields(
  entityRecordClass: typeof EntityRecord,
  entity: EntityDefinition,
) {
  entity.fields.forEach((field) => {
    Object.defineProperty(entityRecordClass.prototype, field.key, {
      get: function () {
        return this._data[field.key];
      },
      set: function (value) {
        value = validateField(field, value);
        if (this._data[field.key] === value) {
          return;
        }

        this._prevData[field.key] = this._data[field.key];
        this._data[field.key] = value;
        return value;
      },
    });
  });
}

function extractHooks(entity: EntityDefinition) {
  const getHookActions = (hook: EntityHookDefinition[]) => {
    return hook.map((hookAction) => {
      return hookAction.action;
    });
  };
  const hooks: Record<EntityHook, EntitityHookFunction[]> = {
    beforeInsert: [],
    afterInsert: [],
    beforeSave: [],
    afterSave: [],
    validate: [],
    beforeValidate: [],
  };
  Object.entries(entity.hooks).forEach(([key, value]) => {
    hooks[key as EntityHook] = getHookActions(value);
  });

  return hooks;
}

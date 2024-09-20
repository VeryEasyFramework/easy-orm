import type {
  EntityAction,
  EntityDefinition,
  EntityHook,
  EntityHookDefinition,
} from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import { EntityRecord } from "#/entity/entity/entityRecord/entityRecord.ts";
import type { HookFunction } from "#/entity/entity/entityRecord/entityRecordTypes.ts";
import type { EasyOrm } from "#/orm.ts";

export function buildRecordClass(orm: EasyOrm, entity: EntityDefinition) {
  const hooks = extractHooks(entity);
  const actions = extractActions(entity);
  const entityRecordClass = class extends EntityRecord {
    entityDefinition = entity;
    _beforeInsert: Array<HookFunction> = hooks.beforeInsert;

    _afterInsert: Array<HookFunction> = hooks.afterInsert;

    _beforeSave: Array<HookFunction> = hooks.beforeSave;
    _afterSave: Array<HookFunction> = hooks.afterSave;

    _validate: Array<HookFunction> = hooks.validate;
    _beforeValidate: Array<HookFunction> = hooks.beforeValidate;

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
        this._data[field.key] = value;
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
  const hooks: Record<EntityHook, HookFunction[]> = {
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

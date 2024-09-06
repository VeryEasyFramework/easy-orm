import {
  EntityDefinition,
  EntityHook,
  EntityHookDefinition,
} from "#/entity/easyEntity/entityDefinition/entityDefTypes.ts";
import { EntityRecord } from "#/entity/easyEntity/entityRecord/entityRecord.ts";
import { HookFunction } from "#/entity/easyEntity/entityRecord/entityRecordTypes.ts";

export function buildRecordClass(entity: EntityDefinition) {
  const hooks = extractHooks(entity);
  const entityRecordClass = class extends EntityRecord {
    _beforeInsert: Array<HookFunction> = hooks.beforeInsert;
    _afterInsert: Array<HookFunction> = hooks.afterInsert;
    _beforeSave: Array<HookFunction> = hooks.beforeSave;

    _afterSave: Array<HookFunction> = hooks.afterSave;

    _validate: Array<HookFunction> = hooks.validate;
    entityDefinition = entity;
  };
  bindHooks(entityRecordClass);

  return entityRecordClass;
}

function bindHooks(entityRecordClass: typeof EntityRecord) {
  entityRecordClass.prototype["_beforeInsert"].forEach((hook) => {
    hook.bind(entityRecordClass);
  });
  entityRecordClass.prototype["_afterInsert"].forEach((hook) => {
    hook.bind(entityRecordClass);
  });
  entityRecordClass.prototype["_beforeSave"].forEach((hook) => {
    hook.bind(entityRecordClass);
  });
  entityRecordClass.prototype["_afterSave"].forEach((hook) => {
    hook.bind(entityRecordClass);
  });

  entityRecordClass.prototype["_validate"].forEach((hook) => {
    hook.bind(entityRecordClass);
  });
}

function extractHooks(entity: EntityDefinition) {
  const getHookActions = (hook: EntityHookDefinition[]) => {
    return hook.map((hookAction) => {
      return hookAction.action;
    });
  };
  const hooks: Record<EntityHook, Array<() => Promise<void> | void>> = {
    beforeInsert: [],
    afterInsert: [],
    beforeSave: [],
    afterSave: [],
    validate: [],
  };
  Object.entries(entity.hooks).forEach(([key, value]) => {
    hooks[key as EntityHook] = getHookActions(value);
  });

  return hooks;
}

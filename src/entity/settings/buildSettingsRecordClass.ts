import { EasyOrm } from "#/orm.ts";
import { SettingsEntity } from "#/entity/settings/settingsEntity.ts";
import { SettingsRecord } from "#/entity/settings/settingsRecord.ts";
import { validateField } from "#/entity/field/validateField.ts";
import {
  EntityHookDefinition,
} from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import { EntitityHookFunction } from "#/entity/entity/entityRecord/entityRecordTypes.ts";
import {
  SettingsAction,
  SettingsActionDefinition,
  SettingsEntityDefinition,
  SettingsEntityHookDefinition,
  SettingsHook,
} from "#/entity/settings/settingsDefTypes.ts";
import { SettingsHookFunction } from "#/entity/settings/settingsRecordTypes.ts";

export function buildSettingsRecordClass(
  orm: EasyOrm,
  settingsEntity: SettingsEntityDefinition,
) {
  const hooks = extractHooks(settingsEntity);
  const actions = extractActions(settingsEntity);
  const settingsRecordClass = class extends SettingsRecord {
    override orm = orm;
    override settingsDefinition = settingsEntity;
    override _beforeSave = hooks.beforeSave;
    override _afterSave = hooks.afterSave;
    override _validate = hooks.validate;
    override _beforeValidate = hooks.beforeValidate;
    override actions: Record<string, SettingsAction> = actions;
  };

  setFields(settingsRecordClass, settingsEntity);
  return settingsRecordClass;
}

function setFields(
  settingsRecordClass: typeof SettingsRecord,
  settingsEntity: SettingsEntityDefinition,
) {
  settingsEntity.fields.forEach((field) => {
    Object.defineProperty(settingsRecordClass.prototype, field.key, {
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

function extractActions(settingsEntity: SettingsEntityDefinition) {
  const actions: Record<string, SettingsAction> = {};
  settingsEntity.actions.forEach((action) => {
    actions[action.key] = action;
  });
  return actions;
}
function extractHooks(settingsEntity: SettingsEntityDefinition) {
  const getHookActions = (hook: SettingsEntityHookDefinition[]) => {
    return hook.map((hookAction) => {
      return hookAction.action;
    });
  };
  const hooks: Record<SettingsHook, SettingsHookFunction[]> = {
    beforeSave: [],
    afterSave: [],
    validate: [],
    beforeValidate: [],
  };
  Object.entries(settingsEntity.hooks).forEach(([key, value]) => {
    hooks[key as SettingsHook] = getHookActions(value);
  });

  return hooks;
}

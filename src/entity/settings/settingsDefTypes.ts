import type { SettingsRecord } from "#/entity/settings/settingsRecord.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";
import { EasyField } from "#/entity/field/easyField.ts";
import { FieldGroup } from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import { SettingsEntityConfig } from "#/entity/settings/settingsEntity.ts";
import { EntityChildDefinition } from "#/entity/child/childEntity.ts";

export interface SettingsEntityHookDefinition {
  label?: string;
  description?: string;
  action(settingsRecord: SettingsRecord): Promise<void> | void;
}

export type SettingsEntityHooks = {
  beforeSave: Array<SettingsEntityHookDefinition>;
  afterSave: Array<SettingsEntityHookDefinition>;
  validate: Array<SettingsEntityHookDefinition>;
  beforeValidate: Array<SettingsEntityHookDefinition>;
};

export type SettingsHook = keyof SettingsEntityHooks;

export interface SettingsActionDefinition {
  label?: string;
  description?: string;
  action(settingsRecord: SettingsRecord): Promise<void> | void;

  private?: boolean;

  params?: Record<string, SettingsActionParam>;
}

export interface SettingsAction extends SettingsActionDefinition {
  key: string;
}
export interface SettingsActionParam {
  key: string;
  fieldType: EasyFieldType;
  required?: boolean;
}

export interface SettingsEntityDefinition {
  settingsId: string;
  fields: Array<EasyField>;
  fieldGroups: Array<FieldGroup>;
  config: SettingsEntityConfig;
  children: Array<EntityChildDefinition>;
  hooks: SettingsEntityHooks;
  actions: Array<SettingsAction>;
}

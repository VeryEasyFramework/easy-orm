import type { EasyField } from "../../field/easyField.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";

export interface FieldGroupDefinition {
  key: string;
  title: string;
  description?: string;
}

export interface FieldGroup {
  key: string;
  title: string;
  description?: string;
  fields: Array<EasyField>;
}

export interface EasyEntityConfig {
  label: string;
  description: string;
  titleField?: string;
  tableName: string;
}

export type EntityHook =
  | "beforeSave"
  | "afterSave"
  | "beforeInsert"
  | "afterInsert"
  | "validate";
export interface EntityHookDefinition {
  label?: string;
  description?: string;
  action(): Promise<void> | void;
}

export type EasyEntityHooks = Record<EntityHook, Array<EntityHookDefinition>>;

export interface EntityActionParam {
  key: string;
  fieldType: EasyFieldType;
  required?: boolean;
}
export interface EntityActionDefinition {
  label?: string;
  description?: string;
  action(params?: Record<string, any>): Promise<void> | void;
  params?: Array<EntityActionParam>;
}

export interface EntityDefinition {
  entityId: string;
  fields: Array<EasyField>;
  fieldGroups: Array<FieldGroup>;
  listFields: Array<string>;
  config: EasyEntityConfig;
  hooks: EasyEntityHooks;
  actions: Array<EntityActionDefinition>;
}

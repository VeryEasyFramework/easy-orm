import type { EasyField } from "../../field/easyField.ts";
import type {
  EasyFieldType,
  SafeReturnType,
  SafeType,
} from "#/entity/field/fieldTypes.ts";
import { EntityRecord } from "#/entity/easyEntity/entityRecord/entityRecord.ts";

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
  action(entity: EntityRecord): Promise<void> | void;
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
  action(
    entity: EntityRecord,
    params?: Record<string, SafeType>,
  ): SafeReturnType;
  params?: Array<EntityActionParam>;
}

export interface EntityAction extends EntityActionDefinition {
  key: string;
}

export interface EntityDefinition {
  entityId: string;
  fields: Array<EasyField>;
  fieldGroups: Array<FieldGroup>;
  listFields: Array<string>;
  config: EasyEntityConfig;
  hooks: EasyEntityHooks;
  actions: Array<EntityAction>;
}

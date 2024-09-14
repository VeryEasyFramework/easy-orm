import type { EasyField } from "#/entity/field/easyField.ts";
import type {
  EasyFieldType,
  SafeReturnType,
  SafeType,
} from "#/entity/field/fieldTypes.ts";
import type { EntityRecord } from "#/entity/entity/entityRecord/entityRecord.ts";

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
  orderField?: string;
  orderDirection?: "asc" | "desc";
}

export type EntityHook = keyof EasyEntityHooks;

export interface EntityHookDefinition {
  label?: string;
  description?: string;

  action(entity: EntityRecord): Promise<void> | void;
}

export type EasyEntityHooks = {
  beforeSave: Array<EntityHookDefinition>;
  afterSave: Array<EntityHookDefinition>;
  beforeInsert: Array<EntityHookDefinition>;
  afterInsert: Array<EntityHookDefinition>;
  validate: Array<EntityHookDefinition>;
};

export interface EntityActionParam {
  key: string;
  fieldType: EasyFieldType;
  required?: boolean;
}
export interface EntityActionDefinition {
  label?: string;
  description?: string;

  /**
   * If true, this action can only be called internally
   */
  private?: boolean;

  /**
   * If true, this action can be called without loading a specific entity first
   */
  global?: boolean;
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

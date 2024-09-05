import type { EasyField } from "#/entity/field/ormField.ts";
import type {
  ActionDef,
  EntityConfig,
  EntityDef,
  EntityHooks,
  ExtractActions,
  Orm,
} from "#/entity/defineEntityTypes.ts";
import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";
import type { EasyFieldDef, FieldGroupDef } from "#/entity/field/easyField.ts";

type FieldKey<F> = F extends Record<string, EasyFieldDef> ? keyof F : never;

type EntityType = "entity" | "settings";
type ExtractEntityFields<F> = F extends Record<string, EasyFieldDef> ? {
    [K in keyof F]: EasyFieldTypeMap[F[K]["fieldType"]];
  }
  : never;
export function defineEntityNew<
  Id extends string,
  G extends Record<string, FieldGroupDef>,
  T extends EasyFieldType,
  TT extends
    & ExtractEntityFields<F>
    & { orm: Orm }
    & EntityHooks,
  F extends Record<string, EasyFieldDef<T, keyof G>>,
  H extends Partial<EntityHooks>,
  AP extends PropertyKey,
  A extends ActionDef<TT, AP>[],
>(entityId: Id, options: {
  label: string;
  description?: string;
  entityType?: EntityType;
  /**
   * @description The fields of the entity.
   */
  fields: F;
  titleField?: keyof F;
  fieldGroups?: G;
  tableName?: string;
  config?: EntityConfig;
  hooks?:
    & H
    & ThisType<TT>;
  actions?: A;
}) {
  const output = {
    entityId,
    ...options,
    entityType: options.entityType || "entity",
    listFields: [],
    fieldGroups: options.fieldGroups || [],
    groups: [],
    hooks: {
      beforeSave: options.hooks?.beforeSave || (() => {}),
      afterSave: options.hooks?.afterSave || (() => {}),
      beforeInsert: options.hooks?.beforeInsert || (() => {}),
      afterInsert: options.hooks?.afterInsert || (() => {}),
    } as EntityHooks,
    actions: options.actions as A,
    tableName: options.tableName || entityId,
    config: {
      ...options.config,
    } as EntityConfig,
  };
  return output;
}

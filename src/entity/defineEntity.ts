import type { EasyField } from "#/entity/field/ormField.ts";
import type {
  EntityActionRecord,
  EntityConfig,
  EntityDef,
  EntityHooks,
  ExtractEntityFields,
  Orm,
} from "#/entity/defineEntityTypes.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";

export function defineEntity<
  Id extends string,
  P extends PropertyKey,
  T extends EasyFieldType,
  F extends EasyField<P, T>[],
  H extends Partial<EntityHooks>,
  AP extends PropertyKey | undefined,
  A extends EntityActionRecord<AP>,
>(entityId: Id, options: {
  label: string;
  /**
   * @description The fields of the entity.
   */
  fields: F;
  tableName?: string;
  config?: EntityConfig;
  hooks?: H & ThisType<EntityHooks & ExtractEntityFields<F> & A & { orm: Orm }>;
  actions?:
    & A
    & ThisType<A & EntityHooks & ExtractEntityFields<F> & { orm: Orm }>;
}): EntityDef<Id, P, T, F, AP, A> {
  const output = {
    entityId,
    ...options,
    hooks: {
      beforeSave: options.hooks?.beforeSave || (() => {}),
      afterSave: options.hooks?.afterSave || (() => {}),
      beforeInsert: options.hooks?.beforeInsert || (() => {}),
      afterInsert: options.hooks?.afterInsert || (() => {}),
    } as EntityHooks,
    actions: options.actions || {} as A,
    tableName: options.tableName || entityId,
    config: {
      ...options.config,
    } as EntityConfig,
  };
  return output;
}

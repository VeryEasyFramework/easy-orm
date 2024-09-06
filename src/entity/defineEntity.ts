import type { EasyField } from "#/entity/field/easyField.ts";
import type {
  ActionDef,
  EntityConfig,
  EntityHooks,
  ExtractActions,
  ExtractEntityFields,
  FieldGroupDef,
  FieldKey,
  Orm,
} from "#/entity/defineEntityTypes.ts";
import type { EasyFieldType } from "#/entity/field/fieldTypes.ts";

// remap the action object to a named function
// for example, { action: async () => {} } becomes { action(): Promise<void> }

type EntityType = "entity" | "settings";

export function defineEntity<
  Id extends string,
  P extends PropertyKey,
  T extends EasyFieldType,
  F extends EasyField<P, T>[],
  H extends Partial<EntityHooks>,
  AP extends PropertyKey,
  A extends ActionDef<AP>[],
  FG extends FieldGroupDef<F>,
>(entityId: Id, options: {
  label: string;
  description?: string;
  entityType?: EntityType;
  titleField?: FieldKey<F>;
  /**
   * @description The fields of the entity.
   */
  fields: F;
  fieldGroups?: FG;
  tableName?: string;
  config?: EntityConfig;
  hooks?:
    & H
    & ThisType<
      EntityHooks & ExtractEntityFields<F> & ExtractActions<A> & { orm: Orm }
    >;
  actions?:
    & A
    & ThisType<
      ExtractActions<A> & EntityHooks & ExtractEntityFields<F> & { orm: Orm }
    >;
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

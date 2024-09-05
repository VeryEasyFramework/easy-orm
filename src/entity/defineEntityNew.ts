import type { EasyField } from "#/entity/field/ormField.ts";
import type {
  EntityConfig,
  EntityDef,
  EntityHooks,
  Orm,
} from "#/entity/defineEntityTypes.ts";
import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";
import type { EasyFieldDef, FieldGroupDef } from "#/entity/field/easyField.ts";

type FieldKey<F> = F extends Record<string, EasyFieldDef> ? keyof F : never;

type EntityType = "entity" | "settings";
type ExtractEntityFields<F> = F extends
  Record<PropertyKey, EasyFieldDef<infer T, infer G>>
  ? { [K in keyof F]: EasyFieldTypeMap[F[K]["fieldType"]] }
  : never;

type ExtractActions<
  A extends {
    [K in keyof A]: InferredAction<Action<any, any>>;
  },
> = { [K in keyof A]: A[K]["action"] };
type Action<
  P extends {
    [K in keyof P]: {
      required: boolean;
      type: keyof EasyFieldTypeMap;
    };
  },
  D extends {
    [E in keyof P]: EasyFieldTypeMap[P[E]["type"]];
  },
> = {
  description?: string;
  action: (
    data: D,
  ) => Promise<any> | any;
  params?: P;
  public?: boolean;
};

export type InferredAction<A> = A extends Action<infer P, infer D>
  ? Action<P, D>
  : never;
export function defineEntityNew<
  Id extends string,
  GP extends PropertyKey,
  G extends Record<GP, FieldGroupDef>,
  FP extends PropertyKey,
  T extends EasyFieldType,
  F extends {
    [K in FP]: EasyFieldDef<T, keyof G>;
  },
  H extends Partial<EntityHooks>,
  AP extends PropertyKey,
  AC extends Action<any, any>,
  A extends {
    [K in AP]: InferredAction<AC>;
  },
>(entityId: Id, options: {
  label: string;
  description?: string;
  entityType?: EntityType;
  /**
   * @description The fields of the entity.
   */
  fields: F;
  titleField?: FieldKey<F>;
  fieldGroups?: Record<GP, FieldGroupDef>;
  tableName?: string;
  config?: EntityConfig;
  hooks?:
    & H
    & ThisType<
      EntityHooks & ExtractEntityFields<F> & {
        orm: Orm;
      }
    >;
  actions?:
    & A
    & ThisType<ExtractEntityFields<F> & ExtractActions<A>>;
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

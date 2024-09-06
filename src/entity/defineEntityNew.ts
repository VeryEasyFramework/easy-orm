import type { EasyField } from "./field/easyField.ts";
import type {
  ActionsDef,
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

type AParams<P extends PropertyKey> = {
  [K in P]: {
    required: boolean;
    type: keyof EasyFieldTypeMap;
  };
};

type HookDef<T> = {
  label?: string;
  description?: string;
  action(): Promise<void> | void;
} & ThisType<T>;

interface HooksDef<T> {
  beforeSave?: Array<HookDef<T>>;
  afterSave?: Array<HookDef<T>>;
  beforeInsert?: Array<HookDef<T>>;
  afterInsert?: Array<HookDef<T>>;
  validate?: Array<HookDef<T>>;
}

type SafeType = EasyFieldTypeMap[EasyFieldType];
type SafeReturnType = SafeType | SafeType[] | Record<string, SafeType> | Record<
  string,
  SafeType
>[] | void;
interface BaseActions {
  save(): Promise<void>;
  update(): Promise<void>;
  delete(): Promise<void>;
  load(): Promise<void>;
}

type BaseThis =
  & {
    orm: Orm;
  }
  & BaseActions
  & EntityHooks;

interface ActionDef<T> {
  description?: string;

  action(
    this: BaseThis & T & { [K in keyof A]: A[K] },
    ...params: any[]
  ): Promise<SafeReturnType> | SafeReturnType;
}

type ExtractActions<A> = A extends Record<PropertyKey, ActionDef<any>> ? {
    [K in keyof A]: (
      ...args: Parameters<A[K]["action"]>
    ) => ReturnType<A[K]["action"]>;
  }
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
  AP extends PropertyKey,
  A extends Record<AP, ActionDef<ExtractEntityFields<F>>>,
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
  hooks?: HooksDef<BaseThis & ExtractEntityFields<F> & ExtractActions<A>>;
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

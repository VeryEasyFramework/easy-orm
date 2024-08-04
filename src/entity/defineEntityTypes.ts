import { DatabaseConfig } from "#/database/database.ts";
import type { DenoOrm } from "../orm.ts";
import type { FieldTypes, ORMField } from "./field/ormField.ts";

export type EntityActionDef<
  P extends PropertyKey,
> = {
  [K in P]: (
    ...args: any[]
  ) => Promise<void>;
};

export interface EntityHooks {
  beforeSave(): void;
  afterSave(): void;
  beforeInsert(): void;
  afterInsert(): void;
  validate(): void;
}

export type Orm = DenoOrm<
  keyof DatabaseConfig,
  Array<EntityDefinition>,
  any,
  any,
  any
>;

export type ExtractEntityFields<F extends ORMField[]> = {
  [K in F[number] as K["key"]]: FieldTypes[K["fieldType"]];
};

export type EntityDef<
  Id extends string,
  P extends PropertyKey,
  F extends ORMField<P>[],
  AP extends PropertyKey,
  A extends Record<AP, (...args: any[]) => Promise<void>>,
> = {
  entityId: Id;
  label: string;
  fields: F;
  hooks: EntityHooks;
  config: EntityConfig;
  tableName: string;
  actions: A;
};

export type EntityDefinition<Id extends string = string> = EntityDef<
  Id,
  PropertyKey,
  ORMField[],
  PropertyKey,
  Record<PropertyKey, (...args: any[]) => Promise<void>>
>;

export type EntityIds<E extends EntityDefinition[]> = E[number]["entityId"];

export type EntityDefFromModel<M> = M extends
  EntityDef<infer Id, infer P, infer F, infer AP, infer A>
  ? EntityDef<Id, P, F, AP, A>
  : never;

interface BaseFields {
  id: FieldTypes["IDField"];
  createdAt: FieldTypes["DateField"];
  updatedAt: FieldTypes["DateField"];
}
export type EntityFromDef<T> = T extends
  EntityDef<infer Id, infer P, infer F, infer AP, infer A> ?
    & {
      [K in T["fields"][number] as K["key"]]: FieldTypes[K["fieldType"]];
    }
    & BaseFields
    & EntityHooks
    & T["actions"]
  : never;

export type CreateEntityFromDef<T> = T extends
  EntityDef<infer Id, infer P, infer F, infer AP, infer A> ? {
    [K in T["fields"][number] as K["key"]]: FieldTypes[K["fieldType"]];
  }
  : never;

export type ListEntityFromDef<T> = T extends
  EntityDef<infer Id, infer P, infer F, infer AP, infer A> ?
    & {
      [K in T["fields"][number] as K["key"]]: FieldTypes[K["fieldType"]];
    }
    & BaseFields
  : never;

export interface EntityConfig {
  tableName?: string;
}

export interface EntityClassConstructor<E extends EntityDefinition> {
  new (
    data: ExtractEntityFields<E["fields"]>,
  ):
    & EntityFromDef<any>
    & E["actions"]
    & E["hooks"]
    & { orm: Orm }
    & ExtractEntityFields<E["fields"]>;
}

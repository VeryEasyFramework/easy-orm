import { DenoOrm } from "../orm.ts";
import { FieldTypes, ORMField } from "./field/ormField.ts";

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
}

export type Orm = DenoOrm<any, any, any, any>;

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
  actions: A;
};

export type EntityDefinition = EntityDef<string, any, any, any, any>;

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

export type ListEntityFromDef<T> = T extends
  EntityDef<infer Id, infer P, infer F, infer AP, infer A> ?
    & {
      [K in T["fields"][number] as K["key"]]: FieldTypes[K["fieldType"]];
    }
    & BaseFields
  : never;

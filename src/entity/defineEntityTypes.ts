import type { DatabaseConfig } from "#/database/database.ts";
import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";
import type { EasyField } from "./field/ormField.ts";
import type { EasyOrm } from "../orm.ts";

export type EntityActionDef<
  P extends PropertyKey,
> = {
  [K in P]: (
    ...args: any[]
  ) => Promise<void>;
};

export interface EntityHooks {
  beforeSave(): Promise<void>;
  afterSave(): Promise<void>;
  beforeInsert(): Promise<void>;
  afterInsert(): Promise<void>;
  validate(): Promise<void>;
}

export type Orm = EasyOrm<
  keyof DatabaseConfig,
  Array<EntityDefinition>,
  any,
  any,
  any
>;

export type ExtractEntityFields<F extends EasyField[]> = {
  [K in F[number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
};

export type EntityDef<
  Id extends string,
  P extends PropertyKey,
  T extends EasyFieldType,
  F extends EasyField<P, T>[],
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
  EasyFieldType,
  EasyField[],
  PropertyKey,
  Record<PropertyKey, (...args: any[]) => Promise<void>>
>;

export type EntityIds<E extends EntityDefinition[]> = E[number]["entityId"];

export type EntityDefFromModel<M> = M extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A>
  ? EntityDef<Id, P, T, F, AP, A>
  : never;

export interface BaseFields {
  id: EasyFieldTypeMap["IDField"];
  createdAt: EasyFieldTypeMap["DateField"];
  updatedAt: EasyFieldTypeMap["DateField"];
}
export type EntityFromDef<E> = E extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A> ?
    & {
      [K in E["fields"][number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
    }
    & BaseFields
    & EntityHooks
    & E["actions"]
    & {
      update(data: Record<string, any>): Promise<void>;
      save(): Promise<void>;
    }
  : never;

export type CreateEntityFromDef<E> = E extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A> ? {
    [K in E["fields"][number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
  }
  : never;

export type ListEntityFromDef<E> = E extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A> ?
    & {
      [K in E["fields"][number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
    }
    & BaseFields
  : never;

export interface EntityConfig {
  tableName?: string;
}

export interface EntityClassConstructor<E extends EntityDefinition> {
  orm: Orm;
  fields: E["fields"];
  new ():
    & EntityFromDef<any>
    & E["actions"]
    & E["hooks"]
    & ExtractEntityFields<E["fields"]>
    & { data: ExtractEntityFields<E["fields"]> }
    & {
      update(data: Record<string, any>): Promise<void>;
      save(): Promise<void>;
    };
}

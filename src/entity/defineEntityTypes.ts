import type { DatabaseConfig } from "#/database/database.ts";
import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";
import type { EasyField } from "./field/ormField.ts";
import type { EasyOrm } from "../orm.ts";

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

export type FieldKey<F extends EasyField[]> = F[number]["key"];

export type EntityDef<
  Id extends string,
  P extends PropertyKey,
  T extends EasyFieldType,
  F extends EasyField<P, T>[],
  AP extends PropertyKey | undefined,
  A extends ActionDef<AP>[],
> = {
  entityId: Id;
  titleField?: FieldKey<F>;
  primaryKey?: string;
  label: string;
  fields: F;
  listFields: FieldKey<F>[];
  hooks: EntityHooks;
  config: EntityConfig;
  tableName: string;
  actions: A;
};

export type ActionDef<N extends PropertyKey | undefined = PropertyKey> =
  N extends PropertyKey ? {
      key: N;
      label?: string;
      public?: boolean;
      action(...args: any[]): Promise<any> | any;
      description?: string;
    }
    : never;

export type ExtractActions<A extends ActionDef[]> = {
  [K in A[number] as K["key"]]: K["action"];
};
// export type EntityActionRecord<AP extends PropertyKey | undefined> = AP extends
//   PropertyKey ? Record<
//     AP,
//     ActionDef
//   >
//   : {};

export type EntityDefinition<Id extends string = string> = EntityDef<
  Id,
  PropertyKey,
  EasyFieldType,
  EasyField[],
  PropertyKey,
  ActionDef[]
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
    & ExtractActions<E["actions"]>
    & {
      update(data: Record<string, any>): Promise<void>;
      save(): Promise<void>;
      load(id: string): Promise<void>;
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
    & ExtractActions<E["actions"]>
    & E["hooks"]
    & ExtractEntityFields<E["fields"]>
    & { data: ExtractEntityFields<E["fields"]> }
    & {
      update(data: Record<string, any>): Promise<void>;
      save(): Promise<void>;
      load(id: string): Promise<void>;
    };
}

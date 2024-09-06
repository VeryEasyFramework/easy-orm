import type { DatabaseConfig } from "#/database/database.ts";
import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";
import type { EasyField, ExtractFieldKey } from "./field/easyField.ts";
import type { EasyOrm } from "../orm.ts";

interface EntityHooks {
  beforeSave(): Promise<void>;
  afterSave(): Promise<void>;
  beforeInsert(): Promise<void>;
  afterInsert(): Promise<void>;
  validate(): Promise<void>;
}

type Orm = EasyOrm<
  keyof DatabaseConfig,
  Array<EntityDefinition>,
  any,
  any,
  any
>;
type FieldGroupDef<F extends EasyField[]> = Record<string, {
  title: string;
  description?: string;
  fields: F[number]["key"][];
}>;
type ExtractEntityFields<F extends EasyField[]> = {
  [K in F[number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
};

type FieldKey<F extends EasyField[]> = F[number]["key"];

interface FieldGroup {
  title: string;
  key: string;
  fields: EasyField[];
}
type EntityDef<
  Id extends string,
  P extends PropertyKey,
  T extends EasyFieldType,
  F extends EasyField<P, T>[],
  AP extends PropertyKey,
  A extends ActionDef<any>,
> = {
  entityId: Id;
  titleField?: FieldKey<F>;
  entityType: "entity" | "settings";
  description?: string;
  primaryKey?: string;
  label: string;
  fields: F;
  listFields: FieldKey<F>[];
  groups: FieldGroup[];
  hooks: EntityHooks;
  config: EntityConfig;
  tableName: string;
  actions: A;
};

interface ActionDef<T> {
  label?: string;
  public?: boolean;
  action(this: T, ...args: any[]): Promise<any> | any;
  description?: string;
}

type ActionsDef<A extends ActionsDef<A, T>, T> = {
  [K in keyof A]: ActionDef<T>;
};
type ExtractActions<A> = A extends ActionDef<infer T> ? {
    [K in keyof A]: ActionDef<T>;
  }
  : never;

type EntityDefinition<Id extends string = string> = EntityDef<
  Id,
  PropertyKey,
  EasyFieldType,
  EasyField[],
  PropertyKey,
  ActionDef<any>
>;

type EntityIds<E extends EntityDefinition[]> = E[number]["entityId"];

type EntityDefFromModel<M> = M extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A>
  ? EntityDef<Id, P, T, F, AP, A>
  : never;

interface BaseFields {
  id: EasyFieldTypeMap["IDField"];
  createdAt: EasyFieldTypeMap["DateField"];
  updatedAt: EasyFieldTypeMap["DateField"];
}
type EntityFromDef<E> = E extends
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

type CreateEntityFromDef<E> = E extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A> ? {
    [K in E["fields"][number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
  }
  : never;

type ListEntityFromDef<E> = E extends
  EntityDef<infer Id, infer P, infer T, infer F, infer AP, infer A> ?
    & {
      [K in E["fields"][number] as K["key"]]: EasyFieldTypeMap[K["fieldType"]];
    }
    & BaseFields
  : never;

interface EntityConfig {
  tableName?: string;
}

interface EntityClassConstructor<E extends EntityDefinition> {
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

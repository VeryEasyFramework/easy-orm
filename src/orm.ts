import {
  Database,
  type DatabaseConfig,
  type ListOptions,
} from "#/database/database.ts";

import type {
  CreateEntityFromDef,
  EntityClassConstructor,
  EntityDefFromModel,
  EntityDefinition,
  EntityFromDef,
  EntityHooks,
  ExtractEntityFields,
  ListEntityFromDef,
  Orm,
} from "#/entity/defineEntityTypes.ts";
import type { RowsResult } from "#/database/adapter/databaseAdapter.ts";
import type { FieldTypes, ORMField } from "#/entity/field/ormField.ts";

export class EasyOrm<
  D extends keyof DatabaseConfig,
  E extends Array<EntityDefinition>,
  R extends {
    [K in E[number] as K["entityId"]]: K;
  },
  C extends {
    [K in E[number] as K["entityId"]]: EntityClassConstructor<K>;
  },
  Ids extends keyof R,
> {
  private entities: R = {} as R;
  private entityClasses: C = {} as C;

  private database: Database<D>;
  constructor(options: {
    entities: E;
    databaseType: D;
    databaseConfig: DatabaseConfig[D];
  }) {
    this.database = new Database({
      adapter: options.databaseType,
      config: options.databaseConfig,
    });

    for (const entity of options.entities) {
      this.entities[entity.entityId as keyof R] = entity as R[keyof R];
      this.entityClasses[entity.entityId as keyof C] = this.createEntityClass(
        entity,
        this,
      ) as C[keyof C];
    }
  }

  private getEntityDef<
    I extends Ids,
    M extends EntityDefFromModel<R[I]>,
  >(
    entity: I,
  ): M {
    return this.entities[entity] as M;
  }

  private getEntityClass<M extends EntityDefinition>(
    entity: string,
  ): EntityClassConstructor<M> {
    const id = entity as keyof C;
    const entityClass = this.entityClasses[id] as EntityClassConstructor<M>;

    return entityClass;
  }
  async init() {
    console.log("Initializing...");
    await this.database.init();
  }

  migrate() {
    console.log("Migrating...");
  }

  getEntityMeta<EntityModel>(entity: string) {
  }

  async getEntity<I extends Ids, E extends R[I]>(
    entity: I,
    id: FieldTypes["IDField"],
  ): Promise<EntityFromDef<R[I]>> {
    const entityDef = this.getEntityDef(entity);
    const entityClass = this.getEntityClass(entity as string);
    const result = await this.database.getRow<ListEntityFromDef<E>>(
      entityDef.tableName,
      "id",
      id,
    );
    const entityInstance = new entityClass(result) as EntityFromDef<R[I]>;
    return entityInstance as EntityFromDef<R[I]>;
  }

  async createEntity<I extends Ids>(
    entity: I,
    data: Partial<CreateEntityFromDef<R[I]>>,
  ): Promise<EntityFromDef<R[I]>> {
    const createdAt = new Date();
    const entityDef = this.getEntityDef(entity);
    const createData = data as EntityFromDef<R[I]>;
    createData.createdAt = createdAt;
    createData.updatedAt = createdAt;
    return await this.database.insertRow(
      entityDef.tableName,
      createData,
    );
  }

  async updateEntity<I extends Ids>(
    entity: I,
    id: string,
    data: Partial<CreateEntityFromDef<R[I]>>,
  ): Promise<EntityFromDef<R[I]>> {
    const entityDef = this.getEntityDef(entity);
    const updateData = data as EntityFromDef<R[I]>;
    updateData.updatedAt = new Date();

    return await this.database.updateRow(
      entityDef.tableName,
      id,
      updateData,
    );
  }
  async deleteEntity<I extends Ids>(entity: I, id: string): Promise<boolean> {
    await this.database.deleteRow(
      this.getEntityDef(entity).tableName,
      "id",
      id,
    );
    return true;
  }

  async getEntityList<I extends Ids, L extends ListEntityFromDef<R[I]>>(
    entity: I,
    options?: ListOptions,
  ): Promise<RowsResult<L>> {
    const entityDef = this.getEntityDef(entity);

    const result = await this.database.getRows<L>(entityDef.tableName, options);
    return result;
  }

  private createEntityClass<
    D extends EntityDefinition,
    E extends EntityDefFromModel<D>,
  >(
    entityDef: D,
    orm: Orm,
  ): EntityClassConstructor<E> {
    const entityClass = class EntityClass {
      orm: Orm = orm;
      private fields: ORMField[] = entityDef.fields;
      constructor(data: ExtractEntityFields<E["fields"]>) {
        for (const field of this.fields) {
          if (field.key in data) {
            const k = field.key as keyof typeof this;

            this[k] = data[k] as any;
          }
        }
      }
    } as EntityClassConstructor<E>;

    for (const hook in entityDef.hooks) {
      const hookKey = hook as keyof EntityHooks;
      entityClass.prototype[hook] = entityDef.hooks[hookKey];
    }

    for (const action in entityDef.actions) {
      entityClass.prototype[action] = entityDef.actions[action];
    }
    for (const field of entityDef.fields) {
      entityClass.prototype[field.key] = field.defaultValue || null;
    }

    for (const hook in entityDef.hooks) {
      entityClass.prototype[hook].bind(entityClass);
    }
    for (const action in entityDef.actions) {
      entityClass.prototype[action].bind(entityClass);
    }
    return entityClass;
  }
}

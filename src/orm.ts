import {
  CreateEntity,
  Entity,
  EntityModelConstructor,
  UpdateEntity,
} from "./types/entityTypes.ts";
import { ID } from "./fieldTypes.ts";
import { EntityModel } from "./entityModel.ts";
import { Database, DatabaseType } from "./database/database.ts";

export class DenoOrm {
  entities: Record<string, EntityModelConstructor> = {};

  private database: Database;
  constructor(entities: EntityModelConstructor[], options: {
    databaseType: DatabaseType;
    databaseConfig: Record<string, any>;
  }) {
    for (const entityClass of entities) {
      this.entities[entityClass.entityId] = entityClass;
    }

    this.database = new Database({
      adapter: options.databaseType,
      config: options.databaseConfig,
    });
  }

  migrate() {
    console.log("Migrating...");
  }

  getEntityMeta<EntityModel>(entity: string) {
    return this.entities[entity];
  }

  getEntity<E extends EntityModel>(entity: string, id: ID): Entity<E> {
    return {} as Entity<E>;
  }

  createEntity<M extends EntityModel, D extends CreateEntity<M>>(
    entity: string,
    data: D,
  ): Entity<M> {
    return {} as Entity<M>;
  }
  static thing() {
    console.log("thing");
  }
  static updateEntity<M extends EntityModel, D extends UpdateEntity<M>>(
    entity: string,
    id: string,
    data: D,
  ): Entity<M> {
    return {} as Entity<M>;
  }
  deleteEntity<M extends EntityModel>(entity: string, id: string): boolean {
    return true;
  }

  getEntityList<M extends EntityModel>(entity: string): Entity<M>[] {
    return [] as Entity<M>[];
  }
}

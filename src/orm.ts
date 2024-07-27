import { ID } from "./entity/field/fieldTypes.ts";

import { Database, DatabaseConfig, DatabaseType } from "./database/database.ts";

import {
  EntityDefinition,
  EntityFromDef,
  ListEntityFromDef,
} from "./entity/defineEntityTypes.ts";

export class DenoOrm<
  D extends DatabaseType,
  E extends Array<EntityDefinition>,
  R extends { [K in E[number] as K["entityId"]]: K },
  Ids extends keyof R,
> {
  entities: R = {} as R;

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
      const id = entity.entityId as Ids;

      this.entities[id] = entity as R[Ids];
    }
  }

  init() {
    console.log("Initializing...");
    this.database.init();
  }

  migrate() {
    console.log("Migrating...");
  }

  getEntityMeta<EntityModel>(entity: string) {
  }

  getEntity<I extends keyof R>(
    entity: I,
    id: ID,
  ): EntityFromDef<R[I]> {
    return {} as EntityFromDef<R[I]>;
  }

  createEntity<I extends Ids>(
    entity: I,
    data: D,
  ): EntityFromDef<R[I]> {
    return {} as EntityFromDef<R[I]>;
  }

  updateEntity<I extends Ids>(
    entity: I,
    id: string,
    data: Record<string, any>,
  ): EntityFromDef<R[I]> {
    return {} as EntityFromDef<R[I]>;
  }
  deleteEntity<I extends Ids>(entity: I, id: string): boolean {
    return true;
  }

  getEntityList<I extends Ids>(entity: I): ListEntityFromDef<R[I]>[] {
    return [] as ListEntityFromDef<R[I]>[];
  }
}

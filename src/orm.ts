import { ID } from "./entity/field/fieldTypes.ts";

import {
  Database,
  DatabaseConfig,
  DatabaseType,
  ListOptions,
} from "./database/database.ts";

import {
  EntityDefFromModel,
  EntityDefinition,
  EntityFromDef,
  ListEntityFromDef,
} from "./entity/defineEntityTypes.ts";
import { RowsResult } from "./database/adapter/databaseAdapter.ts";

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

  private getEntityDef<I extends Ids>(entity: I): EntityDefFromModel<R[I]> {
    return this.entities[entity] as EntityDefFromModel<R[I]>;
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

  async getEntity<I extends Ids, E extends EntityFromDef<R[I]>>(
    entity: I,
    id: ID,
  ): Promise<E> {
    const { tableName } = this.getEntityDef(entity);
    const result = await this.database.getRow<E>(tableName, "id", id);
    return result;
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

  async getEntityList<I extends Ids, L extends ListEntityFromDef<R[I]>>(
    entity: I,
    options?: ListOptions,
  ): Promise<RowsResult<L>> {
    const { tableName } = this.getEntityDef(entity);

    const result = await this.database.getRows<L>(tableName, options);
    return result;
  }
}

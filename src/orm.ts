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
  ListEntityFromDef,
} from "#/entity/defineEntityTypes.ts";
import type { RowsResult } from "#/database/adapter/databaseAdapter.ts";

import type { EasyFieldTypeMap } from "#/entity/field/fieldTypes.ts";

import { createEntityClass } from "#/entity/entityClass.ts";
import { raiseOrmException } from "#/ormException.ts";
interface Registry {
  [key: string]: {
    [key: PropertyKey]: {
      entity: string;
      field: PropertyKey;
    }[];
  };
}
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
  private entityKeys: string[] = [];
  private entityClasses: C = {} as C;
  private initialized: boolean = false;

  registry: Registry = {};

  database: Database<D>;
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
      this.addEntity(entity);
    }
  }

  async init() {
    await this.database.init();
    this.initialized = true;
    this.validateEntities();
  }

  entityInfo: EntityDefinition[] = [];
  addEntity(entity: EntityDefinition) {
    if (this.initialized) {
      throw new Error("Cannot add entities after initialization");
    }
    if (this.entityKeys.includes(entity.entityId)) {
      raiseOrmException(
        "EntityAlreadyExists",
        `Entity ${entity.entityId} already exists`,
      );
    }
    this.entityInfo.push(entity);
    this.entityKeys.push(entity.entityId);
    // TODO: Add validation for entity definition
    this.entities[entity.entityId as keyof R] = entity as R[keyof R];
    this.entityClasses[entity.entityId as keyof C] = createEntityClass(
      entity,
      this,
    ) as C[keyof C];
  }

  private validateEntities() {
    for (const entity of this.entityKeys) {
      const entityDef = this.getEntityDef(entity as Ids);
      this.validateEntityDef(entityDef);
    }
  }

  private validateEntityDef(entity: EntityDefinition) {
    this.validateFetchFields(entity);
  }
  private validateFetchFields(entity: EntityDefinition) {
    const fields = entity.fields.filter((field) =>
      field.fieldType === "ConnectionField"
    );
    for (const field of fields) {
      if (!field.connection) {
        raiseOrmException(
          "InvalidConnection",
          `Connection field ${field.key as string} is missing`,
        );
      }
      if (!this.hasEntity(field.connection.entity)) {
        raiseOrmException(
          "InvalidConnection",
          `Connection entity ${field.connection.entity} does not exist`,
        );
      }
      const connectionEntity = this.getEntityDef(
        field.connection.entity as Ids,
      );

      const fetchFields = field.connection.fetchFields || [];
      const connectionFields = connectionEntity.fields.map((field) =>
        field.key
      );

      for (const fetchField of fetchFields) {
        if (!connectionFields.includes(fetchField.key)) {
          raiseOrmException(
            "InvalidField",
            `Connection field ${fetchField.key} does not exist on entity ${field.connection.entity}`,
          );
        }
        this.registerFetchField({
          source: {
            entity: entity.entityId,
            field: field.key,
          },
          target: {
            entity: field.connection.entity,
            field: fetchField.key,
          },
        });
      }
    }
  }
  private registerFetchField(config: {
    source: {
      entity: string;
      field: PropertyKey;
    };
    target: {
      entity: string;
      field: PropertyKey;
    };
  }) {
    if (!this.registry[config.target.entity]) {
      this.registry[config.target.entity] = {};
    }
    if (!this.registry[config.target.entity][config.target.field]) {
      this.registry[config.target.entity][config.target.field] = [];
    }

    this.registry[config.target.entity][config.target.field].push({
      entity: config.source.entity,
      field: config.source.field,
    });
  }
  migrate() {
    console.log("Migrating...");
  }

  findInRegistry(entity: string): Registry[string] | undefined {
    return this.registry[entity];
  }
  /**
   * Get an entity by id
   */
  async getEntity<I extends Ids, E extends R[I]>(
    entity: I,
    id: EasyFieldTypeMap["IDField"],
  ): Promise<EntityFromDef<R[I]>> {
    const entityClass = this.getEntityClass(entity as string);

    const entityInstance = new entityClass() as EntityFromDef<R[I]>;
    await entityInstance.load(id);
    return entityInstance;
  }

  /**
   * Create an new entity
   */
  async createEntity<I extends Ids>(
    entity: I,
    data: Partial<CreateEntityFromDef<R[I]>>,
  ): Promise<EntityFromDef<R[I]>> {
    const entityClass = this.getEntityClass(entity as string);

    const entityInstance = new entityClass();
    await entityInstance.update(data);
    await entityInstance.save();
    return entityInstance as EntityFromDef<R[I]>;
  }

  /**
   * Update an entity
   */
  async updateEntity<I extends Ids>(
    entity: I,
    id: string,
    data: Partial<CreateEntityFromDef<R[I]>>,
  ): Promise<EntityFromDef<R[I]>> {
    const entityInstance = await this.getEntity(entity, id);
    await entityInstance.update(data);
    await entityInstance.save();
    return entityInstance;
  }

  /**
   * Delete an entity
   */
  async deleteEntity<I extends Ids>(entity: I, id: string): Promise<boolean> {
    await this.database.deleteRow(
      this.getEntityDef(entity).tableName,
      "id",
      id,
    );
    return true;
  }

  /**
   * Get a list of entities
   */
  async getEntityList<I extends Ids, L extends ListEntityFromDef<R[I]>>(
    entity: I,
    options?: ListOptions,
  ): Promise<RowsResult<L>> {
    const entityDef = this.getEntityDef(entity);
    if (!entityDef) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entity as string}' is not a registered entity!`,
      );
    }
    options = options || {};
    if (!options.columns) {
      options.columns = ["id"];
    }
    const listColumns = entityDef.fields.filter((field) => field.inList);
    const columns = listColumns.map((column) => column.key) as string[];
    options.columns = options.columns.concat(columns);
    if (!options.limit) {
      options.limit = 100;
    }
    const result = await this.database.getRows<L>(entityDef.tableName, options);
    return result;
  }

  async batchUpdateField<I extends Ids>(
    entity: I,
    field: string,
    value: any,
    filters: Record<string, any>,
  ) {
    const entityDef = this.getEntityDef(entity);

    await this.database.batchUpdateField(
      entityDef.tableName,
      field,
      value,
      filters,
    );
  }
  /**
   *  Getters for entity definitions
   */
  private getEntityDef<
    I extends Ids,
    M extends EntityDefFromModel<R[I]>,
  >(
    entity: I,
  ): M {
    const def = this.entities[entity] as M;
    if (!def) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entity as string}' is not a registered entity!`,
      );
    }
    return def;
  }

  private getEntityClass<M extends EntityDefinition>(
    entity: string,
  ): EntityClassConstructor<M> {
    const id = entity as keyof C;
    const entityClass = this.entityClasses[id] as EntityClassConstructor<M>;
    if (!entityClass) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entity}' is not a registered entity!`,
      );
    }
    return entityClass;
  }

  /**
   * Validation helpers
   */

  hasEntity(entity: string): boolean {
    if (entity in this.entities) {
      return true;
    }
    return false;
  }

  async exists<I extends Ids>(
    entity: I | string,
    id: string,
  ): Promise<boolean> {
    if (!this.hasEntity(entity as string)) {
      return false;
    }

    const entityDef = this.getEntityDef(entity as I);
    const result = await this.database.getRow(entityDef.tableName, "id", id);
    return result ? true : false;
  }
}

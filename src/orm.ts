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
import type { EasyField } from "#/entity/field/ormField.ts";
import { EasyFieldTypeMap } from "#/entity/field/fieldTypes.ts";
import { generateRandomString } from "@vef/string-utils";
import { now } from "#/utils/dateUtils.ts";
import { raiseOrmException } from "#/ormException.ts";

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
  private initialized: boolean = false;

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
      this.addEntity(entity);
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
    await this.database.init();
    this.initialized = true;
  }

  addEntity(entity: EntityDefinition) {
    if (this.initialized) {
      throw new Error("Cannot add entities after initialization");
    }
    this.entities[entity.entityId as keyof R] = entity as R[keyof R];
    this.entityClasses[entity.entityId as keyof C] = this.createEntityClass(
      entity,
      this,
    ) as C[keyof C];
  }
  migrate() {
    console.log("Migrating...");
  }

  getEntityMeta<I extends Ids>(entity: I): EntityDefFromModel<R[I]> {
    return this.getEntityDef(entity);
  }

  hasEntity(entity: string): boolean {
    if (entity in this.entities) {
      return true;
    }
    return false;
  }
  async getEntity<I extends Ids, E extends R[I]>(
    entity: I,
    id: EasyFieldTypeMap["IDField"],
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
    const entityDef = this.getEntityDef(entity);
    const createData = await this.validateEntity(entity, data);
    const entityClass = this.getEntityClass(entity as string);

    const entityInstance = new entityClass(createData);
    await entityInstance.validate?.();
    await entityInstance.beforeInsert?.();
    await entityInstance.beforeSave?.();

    const dataToInsert = entityInstance.data;

    return await this.database.insertRow(
      entityDef.tableName,
      entityInstance.id,
      dataToInsert,
    );
  }

  private async validateEntity<I extends Ids>(
    entity: I,
    data: Record<PropertyKey, any>,
  ) {
    const entityDef = this.getEntityDef(entity);

    // drop the fields that are not in the entity definition
    for (const key in data) {
      if (!entityDef.fields.find((f) => f.key === key)) {
        delete data[key];
      }
    }

    for (const field of entityDef.fields) {
      // Check if the field is required
      if (field.required) {
        if (
          !(field.key in data) || data[field.key] === null ||
          data[field.key] === undefined
        ) {
          raiseOrmException(
            "RequiredFieldMissing",
            `Field ${field.key as string} is required`,
          );
        }
      }

      // Set default value if not provided
      const isEmpty = (value: any) => {
        return value === null || value === undefined || value === "";
      };

      if (!(field.key in data || isEmpty(data[field.key]))) {
        if (field.defaultValue) {
          if (typeof field.defaultValue === "function") {
            data[field.key] = field.defaultValue();
          } else {
            data[field.key] = field.defaultValue;
          }
        }
        if (!field.defaultValue) {
          switch (field.fieldType) {
            case "BooleanField":
              data[field.key] = false;
              break;
            case "JSONField":
              data[field.key] = {};
              break;
            case "IntField":
              data[field.key] = 0;
              break;
            case "BigIntField":
              data[field.key] = 0;
              break;
            default:
              data[field.key] = null;
              break;
          }
        }
      }

      if (field.fieldType === "ConnectionField") {
        // get fetch fields
        if (!isEmpty(data[field.key])) {
          console.log("fetching connection fields");
          const connectionId = data[field.key];
          if (!field.connection) {
            raiseOrmException(
              "InvalidConnection",
              `Connection field ${field.key as string} is missing`,
            );
          }

          // check if the connection entity exists

          const connectionEntity = field.connection.entity;
          console.log("connectionEntity", connectionEntity);
          if (!this.hasEntity(connectionEntity)) {
            raiseOrmException(
              "InvalidConnection",
              `Connection entity ${connectionEntity} does not exist`,
            );
          }

          if (!await this.exists(connectionEntity, connectionId)) {
            raiseOrmException(
              "EntityNotFound",
              `Connection ${connectionEntity} with id ${connectionId} does not exist`,
            );
          }

          console.log("connectionId", connectionId);
          // fetch the connection fields
          const connectionFields = field.connection.fetchFields || [];
          if (connectionFields.length > 0) {
            const connectionData = await this.getEntity(
              connectionEntity as I,
              connectionId,
            );
            for (const connectionField of connectionFields) {
              if (connectionField.key in connectionData) {
                data[connectionField.key] = connectionData[connectionField.key];
                console.log("connectionField", connectionField.key);
              }
            }
          }
        }
      }
    }
    return data;
  }
  private generateId(): string {
    return generateRandomString(32);
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
      private orm: Orm = orm;
      private fields: EasyField[] = entityDef.fields;

      get id(): EasyFieldTypeMap["IDField"] {
        return this._data.id;
      }
      set id(value: EasyFieldTypeMap["IDField"]) {
        this._data.id = value;
      }

      get createdAt(): EasyFieldTypeMap["DateField"] {
        return this._data.createdAt;
      }

      set createdAt(value: EasyFieldTypeMap["DateField"]) {
        this._data.createdAt = value;
      }

      get updatedAt(): EasyFieldTypeMap["DateField"] {
        return this._data.updatedAt;
      }

      set updatedAt(value: EasyFieldTypeMap["DateField"]) {
        this._data.updatedAt = value;
      }

      private _data: Record<string, any> = {};
      get data() {
        return this._data;
      }
      constructor(
        data: any,
      ) {
        console.log("data", data);
        this._data = data;
        for (const item in data) {
          Object.defineProperty(this, item, {
            get: function () {
              return this._data[item];
            },
            set: function (value) {
              this._data[item] = value;
            },
          });
        }

        this.id = data.id || this.orm.generateId();
        this.createdAt = data.createdAt || now();
        this.updatedAt = data.updatedAt || now();
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

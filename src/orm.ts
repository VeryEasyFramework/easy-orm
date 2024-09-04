import {
  Database,
  type DatabaseConfig,
  type ListOptions,
} from "#/database/database.ts";
import { type BasicFgColor, ColorMe } from "@vef/easy-cli";
import type {
  CreateEntityFromDef,
  EntityClassConstructor,
  EntityDefFromModel,
  EntityDefinition,
  FieldGroup,
  ListEntityFromDef,
} from "#/entity/defineEntityTypes.ts";
import type { RowsResult } from "#/database/adapter/databaseAdapter.ts";

import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";

import { createEntityClass } from "#/entity/entityClass.ts";
import { raiseOrmException } from "#/ormException.ts";
import type { EasyField } from "#/entity/field/ormField.ts";
import { camelToSnakeCase, toPascalCase } from "@vef/string-utils";
import { migrateEntity } from "#/database/migrate/migrateEntity.ts";
import type { FieldKey } from "#/entity/defineEntityTypes.ts";
import { installDatabase } from "#/database/install/installDatabase.ts";
interface Registry {
  [key: string]: {
    [key: PropertyKey]: {
      entity: string;
      idKey: PropertyKey;
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
  dbType: D;

  idFieldType: EasyFieldType = "IDField";
  constructor(options: {
    entities: E;
    databaseType: D;
    databaseConfig: DatabaseConfig[D];
    idFieldType?: EasyFieldType;
  }) {
    this.dbType = options.databaseType;
    if (options.idFieldType) {
      this.idFieldType = options.idFieldType;
    }
    this.database = new Database({
      adapter: options.databaseType,
      config: options.databaseConfig,
      idFieldType: this.idFieldType,
    });

    for (const entity of options.entities) {
      this.addEntity(entity);
    }
  }

  async init() {
    await this.database.init();
    this.initialized = true;
    this.buildEntities();
    this.validateEntities();
  }
  stop() {
    this.database.stop();
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

    this.entityKeys.push(entity.entityId);
    // TODO: Add validation for entity definition
    this.entities[entity.entityId as keyof R] = entity as R[keyof R];
  }

  private buildEntities() {
    for (const entity of this.entityKeys) {
      const entityDef = this.getEntityDef(entity as Ids);
      this.buildConnectionTitleFields(entityDef);
      this.buildListFields(entityDef);
      this.buildFieldGroups(entityDef);
    }
  }
  private validateEntities() {
    for (const entity of this.entityKeys) {
      const entityDef = this.getEntityDef(entity as Ids);
      this.validateEntityDef(entityDef);
    }
    for (const entity of this.entityKeys) {
      const entityDef = this.getEntityDef(entity as Ids);
      this.entityClasses[entity as keyof C] = createEntityClass(
        entityDef,
        this,
      ) as C[keyof C];
    }
  }

  private validateEntityDef(entity: EntityDefinition) {
    this.validateConnectionFields(entity);
    this.validateFetchFields(entity);
    this.entityInfo.push(entity);
  }
  private validateConnectionFields(entity: EntityDefinition) {
    const fields = entity.fields.filter((field) =>
      field.fieldType === "ConnectionField"
    );
    for (const field of fields) {
      if (!field.connectionEntity) {
        raiseOrmException(
          "InvalidConnection",
          `Connection field ${field
            .key as string} in ${entity.entityId} is missing connectionEntity `,
        );
      }
      if (!this.hasEntity(field.connectionEntity)) {
        raiseOrmException(
          "InvalidConnection",
          `Connection entity ${field.connectionEntity} does not exist`,
        );
      }
    }
  }
  private validateFetchFields(entity: EntityDefinition) {
    const fields = entity.fields.filter((field) => field.fetchOptions);
    for (const field of fields) {
      const fetchOptions = field.fetchOptions!;
      if (!this.hasEntity(fetchOptions.fetchEntity)) {
        raiseOrmException(
          "InvalidConnection",
          `Connection entity ${fetchOptions.fetchEntity} does not exist`,
        );
      }
      const connectionEntity = this.getEntityDef(
        fetchOptions.fetchEntity as Ids,
      );

      const connectedField = connectionEntity.fields.filter((f) => {
        return f.key === fetchOptions.thatFieldKey;
      });

      if (!connectedField) {
        raiseOrmException(
          "InvalidField",
          `Connection field ${fetchOptions.thatFieldKey} does not exist on entity ${fetchOptions.fetchEntity}`,
        );
      }
      this.registerFetchField({
        source: {
          entity: entity.entityId,
          field: fetchOptions.thisFieldKey,
        },
        target: {
          entity: fetchOptions.fetchEntity,
          idKey: fetchOptions.thisIdKey,
          field: fetchOptions.thatFieldKey,
        },
      });
    }
  }
  private buildConnectionTitleFields(entity: EntityDefinition) {
    const fields = entity.fields.filter((field) =>
      field.fieldType === "ConnectionField"
    ) as EasyField<PropertyKey, "ConnectionField">[];
    for (const field of fields) {
      const titleField = this.buildConnectionTitleField(field);
      if (!titleField) {
        continue;
      }

      field.connectionTitleField = titleField.key as string;
      entity.fields.push(titleField);
    }
    // this.entities[entity.entityId as keyof R] = entity as R[keyof R];
  }
  private buildFieldGroups(entity: EntityDefinition) {
    const groups: Record<string, FieldGroup> = {};
    // Add default group if no group is specified for a field
    // const defaultGroup = entity.fields.filter((field) => !field.group);
    // if (defaultGroup.length) {
    //   groups["default"] = {
    //     title: "Default",
    //     key: "default",
    //     fields: defaultGroup,
    //   };
    // }

    // for (const field of entity.fields) {
    //   if (field.group) {
    //     if (!groups[field.group]) {
    //       groups[field.group] = {
    //         title: field.group,
    //         key: field.group,
    //         fields: [],
    //       };
    //     }
    //     groups[field.group].fields.push(field);
    //   }
    // }

    // entity.groups = Object.values(groups);
    return entity;
  }
  private buildListFields(entity: EntityDefinition) {
    const listFields: FieldKey<typeof entity.fields>[] = [];
    if (entity.titleField) {
      const titleField = entity.fields.find((field) =>
        field.key === entity.titleField
      );
      if (titleField) {
        titleField.inList = true;
        listFields.push(titleField.key);
      }
    }
    for (const field of entity.fields) {
      if (field.inList) {
        listFields.push(field.key);
      }
      if (field.fieldType === "ConnectionField") {
        if (field.connectionTitleField) {
          const connectionTitleField = entity.fields.find((f) =>
            f.key === field.connectionTitleField
          );
          if (connectionTitleField) {
            connectionTitleField.inList = true;
            listFields.push(connectionTitleField.key);
          }
        }
      }
    }
    listFields.push("createdAt");
    listFields.push("updatedAt");
    listFields.push("id");
    entity.listFields = listFields;
  }
  private buildConnectionTitleField(
    field: EasyField,
  ) {
    if (!field.connectionEntity) {
      return;
    }
    const entity = this.getEntityDef(field.connectionEntity as Ids);
    if (!entity.titleField) {
      return;
    }

    const entityTitleField = entity.fields.find((field) =>
      field.key === entity.titleField
    );
    if (!entityTitleField) {
      return;
    }
    const newkey = `${field.key as string}${
      toPascalCase(camelToSnakeCase(entity.titleField as string))
    }`;

    const titleField = { ...entityTitleField };
    titleField.readOnly = true;
    titleField.fetchOptions = {
      fetchEntity: field.connectionEntity,
      thisIdKey: field.key as string,
      thisFieldKey: newkey,
      thatFieldKey: titleField.key as string,
    };
    titleField.key = newkey;

    return titleField;
  }
  private registerFetchField(config: {
    source: {
      entity: string;

      field: PropertyKey;
    };
    target: {
      entity: string;
      idKey: PropertyKey;
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
      idKey: config.target.idKey,
      field: config.source.field,
    });
  }
  async install() {
    await installDatabase({
      database: this.database,
    });
  }
  async migrate(options?: {
    onProgress?: (progress: number, total: number, message: string) => void;
  }): Promise<string[]> {
    const message = (message: string, color?: BasicFgColor) => {
      return ColorMe.fromOptions(message, { color });
    };

    const results: string[] = [];
    const total = this.entityKeys.length;
    const progress = options?.onProgress || (() => {});
    progress(0, total, message("Validating installation", "brightYellow"));
    await this.install();
    progress(0, total, message("Installation validated", "brightGreen"));

    let count = 0;
    for (const entity of this.entityKeys) {
      progress(
        count,
        total,
        message(`Migrating ${entity as string}`, "brightBlue"),
      );
      const entityDef = this.getEntityDef(entity as Ids);
      const res = await migrateEntity({
        database: this.database,
        entity: entityDef,
        onOutput: (message) => {
          progress(count, total, message);
        },
      });
      progress(
        ++count,
        total,
        message(`Migrated ${entity as string}`, "brightGreen"),
      );
    }
    return results;
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
  ) {
    const entityClass = this.getEntityClass(entity as string);

    const entityInstance = new entityClass();
    await entityInstance.load(id);
    return entityInstance;
  }

  /**
   * Create an new entity
   */
  async createEntity<I extends Ids>(
    entity: I,
    data: Partial<CreateEntityFromDef<R[I]>>,
  ) {
    const entityClass = this.getEntityClass(entity as string);

    const entityInstance = new entityClass();
    await entityInstance.update(data);
    await entityInstance.save();
    return entityInstance;
  }

  /**
   * Update an entity
   */
  async updateEntity<I extends Ids>(
    entity: I,
    id: string,
    data: Partial<CreateEntityFromDef<R[I]>>,
  ) {
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
      options.columns = entityDef.listFields as string[];
    }
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

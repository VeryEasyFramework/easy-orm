import {
  Database,
  type DatabaseConfig,
  type ListOptions,
} from "#/database/database.ts";
import { type BasicFgColor, ColorMe } from "@vef/easy-cli";

import type { RowsResult } from "#/database/adapter/databaseAdapter.ts";

import type {
  EasyFieldType,
  EasyFieldTypeMap,
  SafeType,
} from "#/entity/field/fieldTypes.ts";

import { raiseOrmException } from "#/ormException.ts";
import { migrateEntity } from "#/database/migrate/migrateEntity.ts";

import { installDatabase } from "#/database/install/installDatabase.ts";
import type { EasyEntity } from "#/entity/entity/entityDefinition/easyEntity.ts";
import type { EntityDefinition } from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import { buildEasyEntity } from "#/entity/entity/entityDefinition/buildEasyEntity.ts";
import { validateEntityDefinition } from "#/entity/entity/entityDefinition/validateEasyEntity.ts";
import { FetchRegistry } from "#/entity/registry.ts";
import { buildRecordClass } from "#/entity/entity/entityRecord/buildRecordClass.ts";
import type { EntityRecord } from "#/entity/entity/entityRecord/entityRecord.ts";

export class EasyOrm<
  D extends keyof DatabaseConfig = keyof DatabaseConfig,
> {
  easyEntities: Array<EasyEntity> = [];
  entities: Record<string, EntityDefinition> = {};
  entityClasses: Record<string, typeof EntityRecord> = {};
  private initialized: boolean = false;

  registry: FetchRegistry;

  database: Database<D>;
  dbType: D;

  idFieldType: EasyFieldType = "IDField";
  constructor(options: {
    entities?: EasyEntity[];
    databaseType: D;
    databaseConfig: DatabaseConfig[D];
    idFieldType?: EasyFieldType;
  }) {
    this.registry = new FetchRegistry();
    this.dbType = options.databaseType;
    if (options.idFieldType) {
      this.idFieldType = options.idFieldType;
    }
    this.database = new Database({
      adapter: options.databaseType,
      config: options.databaseConfig,
      idFieldType: this.idFieldType,
    });
    if (options.entities) {
      for (const entity of options.entities) {
        this.addEntity(entity);
      }
    }
  }

  async init() {
    await this.database.init();
    this.initialized = true;
    this.buildEntities();
    this.validateEntities();
    this.createEntityClasses();
  }
  stop() {
    this.database.stop();
  }

  addEntity(entity: EasyEntity) {
    if (this.initialized) {
      raiseOrmException(
        "InvalidOperation",
        "Cannot add entity after initialization",
      );
    }
    if (this.easyEntities.find((e) => e.entityId === entity.entityId)) {
      raiseOrmException(
        "EntityAlreadyExists",
        `Entity ${entity.entityId} already exists`,
      );
    }
    this.easyEntities.push(entity);
  }

  private buildEntities() {
    for (const entity of this.easyEntities) {
      const entityDefinition = buildEasyEntity(this, entity);
      this.entities[entityDefinition.entityId] = entityDefinition;
    }
  }
  private validateEntities() {
    for (const entityDefinition of Object.values(this.entities)) {
      validateEntityDefinition(this, entityDefinition);
    }
  }

  private createEntityClasses() {
    for (const entityDefinition of Object.values(this.entities)) {
      const entityRecordClass = buildRecordClass(this, entityDefinition);
      this.entityClasses[entityDefinition.entityId] = entityRecordClass;
    }
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

    const entities = Object.values(this.entities);
    const results: string[] = [];
    const total = entities.length;
    const progress = options?.onProgress || (() => {});
    progress(0, total, message("Validating installation", "brightYellow"));
    await this.install();
    progress(0, total, message("Installation validated", "brightGreen"));

    let count = 0;
    for (const entity of entities) {
      progress(
        count,
        total,
        message(`Migrating ${entity.entityId}`, "brightBlue"),
      );

      const res = await migrateEntity({
        database: this.database,
        entity,
        onOutput: (message) => {
          progress(count, total, message);
        },
      });
      progress(
        ++count,
        total,
        message(`Migrated ${entity.entityId}`, "brightGreen"),
      );
    }
    return results;
  }

  /**
   * Get an entity by id
   */
  async getEntity(
    entityId: string,
    id: EasyFieldTypeMap["IDField"],
  ): Promise<EntityRecord> {
    const entityClass = this.getEntityClass(entityId);

    const entityRecord = new entityClass();
    await entityRecord.load(id);
    return entityRecord;
  }

  /**
   * Create an new entity
   */
  async createEntity(
    entityId: string,
    data: Record<string, SafeType>,
  ): Promise<EntityRecord> {
    const entityClass = this.getEntityClass(entityId);

    const entityRecord = new entityClass();
    await entityRecord.update(data);
    await entityRecord.save();
    return entityRecord;
  }

  /**
   * Update an entity
   */
  async updateEntity(
    entityId: string,
    id: string,
    data: Record<string, SafeType>,
  ): Promise<EntityRecord> {
    const entityRecord = await this.getEntity(entityId, id);
    await entityRecord.update(data);
    await entityRecord.save();
    return entityRecord;
  }

  /**
   * Delete an entity
   */
  async deleteEntity(entityId: string, id: string | number): Promise<boolean> {
    await this.database.deleteRow(
      this.getEntityDef(entityId).config.tableName,
      "id",
      id,
    );
    return true;
  }

  /**
   * Get a list of entities
   */
  async getEntityList(
    entityId: string,
    options?: ListOptions,
  ): Promise<RowsResult<Record<string, SafeType>>> {
    console.log(options);
    const entityDef = this.getEntityDef(entityId);
    if (!entityDef) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entityId}' is not a registered entity!`,
      );
    }
    options = options || {};
    if (!options.columns) {
      options.columns = entityDef.listFields as string[];
    }
    if (!options.limit) {
      options.limit = 100;
    }

    const result = await this.database.getRows<Record<string, SafeType>>(
      entityDef.config.tableName,
      options,
    );
    return result;
  }

  async batchUpdateField(
    entityId: string,
    field: string,
    value: any,
    filters: Record<string, any>,
  ) {
    const entityDef: EntityDefinition = this.getEntityDef(entityId);
    await this.database.batchUpdateField(
      entityDef.config.tableName,
      field,
      value,
      filters,
    );
  }
  /**
   *  Getters for entity definitions
   */

  getEasyEntityDef(entityId: string): EasyEntity {
    const entity = this.easyEntities.find((e) => e.entityId === entityId);
    if (!entity) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entityId}' is not a registered entity!`,
      );
    }
    return entity;
  }
  getEntityDef(
    entityId: string,
  ): EntityDefinition {
    const def = this.entities[entityId];
    if (!def) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entityId as string}' is not a registered entity!`,
      );
    }
    return def;
  }

  private getEntityClass(
    entityId: string,
  ): typeof EntityRecord {
    const entityClass = this.entityClasses[entityId];
    if (!entityClass) {
      raiseOrmException(
        "EntityNotFound",
        `Entity '${entityId}' is not a registered entity!`,
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

  async exists(
    entityId: string,
    id: string,
  ): Promise<boolean> {
    if (!this.hasEntity(entityId)) {
      return false;
    }

    const entityDef = this.getEntityDef(entityId);
    const result = await this.database.getRow<Record<string, SafeType>>(
      entityDef.config.tableName,
      "id",
      id,
    );
    return result ? true : false;
  }
}

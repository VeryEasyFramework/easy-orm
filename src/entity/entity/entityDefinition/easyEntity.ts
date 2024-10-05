import { BaseDefinition } from "#/entity/baseDefinition.ts";
import type {
  EasyEntityConfig,
  EasyEntityHooks,
  EntityAction,
} from "#/entity/entity/entityDefinition/entityDefTypes.ts";

export class EasyEntity extends BaseDefinition<EasyEntityConfig, "entity"> {
  readonly entityId: string;

  constructor(entityId: string, options?: {
    label?: string;
    description?: string;
  }) {
    super(entityId, options);
    this.entityId = this.key;

    this.config.tableName = this.entityId;
    this.config.idMethod = {
      type: "hash",
      hashLength: 16,
    };
  }
}

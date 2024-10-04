import type { EntityRecord } from "#/entity/entity/entityRecord/entityRecord.ts";
import type { SafeReturnType, SafeType } from "#/entity/field/fieldTypes.ts";

export type EntitityHookFunction = (
  entity: EntityRecord,
) => Promise<void> | void;

export type EntityActionFunction = (
  entity: EntityRecord,
  params?: Record<string, SafeType>,
) => SafeReturnType;

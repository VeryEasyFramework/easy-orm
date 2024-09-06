import type { EntityRecord } from "#/entity/easyEntity/entityRecord/entityRecord.ts";
import { SafeReturnType, SafeType } from "#/entity/field/fieldTypes.ts";

export type HookFunction = (entity: EntityRecord) => Promise<void> | void;

export type ActionFunction = (
  entity: EntityRecord,
  params?: Record<string, SafeType>,
) => SafeReturnType;

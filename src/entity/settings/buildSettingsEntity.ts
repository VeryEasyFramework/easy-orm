import { EasyOrm } from "#/orm.ts";
import { SettingsEntity } from "#/entity/settings/settingsEntity.ts";
import { FieldGroup } from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import { buildFieldGroups } from "#/entity/field/buildFieldGroups.ts";
import { SettingsEntityDefinition } from "#/entity/settings/settingsDefTypes.ts";

export function buildSettingsEntity(
  orm: EasyOrm,
  settingsEntity: SettingsEntity,
): SettingsEntityDefinition {
  const groups: FieldGroup[] = buildFieldGroups(settingsEntity);

  return {
    ...settingsEntity,
    fieldGroups: groups,
  };
}

import type { EasyField } from "../../field/easyField.ts";
import type { EntityDefinition, FieldGroup } from "./entityDefTypes.ts";
import { camelToSnakeCase, toPascalCase } from "@vef/string-utils";
import { raiseOrmException } from "#/ormException.ts";
import type { EasyEntity } from "./easyEntity.ts";
import type { EasyOrm } from "#/orm.ts";

export function buildEasyEntity(
  orm: EasyOrm,
  easyEntity: EasyEntity,
): EntityDefinition {
  buildConnectionTitleFields(orm, easyEntity);
  const groups: FieldGroup[] = buildFieldGroups(easyEntity);
  const listFields = buildListFields(easyEntity);

  const entityDefinition: EntityDefinition = {
    entityId: easyEntity.entityId,
    fields: easyEntity.fields,
    fieldGroups: groups,
    listFields: listFields,
    config: easyEntity.config,
    hooks: easyEntity.hooks,
    actions: easyEntity.actions,
  };
  return entityDefinition;
}

function buildConnectionTitleFields(orm: EasyOrm, easyEntity: EasyEntity) {
  const fields = easyEntity.fields.filter((field) =>
    field.fieldType === "ConnectionField"
  ) as EasyField<PropertyKey, "ConnectionField">[];
  for (const field of fields) {
    const titleField = buildConnectionTitleField(orm, field);
    if (!titleField) {
      continue;
    }

    field.connectionTitleField = titleField.key as string;
    easyEntity.fields.push(titleField);
  }
}

function buildConnectionTitleField(
  orm: EasyOrm,
  field: EasyField,
) {
  if (!field.connectionEntity) {
    return;
  }
  const entity = orm.getEasyEntityDef(field.connectionEntity);
  const titleFieldKey = entity.config.titleField;
  if (!titleFieldKey) {
    return;
  }

  const entityTitleField = entity.fields.find((field) =>
    field.key === titleFieldKey
  );
  if (!entityTitleField) {
    return;
  }
  const newkey = `${field.key as string}${
    toPascalCase(camelToSnakeCase(titleFieldKey))
  }`;

  const titleField = { ...entityTitleField };
  titleField.readOnly = true;
  titleField.inList = field.inList;
  titleField.group = field.group;
  titleField.fetchOptions = {
    fetchEntity: field.connectionEntity,
    thisIdKey: field.key,
    thisFieldKey: newkey,
    thatFieldKey: titleField.key,
  };
  titleField.key = newkey;

  return titleField;
}
function buildListFields(easyEntity: EasyEntity) {
  const listFields: Array<string> = [];

  if (easyEntity.config.titleField) {
    const titleField = easyEntity.fields.find((field) =>
      field.key === easyEntity.config.titleField
    );
    if (titleField) {
      titleField.inList = true;
    }
  }
  for (const field of easyEntity.fields) {
    if (field.inList) {
      listFields.push(field.key);
    }
  }
  listFields.push("createdAt");
  listFields.push("updatedAt");
  listFields.push("id");
  return listFields;
}

function buildFieldGroups(easyEntity: EasyEntity): FieldGroup[] {
  const groups: Record<string, FieldGroup> = {
    default: {
      key: "default",
      title: "Default",
      fields: [],
    },
  };
  const groupKeys = easyEntity.fieldGroups.map((group) => group.key);
  easyEntity.fieldGroups.forEach((group) => {
    groups[group.key] = {
      ...group,
      fields: [],
    };
  });

  for (const field of easyEntity.fields) {
    const groupKey = field.group || "default";
    if (!groupKeys.includes(groupKey)) {
      raiseOrmException(
        "InvalidFieldGroup",
        `Field group ${groupKey} in field ${field.key} does not exist in ${easyEntity.entityId} entity`,
      );
    }
    groups[groupKey].fields.push;
  }
  return Object.values(groups);
}

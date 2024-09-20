import type { EasyField } from "#/entity/field/easyField.ts";
import { raiseOrmException } from "#/ormException.ts";

import type {
  EasyEntityConfig,
  EasyEntityHooks,
  EntityAction,
  EntityActionDefinition,
  EntityHook,
  EntityHookDefinition,
  FieldGroupDefinition,
} from "./entityDefTypes.ts";
import {
  camelToSnakeCase,
  camelToTitleCase,
  toCamelCase,
} from "@vef/string-utils";

export class EasyEntity {
  readonly entityId: string;
  readonly fields: Array<EasyField>;
  readonly fieldGroups: Array<FieldGroupDefinition>;

  config: EasyEntityConfig;

  readonly actions: Array<EntityAction>;

  readonly hooks: EasyEntityHooks;
  constructor(entityId: string, options?: {
    label?: string;
    description?: string;
  }) {
    this.entityId = toCamelCase(camelToSnakeCase(entityId));
    this.fieldGroups = [{
      key: "default",
      title: "No Group",
      description: "The default field group",
    }];
    this.fields = [];
    this.actions = [];

    this.hooks = {
      beforeSave: [],
      afterSave: [],
      beforeInsert: [],
      afterInsert: [],
      validate: [],
    };

    this.actions = [];

    // set the default config
    this.config = {
      label: options?.label || camelToTitleCase(this.entityId),
      description: options?.description || "",
      tableName: camelToSnakeCase(this.entityId),
      idMethod: {
        type: "hash",
        hashLength: 16,
      },
    };
  }
  setConfig(config: Partial<EasyEntityConfig>) {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  addField(field: EasyField) {
    // check if the field is already in the list by the key

    if (this.fields.find((f) => f.key === field.key)) {
      raiseOrmException(
        "InvalidField",
        `Field with key ${field.key} already exists in entity ${this.entityId}`,
      );
    }

    this.fields.push(field);
  }

  addFields(fields: Array<EasyField>) {
    fields.forEach((field) => {
      this.addField(field);
    });
  }

  addFieldGroup(group: FieldGroupDefinition) {
    // check if the group is already in the list by the key
    if (this.fieldGroups.find((g) => g.key === group.key)) {
      raiseOrmException(
        "InvalidFieldGroup",
        `Field group with key ${group.key} already exists in entity ${this.entityId}`,
      );
    }

    this.fieldGroups.push(group);
  }

  addFieldGroups(groups: Array<FieldGroupDefinition>) {
    groups.forEach((group) => {
      this.addFieldGroup(group);
    });
  }

  addHook(hook: EntityHook, definition: EntityHookDefinition) {
    this.hooks[hook].push(definition);
  }

  addAction(actionName: string, actionDefinition: EntityActionDefinition) {
    this.actions.push({
      key: actionName,
      ...actionDefinition,
    });
  }
}

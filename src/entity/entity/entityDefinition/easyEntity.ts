import type { EasyField } from "#/entity/field/easyField.ts";
import { raiseOrmException } from "#/ormException.ts";
import {
   ChildEntityModel,
   EntityChildDefinition,
} from "#/entity/child/childEntity.ts";

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

   readonly children: Array<EntityChildDefinition>;

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
      this.children = [];
      this.actions = [];

      this.hooks = {
         beforeSave: [],
         afterSave: [],
         beforeInsert: [],
         afterInsert: [],
         validate: [],
         beforeValidate: [],
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

      // check if the field key is a protected keyword
      if (["id", "data"].includes(field.key)) {
         raiseOrmException(
            "InvalidField",
            `Field with key ${field.key} is a protected keyword in entity ${this.entityId}`,
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

   addChild(child: EntityChildDefinition) {
      // check if the child is already in the list by the key
      if (this.children.find((c) => c.childName === child.childName)) {
         raiseOrmException(
            "InvalidChild",
            `Child with key ${child.childName} already exists in entity ${this.entityId}`,
         );
      }

      this.children.push(child);
   }
}

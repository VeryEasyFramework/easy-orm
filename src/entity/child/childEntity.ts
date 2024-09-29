import type { EasyField } from "#/entity/field/easyField.ts";

export interface EntityChildConfig {
  tableName: string;
}
export interface EntityChildDefinition {
  childName: string;
  label: string;
  fields: EasyField[];
  config?: EntityChildConfig;
}
export abstract class ChildEntityModel {
  abstract parentEntityModel: string;
  abstract parentEntityID: string;
  abstract parentFieldKey: string;

  abstract childId: string;
  abstract label: string;
  abstract fields: EasyField[];
}

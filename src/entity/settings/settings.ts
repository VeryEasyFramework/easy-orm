import { EasyFieldTypeMap } from "#/entity/field/fieldTypes.ts";
import type { ORMField } from "../field/ormField.ts";

export interface SettingsMeta {
  settings: string;
  fields: ORMField[];
}

export interface Settings {
  id: EasyFieldTypeMap["IDField"];
  created_at: EasyFieldTypeMap["DateField"];
  updated_at: EasyFieldTypeMap["DateField"];
  label: EasyFieldTypeMap["DataField"];
}

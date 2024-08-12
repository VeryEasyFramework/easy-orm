import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";

export type ExtractFieldKey<T> = T extends EasyField<infer K, infer T> ? K
  : never;

interface Choice {
  key: string;
  label: string;
}

export interface FetchedField {
  key: string;
  label?: string;
  description?: string;
}

export interface ConnectedField {
  entity: string;
  fetchFields?: Array<FetchedField>;
}

export interface EasyField<
  P extends PropertyKey = PropertyKey,
  T extends EasyFieldType = EasyFieldType,
> {
  key: P;
  label?: string;
  description?: string;
  primaryKey?: boolean;
  required?: boolean;
  readOnly?: boolean;
  fieldType: T;
  inList?: boolean;
  choices?: Choice[];
  defaultValue?: EasyFieldTypeMap[T] | (() => EasyFieldTypeMap[T]);
  connection?: ConnectedField;
}

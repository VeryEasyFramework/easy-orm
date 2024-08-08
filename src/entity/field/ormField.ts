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

interface FetchedField {
  key: string;
  label?: string;
  description?: string;
}

interface ConnectedField {
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
  required?: boolean;
  readOnly?: boolean;
  fieldType: T;
  choices?: Choice[];
  defaultValue?: EasyFieldTypeMap[T];
  connection?: ConnectedField;
}

import type {
  EasyFieldType,
  EasyFieldTypeMap,
} from "#/entity/field/fieldTypes.ts";

export type ExtractFieldKey<T> = T extends EasyField<infer K, infer T> ? K
  : never;

export interface EasyField<
  P extends PropertyKey = PropertyKey,
  T extends EasyFieldType = EasyFieldType,
> {
  key: P;
  label: string;
  description?: string;
  required?: boolean;
  readOnly?: boolean;
  fieldType: T;
  defaultValue?: EasyFieldTypeMap[T];
  connection?: {
    entity: string;
    fetchFields?: Array<PropertyKey>;
  };
}

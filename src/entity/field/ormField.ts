import type { EasyFieldTypeMap } from "#/entity/field/fieldTypes.ts";

export type ExtractFieldType<T> = T extends keyof EasyFieldTypeMap
  ? EasyFieldTypeMap[T]
  : never;

export type ExtractFieldKey<T> = T extends ORMField ? T["key"] : never;
export interface ORMField<
  P extends PropertyKey = PropertyKey,
  T extends keyof EasyFieldTypeMap = "DataField",
> {
  key: P;
  label: string;
  description?: string;
  fieldType: T;
  choices?: string[];
  required?: boolean;
  readOnly?: boolean;
  linkedEntity?: string;
  linkedEntityLabel?: string[];
  defaultValue?: ExtractFieldType<T>;
}

export interface Currency {
  symbol: string;
  name: string;
  code: string;
  decimals: number;
}

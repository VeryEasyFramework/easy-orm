import type { EasyFieldTypeMap } from "#/entity/field/fieldTypes.ts";

export type ExtractFieldType<T> = T extends keyof EasyFieldTypeMap
  ? EasyFieldTypeMap[T]
  : never;

export type ExtractFieldKey<T> = T extends ORMField ? T["key"] : never;
export interface ORMField<
  P extends PropertyKey = PropertyKey,
> {
  key: P;
  label: string;
  description?: string;
  fieldType: keyof EasyFieldTypeMap;
  choices?: string[];
  required?: boolean;
  readOnly?: boolean;
  linkedEntity?: string;
  linkedEntityLabel?: string[];
  defaultValue?: ExtractFieldType<keyof EasyFieldTypeMap>;
}

export interface Currency {
  symbol: string;
  name: string;
  code: string;
  decimals: number;
}

import { EasyField } from "#/entity/field/ormField.ts";

/**
 * The field types that are available in Easy ORM.
 */
export interface EasyFieldTypeMap {
  IDField: string;
  DataField: string;
  IntField: number;
  BigIntField: bigint;
  DecimalField: number;
  DateField: Date;
  TimeStampField: number;
  BooleanField: boolean;
  PasswordField: string;
  ChoicesField: string;
  MultiChoiceField: string[];
  TextField: string;
  EmailField: string;
  ImageField: string;
  JSONField: Record<string, any>;
  PhoneField: string;
  ConnectionField: string;
  FetchField: string | string[] | Record<string, any> | number | Date;
}

export type EasyFieldType = keyof EasyFieldTypeMap;

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
  ChoicesField: string | number;
  MultiChoiceField: string[];
  TextField: string;
  EmailField: string;
  ImageField: string;
  JSONField: Record<string, any>;
  PhoneField: string;
  ConnectionField: string;
}

export type EasyFieldType = keyof EasyFieldTypeMap;

export type SafeType = EasyFieldTypeMap[EasyFieldType] | null;

export type SafeReturnType = Promise<SafeType | void> | SafeType | void;

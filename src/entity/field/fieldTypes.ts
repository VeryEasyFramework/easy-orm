export interface EasyFieldTypeMap {
  IDField: string;
  /**
   * @description DataField is for short text data. It's limited to 255 characters.
   */
  DataField: string;
  IntField: number;
  BigIntField: bigint;
  DateField: Date;
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
}

export type EasyFieldType = keyof EasyFieldTypeMap;

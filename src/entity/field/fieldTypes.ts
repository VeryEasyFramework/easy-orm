export interface EasyFieldTypeMap {
  IDField: string;
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

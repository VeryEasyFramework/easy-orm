import { FieldType } from "./fieldTypes.ts";

export interface FieldTypes {
    IDField: string;
    DataField: string;
    IntField: number;
    DateField: Date;
    BooleanField: boolean;
    PasswordField: string;
    ChoicesField: string;
    MultiChoiceField: string[];
}

type ExtractFieldType<T> = T extends keyof FieldTypes ? FieldTypes[T] : never;

export interface ORMField {
    key: string;
    label: string;
    description?: string;
    fieldType: keyof FieldTypes;
    choices?: string[];
    required?: boolean;
    defaultValue?: ExtractFieldType<keyof FieldTypes>;
}

export interface Currency {
    symbol: string;
    name: string;
    code: string;
    decimals: number;
}

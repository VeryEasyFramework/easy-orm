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

export type ExtractFieldType<T> = T extends keyof FieldTypes ? FieldTypes[T]
    : never;

export type ExtractFieldKey<T> = T extends ORMField ? T["key"] : never;
export interface ORMField<P extends PropertyKey = PropertyKey> {
    key: P;
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

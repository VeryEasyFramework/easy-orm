export type ID = string;
export type SERIAL = string;
export type LINK = string;
export type DATA = string;
export type TEXT = string;
export type LONG_TEXT = string;
export type BOOLEAN = boolean;
export type NUMBER = number;
export type INTEGER = number;
export type FLOAT = number;
export type DATE_TIME = Date;
export type DATE = Date;
export type TIME = string;
export type DURATION = string;
export type PASSWORD = string;
export type EMAIL = string;
export type PHONE = string;
export type CURRENCY = number;
export type SELECT = string;
export type IMAGE = string;
export type FILE = string;


export interface FieldTypeMap {
    ID: ID;
    Serial: SERIAL;
    Link: LINK;
    Data: DATA;
    Json: Record<string, any>;
    Text: TEXT;
    LongText: LONG_TEXT;
    Boolean: BOOLEAN;
    Number: NUMBER;
    Integer: INTEGER;
    Float: FLOAT;
    Datetime: DATE_TIME;
    Date: DATE;
    Time: TIME;
    Duration: DURATION;
    Password: PASSWORD;
    Email: EMAIL;
    Phone: PHONE;
    Currency: CURRENCY;
    Select: SELECT;
    Image: IMAGE;
    File: FILE;
    Child: string;
}

export type FieldType = keyof FieldTypeMap;

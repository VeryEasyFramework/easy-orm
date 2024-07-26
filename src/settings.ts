import {ORMField} from "./ormField.ts";
import {DATA, DATE_TIME, ID} from "./fieldTypes.ts";

export interface SettingsMeta {
    settings: string;
    fields: ORMField[];
}

export interface Settings {
    id: ID;
    created_at: DATE_TIME | string;
    updated_at: DATE_TIME | string;
    label: DATA;
}

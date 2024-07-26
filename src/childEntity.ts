import { ORMField } from "./ormField.ts";


export interface ChildEntityModel {
    entity: string;
    label: string;
    parentModel: string;
    fields: ORMField[];
}

import { ORMField } from "./ormField.ts";
import { DATE_TIME, ID } from "./fieldTypes.ts";

export abstract class ChildEntityModel {
    abstract parentEntityModel: string;
    abstract parentEntityID: string;
    abstract parentFieldKey: string;

    abstract childId: string;
    abstract label: string;
    abstract fields: ORMField[];
}

export type ChildEntity<M extends ChildEntityModel> =
    & {
        [K in M["fields"][number]["key"]]: M["fields"][number]["fieldType"];
    }
    & {
        id: ID;
        created_at: DATE_TIME | string;
        updated_at: DATE_TIME | string;
    };

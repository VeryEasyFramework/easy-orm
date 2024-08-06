import type { ORMField } from "#/entity/field/ormField.ts";

import type { BaseFields } from "#/entity/defineEntityTypes.ts";
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
  & BaseFields;

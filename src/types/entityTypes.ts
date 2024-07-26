import { ChildEntity, ChildEntityModel } from "../childEntity.ts";
import { EntityModel } from "../entityModel.ts";

export interface EntityModelConstructor {
  new (): EntityModel;
  entityId: string;
}

export type Entity<M extends EntityModel> =
  & {
    [K in M["fields"][number]["key"]]: M["fields"][number]["fieldType"];
  }
  & {
    [K in M["children"][number]["childId"]]: ChildEntity<
      M["children"][number]
    >;
  };

export type CreateEntity<M extends EntityModel> =
  & {
    [K in M["fields"][number]["key"]]?: M["fields"][number]["fieldType"];
  }
  & {
    [K in M["children"][number]["childId"]]?: ChildEntity<
      M["children"][number]
    >;
  };

export type UpdateEntity<M extends EntityModel> =
  & {
    [K in M["fields"][number]["key"]]?: M["fields"][number]["fieldType"];
  }
  & {
    [K in M["children"][number]["childId"]]?: ChildEntity<
      M["children"][number]
    >;
  };

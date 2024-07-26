import { ChildEntityModel } from "../src/childEntity.ts";
import { EntityModel } from "../src/entityModel.ts";
import { DenoOrm } from "../src/orm.ts";
import { ORMField } from "../src/ormField.ts";

class UserEntity extends EntityModel {
  static entityId = "user";
  label = "User";
  fields: ORMField[] = [{
    key: "firstName",
    label: "First Name",
    fieldType: "DataField",
    required: true,
  }, {
    key: "lastName",
    label: "Last Name",
    fieldType: "DataField",
    required: true,
  }, {
    key: "email",
    label: "Email",
    fieldType: "DataField",
    required: true,
  }, {
    key: "password",
    label: "Password",
    fieldType: "DataField",
    required: true,
  }];

  children: ChildEntityModel[] = [];
}

// const orm = new DenoOrm([UserEntity], {
//   databaseConfig: {},
//   databaseType: "postgres",
// });

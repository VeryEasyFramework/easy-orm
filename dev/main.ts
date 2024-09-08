import { EasyOrm } from "#/orm.ts";
import { EasyEntity } from "#/entity/entity/easyEntity.ts";

const userEntity = new EasyEntity("user");

userEntity.addFields([
  {
    key: "firstName",
    label: "First Name",
    fieldType: "DataField",
    description: "The user's first name",
    required: true,
  },
  {
    key: "lastName",
    label: "Last Name",
    description: "The user's last name",
    fieldType: "DataField",
    required: true,
  },
  {
    key: "fullName",
    label: "Full Name",
    fieldType: "DataField",
    description:
      "The user's full name. This field is automatically generated from the first and last name fields.",
    readOnly: true,
  },
  {
    key: "email",
    label: "Email",
    fieldType: "DataField",
    description: "The user's email address",
    required: true,
    inList: true,
  },
  {
    key: "password",
    label: "Password",
    fieldType: "DataField",
    readOnly: true,
    hidden: true,
  },
]);

const orm = new EasyOrm({
  databaseType: "postgres",
  databaseConfig: {
    size: 1,
    camelCase: true,
    clientOptions: {
      database: "easyapp",
      user: "postgres",
      password: "postgres",
      camelCase: true,
      host: "localhost",
      port: 5432,
    },
  },
});

orm.addEntity(userEntity);

orm.init();

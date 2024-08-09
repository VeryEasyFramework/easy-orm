import { generateRandomString } from "@vef/string-utils";
import { defineEntity, EasyOrm } from "../mod.ts";

const userSessionEntity = defineEntity("userSession", {
  fields: [
    {
      key: "user",
      label: "User",
      fieldType: "ConnectionField",
      connection: {
        entity: "user",
        fetchFields: [{ key: "fullName" }],
      },
    },
    {
      key: "sessionId",
      label: "Session ID",
      fieldType: "DataField",
      readOnly: true,
      defaultValue: () => generateRandomString(32),
    },
  ],
  label: "User Session",
});

export const userEntity = defineEntity("user", {
  fields: [
    {
      key: "firstName",
      label: "First Name",
      fieldType: "DataField",
      required: true,
    },
    {
      key: "lastName",
      label: "Last Name",
      fieldType: "DataField",
    },
    {
      key: "fullName",
      label: "Full Name",
      fieldType: "DataField",
      readOnly: true,
    },
    {
      key: "email",
      label: "Email",
      fieldType: "DataField",
    },
    {
      key: "password",
      label: "Password",
      fieldType: "PasswordField",
      readOnly: true,
    },
  ],
  label: "User",
  hooks: {
    async beforeSave() {
      this.fullName = `${this.firstName} ${this.lastName}`;
    },
  },
});

const orm = new EasyOrm({
  databaseType: "json",
  entities: [userSessionEntity, userEntity],
  databaseConfig: {
    dataPath: "./data",
  },
});

await orm.init();

// await orm.createEntity("user", {
//   firstName: "Eli",
//   lastName: "Manning",
// });

// orm.createEntity("userSession", {
//   user: "SerSPYCvpgBfXIiWkaMoljgfZfHXfTHl",
// });

await orm.updateEntity("user", "5cScrTaTGFcAZe7QC0FQpgOnn6mCf63K", {
  firstName: "Bluen",
  lastName: "jsodh",
});

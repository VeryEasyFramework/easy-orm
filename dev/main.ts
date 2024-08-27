import { defineEntity } from "#/entity/defineEntity.ts";
import { EasyOrm } from "#/orm.ts";

defineEntity("User", {
  label: "User",
  fields: [
    {
      fieldType: "BooleanField",
      key: "isActive",
      label: "Is Active",
    },
  ],
});

import { defineEntity } from "#/entity/defineEntity.ts";

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

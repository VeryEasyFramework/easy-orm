import type { Database, DatabaseConfig } from "#/database/database.ts";
import type { EasyField } from "#/entity/field/easyField.ts";

export async function installDatabase(options: {
  database: Database<keyof DatabaseConfig>;
}) {
  const { database } = options;
  await createSettingsTable(database);
}

async function createSettingsTable(database: Database<any>) {
  const tableName = "easy_settings";
  const fields: EasyField[] = [
    {
      key: "entity",
      fieldType: "DataField",
    },
    {
      key: "key",
      fieldType: "DataField",
    },
    {
      key: "value",
      fieldType: "TextField",
    },
  ];
  const exists = await database.adapter.tableExists(tableName);
  if (exists) {
    return;
  }
  await database.adapter.createTable(tableName, {
    key: "id",
    fieldType: "DataField",
    primaryKey: true,
  });

  for (const field of fields) {
    await database.adapter.addColumn(tableName, field);
  }
}

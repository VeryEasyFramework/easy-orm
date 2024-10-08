import type { Database, DatabaseConfig } from "#/database/database.ts";
import type { EntityDefinition } from "#/entity/entity/entityDefinition/entityDefTypes.ts";
import type { EasyField } from "#/entity/field/easyField.ts";

const idField: EasyField = {
  key: "id",
  fieldType: "IDField",
  primaryKey: true,
};
const baseFields: EasyField[] = [
  {
    key: "createdAt",
    fieldType: "TimeStampField",
  },
  {
    key: "updatedAt",
    fieldType: "TimeStampField",
  },
];
export async function migrateEntity(options: {
  database: Database<keyof DatabaseConfig>;
  entity: EntityDefinition;
  onOutput?: (message: string) => void;
}) {
  const { database, entity } = options;

  const onOutput = options.onOutput || console.log;
  const tableName = entity.config.tableName;
  // Check if the table exists
  const tableExists = await database.adapter.tableExists(tableName);

  // If the table does not exist, create it

  const primaryField = entity.fields.find((f) => f.primaryKey) || idField;
  if (!tableExists) {
    await database.adapter.createTable(
      tableName,
      primaryField,
      entity.config.idMethod,
    );
    onOutput(`Created table: ${tableName}`);
  } else {
    onOutput(`Table ${tableName} already exists`);
  }

  const existingColumns = await database.adapter.getTableColumns(tableName);

  const fieldsToCreate: EasyField[] = [];

  // Check if the base fields exist
  for (const field of [...baseFields, primaryField]) {
    const columnExists = existingColumns.find((c) => c.name === field.key);
    if (!columnExists) {
      fieldsToCreate.push(field);
    }
  }

  // Check if the entity fields exist
  for (const field of entity.fields) {
    const columnExists = existingColumns.find((c) => c.name === field.key);
    if (!columnExists) {
      fieldsToCreate.push(field);
    }
  }

  // Create the missing columns
  for (const field of fieldsToCreate) {
    if (field.fieldType === "ConnectionField") {
      field.fieldType = field.connectionIdType!;
    }
    await database.adapter.addColumn(tableName, field);
  }
  if (fieldsToCreate.length > 0) {
    onOutput(`Created columns: ${fieldsToCreate.map((f) => f.key).join(", ")}`);
  } else {
    onOutput(`All columns exist`);
  }
}

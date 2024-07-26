import { IRLDBAdapter } from "../dbTypes.ts";
import { IRLRecord } from "../../model/modelTypes.ts";
import { IRLDB } from "../IrlDB.ts";
import { joinPath } from "../../utils/pathHelpers.ts";

export const jsonDBAdapter: IRLDBAdapter = {
  table: {
    writer: async (accountName, tableName) => {
      const path = joinPath(Deno.cwd(), ".db", accountName, tableName);
      const dataFile = joinPath(path, "data.json");
      await Deno.mkdir(path, { recursive: true });
      try {
        await Deno.stat(dataFile);
      } catch (e) {
        await Deno.writeTextFile(dataFile, "[]", {});
      }
    },
    reader: async (accountName, tableName) => {
      const rootPath = joinPath(Deno.cwd(), ".db", accountName);
      if (!tableName) {
        const dirEntries = Deno.readDir(rootPath);
        const tables: string[] = [];
        for await (const entry of dirEntries) {
          if (!entry.isDirectory) continue;
          tables.push(entry.name);
        }
        return tables;
      }
      const dirEntries = Deno.readDirSync(rootPath);
      for (const entry of dirEntries) {
        if (entry.name === tableName) {
          return true;
        }
      }
      return false;
    },
  },
  record: {
    create: async (accountName, model, data) => {
      const modelPath = joinPath(Deno.cwd(), ".db", accountName, model.id);
      const dataFile = joinPath(modelPath, "data.json");
      const records = JSON.parse(await Deno.readTextFile(dataFile));
      records.push(data);
      await Deno.writeTextFile(dataFile, JSON.stringify(records, null, 2));
    },
    update: async (accountName, model, data) => {
      const modelPath = joinPath(Deno.cwd(), ".db", accountName, model.id);
      const dataFile = joinPath(modelPath, "data.json");
      const records = JSON.parse(await Deno.readTextFile(dataFile));
      const index = records.findIndex((r: IRLRecord) => r.id === data.id);
      if (index === -1) {
        throw new Error(`Record ${data.id} not found`);
      }
      const updatedRecord = { ...records[index], ...data };
      records[index] = updatedRecord;
      await Deno.writeTextFile(dataFile, JSON.stringify(records, null, 2));
      return updatedRecord;
    },
    delete: async (accountName, model, id) => {
      const modelPath = joinPath(Deno.cwd(), ".db", accountName, model.id);
      const dataFile = joinPath(modelPath, "data.json");
      const records = JSON.parse(await Deno.readTextFile(dataFile));
      const index = records.findIndex((r: IRLRecord) => r.id === id);
      if (index === -1) {
        throw new Error(`Record ${id} not found`);
      }
      const deletedRecord = records.splice(index, 1)[0];
      await Deno.writeTextFile(dataFile, JSON.stringify(records, null, 2));
      return deletedRecord;
    },
    getSingle: async (accountName, model, id) => {
      const modelPath = joinPath(Deno.cwd(), ".db", accountName, model.id);
      const dataFile = joinPath(modelPath, "data.json");
      const records = JSON.parse(await Deno.readTextFile(dataFile));
      return records.find((r: IRLRecord) => r.id === id);
    },
    getList: async (accountName, model, options) => {
      const modelPath = joinPath(Deno.cwd(), ".db", accountName, model.id);
      const dataFile = joinPath(modelPath, "data.json");
      let data = JSON.parse(await Deno.readTextFile(dataFile)) as IRLRecord[];
      if (options?.filters) {
        for (const filterKey in options.filters) {
          data = data.filter((record) =>
            record[filterKey] === options.filters?.[filterKey]
          );
        }
      }
      return data;
    },
  },
};

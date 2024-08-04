import {
  DataTypeMap,
  ServerStatus,
} from "#/database/adapter/adapters/postgres/pgTypes.ts";

export const dataTypeMap: DataTypeMap = {
  16: "bool",
  17: "bytea",
  18: "char",
  19: "name",
  20: "int8",
  21: "int2",
  22: "int2vector",
  23: "int4",
  24: "regproc",
  25: "text",
  26: "oid",
  27: "tid",
  28: "xid",
  29: "cid",
  30: "oidvector",
  114: "json",
  142: "xml",
  1184: "timestamptz",
};

export const statusMap: Record<any, ServerStatus> = {
  "I": "idle",
  "T": "transaction",
  "E": "error",
  "K": "keyData",
};
export function getDataType(dataTypeID: number) {
  const id = dataTypeID as keyof DataTypeMap;
  if (dataTypeMap[id]) {
    return dataTypeMap[id];
  }
  return "unknown";
}

export function convertToDataType(data: string, type: number) {
  switch (type) {
    case 16:
      return data === "t";
    case 20 || 21 || 23:
      return parseInt(data);
    case 142:
      return JSON.parse(data);
    case 1184:
      return new Date(data);
    default:
      return data;
  }
}

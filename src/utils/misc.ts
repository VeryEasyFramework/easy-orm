import { generateRandomString } from "@vef/string-utils";

export function generateId(): string {
  return generateRandomString(32);
}

export function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === "";
}

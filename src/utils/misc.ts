import { generateRandomString } from "@vef/string-utils";

export function generateId(): string {
  return generateRandomString(32);
}

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { MOST_FINDINGS } from "../shared/finding.ts";


const JSON_INDENT = 2;

const NOTHING = 0;

export const writeComplaints = (path: string, complaints: readonly string[]): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(complaints, null, JSON_INDENT));
};

export const complaintsIn = (json: string): readonly string[] => {
  let written: unknown;

  try {
    written = JSON.parse(json);
  } catch {
    return [];
  }

  if (!Array.isArray(written)) {
    return [];
  }

  return (written as readonly unknown[])
    .filter((complaint) => typeof complaint === "string")
    .slice(NOTHING, MOST_FINDINGS);
};

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";


const MANIFEST = "package.json";

const manifestAt = (file: string): unknown => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const versionIn = (manifest: unknown): string | null =>
  typeof manifest === "object" &&
  manifest !== null &&
  "version" in manifest &&
  typeof manifest.version === "string"
    ? manifest.version
    : null;

export const appVersion = (): string | null => versionIn(manifestAt(resolve(rootDir, MANIFEST)));

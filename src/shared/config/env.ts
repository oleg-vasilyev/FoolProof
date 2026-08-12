import { resolve } from "node:path";


export const rootDir = resolve(import.meta.dirname, "..", "..", "..");

export function requireEnv(env: Record<string, string>, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is missing — set it in the env file the npm script loads`);
  }

  return value;
}

export function optionalEnv(env: Record<string, string>, key: string): string | null {
  const value = env[key];

  return value === undefined || value === "" ? null : value;
}

export function loadEnv(
  source: Record<string, string | undefined> = process.env
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, value] as const]
    )
  );
}

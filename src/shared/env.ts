import { readFileSync } from "node:fs";
import { resolve } from "node:path";


export const rootDir = resolve(import.meta.dirname, "..", "..");

export function requireEnv(env: Record<string, string>, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`.env is missing ${key}`);
  }

  return value;
}

function readEnvFile(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(rootDir, ".env"), "utf8");

    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
        .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()])
    );
  } catch {
    return {};
  }
}

export function loadEnv(): Record<string, string> {
  const fromProcess = Object.entries(process.env).flatMap(([key, value]) =>
    value === undefined ? [] : [[key, value] as const]
  );

  return { ...readEnvFile(), ...Object.fromEntries(fromProcess) };
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv, requireEnv, rootDir } from "#shared/config/env.ts";


vi.mock("node:fs", () => ({ readFileSync: vi.fn() }));

const readFileSyncMock = vi.mocked(readFileSync);

const givenEnvFile = (contents: string): void => {
  readFileSyncMock.mockReturnValue(contents);
};

const givenNoEnvFile = (): void => {
  readFileSyncMock.mockImplementation(() => {
    throw new Error("ENOENT");
  });
};

describe("rootDir", () => {
  it("should point at the project root, however deep this file is nested", () => {
    expect(join(rootDir, "src", "shared", "config")).toBe(import.meta.dirname);
  });
});

describe("requireEnv()", () => {
  it("should return a value that is present", () => {
    expect(requireEnv({ BOT_TOKEN: "secret" }, "BOT_TOKEN")).toBe("secret");
  });

  it("should throw when the key is missing", () => {
    expect(() => requireEnv({}, "BOT_TOKEN")).toThrow("BOT_TOKEN");
  });

  it("should throw on an empty value rather than pass it on", () => {
    expect(() => requireEnv({ BOT_TOKEN: "" }, "BOT_TOKEN")).toThrow();
  });

  it("should name the missing key so the failure is actionable", () => {
    expect(() => requireEnv({}, "WEBHOOK_URL")).toThrow(/WEBHOOK_URL/);
  });
});

describe("loadEnv()", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    givenEnvFile("");
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should read a key and value from the file", () => {
    givenEnvFile("BOT_TOKEN=abc123");

    expect(loadEnv().BOT_TOKEN).toBe("abc123");
  });

  it("should read the .env file at the project root", () => {
    givenEnvFile("");

    loadEnv();

    expect(readFileSyncMock.mock.calls[0]?.[0]).toBe(join(rootDir, ".env"));
  });

  it("should read it as utf8 so non-latin values survive", () => {
    givenEnvFile("");

    loadEnv();

    expect(readFileSyncMock.mock.calls[0]?.[1]).toBe("utf8");
  });

  it("should trim whitespace around keys and values", () => {
    givenEnvFile("  BOT_TOKEN  =  abc123  ");

    expect(loadEnv().BOT_TOKEN).toBe("abc123");
  });

  it("should skip comment lines", () => {
    givenEnvFile("# BOT_TOKEN=commented\nDB_PATH=data/x.db");

    expect(loadEnv().BOT_TOKEN).toBeUndefined();
  });

  it("should skip an indented comment", () => {
    givenEnvFile("   # BOT_TOKEN=commented\nDB_PATH=data/x.db");

    expect(loadEnv().BOT_TOKEN).toBeUndefined();
  });

  it("should keep a hash that appears inside a value", () => {
    givenEnvFile("TOKEN=abc#123");

    expect(loadEnv().TOKEN).toBe("abc#123");
  });

  it("should skip lines without an equals sign", () => {
    givenEnvFile("nonsense\nDB_PATH=data/x.db");

    expect(loadEnv().DB_PATH).toBe("data/x.db");
  });

  it("should not invent a key from a line without an equals sign", () => {
    givenEnvFile("nonsense\nDB_PATH=data/x.db");
    const fromFile = Object.keys(loadEnv()).filter((key) => key.startsWith("nonsen"));

    expect(fromFile).toEqual([]);
  });

  it("should not invent a key from a blank line", () => {
    givenEnvFile("A=1\n\nB=2");

    expect(loadEnv()[""]).toBeUndefined();
  });

  it("should keep equals signs inside a value", () => {
    givenEnvFile("TOKEN=a=b=c");

    expect(loadEnv().TOKEN).toBe("a=b=c");
  });

  it("should read several keys", () => {
    givenEnvFile("A=1\nB=2");
    const env = loadEnv();

    expect([env.A, env.B]).toEqual(["1", "2"]);
  });

  it("should handle carriage returns", () => {
    givenEnvFile("A=1\r\nB=2");

    expect(loadEnv().B).toBe("2");
  });

  it("should survive a missing .env file", () => {
    givenNoEnvFile();

    expect(() => loadEnv()).not.toThrow();
  });

  it("should still expose process env when the file is missing", () => {
    givenNoEnvFile();
    process.env.FROM_PROCESS = "yes";

    expect(loadEnv().FROM_PROCESS).toBe("yes");
  });

  it("should let the real environment win over the file", () => {
    givenEnvFile("BOT_TOKEN=from-file");
    process.env.BOT_TOKEN = "from-process";

    expect(loadEnv().BOT_TOKEN).toBe("from-process");
  });

  it("should drop undefined process values instead of exposing them", () => {
    givenEnvFile("");
    delete process.env.DEFINITELY_UNSET;

    expect(Object.keys(loadEnv())).not.toContain("DEFINITELY_UNSET");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";


const env = new EnvStub();

const readFileSyncSpy = vi.fn();

const resolveSpy = vi.fn();

vi.mock("node:fs", () => ({
  readFileSync: (file: string, encoding: string) => readFileSyncSpy(file, encoding),
}));

vi.mock("node:path", () => ({
  resolve: (...parts: readonly string[]) => resolveSpy(...parts),
}));

vi.mock("#shared/config/env.ts", () => env.module);

const { appVersion } = await import("#diagnostics/bot/app-version.ts");


const VERSION = "1.10.0";

const MANIFEST_PATH = "<the manifest>";

const ONCE = 1;

const NEVER = 0;

describe("appVersion()", () => {
  let log: LoggerStub;

  beforeEach(() => {
    vi.clearAllMocks();

    log = new LoggerStub();
    resolveSpy.mockReturnValue(MANIFEST_PATH);
    readFileSyncSpy.mockReturnValue(JSON.stringify({ name: "foolproof", version: VERSION }));
  });

  it("should look for the manifest at the project root", () => {
    appVersion(log);

    expect(resolveSpy).toHaveBeenCalledWith(env.rootDir, "package.json");
  });

  it("should read whatever that resolves to, as text", () => {
    appVersion(log);

    expect(readFileSyncSpy).toHaveBeenCalledWith(MANIFEST_PATH, "utf8");
  });

  it("should answer with the version the manifest declares", () => {
    expect(appVersion(log)).toBe(VERSION);
  });

  it("should answer with nothing when the manifest has no version", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify({ name: "foolproof" }));

    expect(appVersion(log)).toBeNull();
  });

  it("should answer with nothing when the version is not text", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify({ version: 110 }));

    expect(appVersion(log)).toBeNull();
  });

  it("should answer with nothing when the manifest is not an object at all", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify("1.10.0"));

    expect(appVersion(log)).toBeNull();
  });

  it("should answer with nothing rather than throw when the manifest is unreadable", () => {
    readFileSyncSpy.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    expect(appVersion(log)).toBeNull();
  });

  it("should warn, naming the manifest and the reason, when it is unreadable", () => {
    readFileSyncSpy.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    appVersion(log);

    expect(log.warnSpy).toHaveBeenCalledWith(expect.stringContaining(MANIFEST_PATH));
    expect(log.warnSpy).toHaveBeenCalledWith(expect.stringContaining("ENOENT"));
  });

  it("should answer with nothing rather than throw when the manifest is not JSON", () => {
    readFileSyncSpy.mockReturnValue("{not json");

    expect(appVersion(log)).toBeNull();
  });

  it("should warn when the manifest is not JSON", () => {
    readFileSyncSpy.mockReturnValue("{not json");

    appVersion(log);

    expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should not warn when the manifest reads, even with no version in it", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify({ name: "foolproof" }));

    appVersion(log);

    expect(log.warnSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should read the manifest again on every call, so a report is never stale", () => {
    appVersion(log);
    appVersion(log);

    expect(readFileSyncSpy).toHaveBeenCalledTimes(2);
  });
});

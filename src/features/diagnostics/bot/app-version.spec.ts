import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";


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

describe("appVersion()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveSpy.mockReturnValue(MANIFEST_PATH);
    readFileSyncSpy.mockReturnValue(JSON.stringify({ name: "foolproof", version: VERSION }));
  });

  it("should look for the manifest at the project root", () => {
    appVersion();

    expect(resolveSpy).toHaveBeenCalledWith(env.rootDir, "package.json");
  });

  it("should read whatever that resolves to, as text", () => {
    appVersion();

    expect(readFileSyncSpy).toHaveBeenCalledWith(MANIFEST_PATH, "utf8");
  });

  it("should answer with the version the manifest declares", () => {
    expect(appVersion()).toBe(VERSION);
  });

  it("should answer with nothing when the manifest has no version", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify({ name: "foolproof" }));

    expect(appVersion()).toBeNull();
  });

  it("should answer with nothing when the version is not text", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify({ version: 110 }));

    expect(appVersion()).toBeNull();
  });

  it("should answer with nothing when the manifest is not an object at all", () => {
    readFileSyncSpy.mockReturnValue(JSON.stringify("1.10.0"));

    expect(appVersion()).toBeNull();
  });

  it("should answer with nothing rather than throw when the manifest is unreadable", () => {
    readFileSyncSpy.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    expect(appVersion()).toBeNull();
  });

  it("should answer with nothing rather than throw when the manifest is not JSON", () => {
    readFileSyncSpy.mockReturnValue("{not json");

    expect(appVersion()).toBeNull();
  });

  it("should read the manifest again on every call, so a report is never stale", () => {
    appVersion();
    appVersion();

    expect(readFileSyncSpy).toHaveBeenCalledTimes(2);
  });
});

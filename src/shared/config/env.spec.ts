import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import { loadEnv, requireEnv, rootDir } from "#shared/config/env.ts";


const PROBE = "FOOLPROOF_PROBE_KEY";

const OTHER_PROBE = "FOOLPROOF_OTHER_PROBE_KEY";

describe("rootDir", () => {
  it("should point at the project root, however deep this file is nested", () => {
    expect(join(rootDir, "src", "shared", "config")).toBe(import.meta.dirname);
  });
});

describe("requireEnv()", () => {
  it("should return a value that is present", () => {
    expect(requireEnv({ BOT_TOKEN: "secret" }, "BOT_TOKEN")).toBe("secret");
  });

  it("should throw when the key is absent", () => {
    expect(() => requireEnv({}, "BOT_TOKEN")).toThrow();
  });

  it("should throw when the key is present but empty, which a half-filled file gives", () => {
    expect(() => requireEnv({ BOT_TOKEN: "" }, "BOT_TOKEN")).toThrow();
  });

  it("should name the missing key, so the message says what to fix", () => {
    expect(() => requireEnv({}, "BOT_TOKEN")).toThrow(/BOT_TOKEN/);
  });

  it("should point at the env file, since that is where the value comes from", () => {
    expect(() => requireEnv({}, "BOT_TOKEN")).toThrow(/env file/);
  });

  it("should not confuse one key with another", () => {
    expect(() => requireEnv({ LOG_LEVEL: "info" }, "BOT_TOKEN")).toThrow(/BOT_TOKEN/);
  });
});

describe("loadEnv()", () => {
  afterEach(() => {
    delete process.env[PROBE];
    delete process.env[OTHER_PROBE];
  });

  it("should read what the runtime was given, which is where --env-file puts it", () => {
    process.env[PROBE] = "from-the-env-file";

    expect(loadEnv()[PROBE]).toBe("from-the-env-file");
  });

  it("should carry every key, not only the ones the app knows about", () => {
    process.env[PROBE] = "one";
    process.env[OTHER_PROBE] = "two";
    const env = loadEnv();

    expect([env[PROBE], env[OTHER_PROBE]]).toEqual(["one", "two"]);
  });

  it("should leave out a key that was deleted rather than reporting it as empty", () => {
    process.env[PROBE] = "gone";
    delete process.env[PROBE];

    expect(PROBE in loadEnv()).toBe(false);
  });

  it("should drop a key whose value is undefined, which the type allows", () => {
    expect(PROBE in loadEnv({ [PROBE]: undefined })).toBe(false);
  });

  it("should keep the defined keys alongside a dropped one", () => {
    expect(loadEnv({ [PROBE]: undefined, [OTHER_PROBE]: "kept" })).toEqual({
      [OTHER_PROBE]: "kept",
    });
  });

  it("should keep an empty value, so requireEnv is the one that rejects it", () => {
    process.env[PROBE] = "";

    expect(loadEnv()[PROBE]).toBe("");
  });

  it("should take a fresh reading on every call", () => {
    process.env[PROBE] = "before";
    const first = loadEnv()[PROBE];
    process.env[PROBE] = "after";

    expect([first, loadEnv()[PROBE]]).toEqual(["before", "after"]);
  });

  it("should hand back a copy, so a caller cannot edit the process environment", () => {
    process.env[PROBE] = "original";
    const env = loadEnv();

    env[PROBE] = "tampered";

    expect(process.env[PROBE]).toBe("original");
  });
});

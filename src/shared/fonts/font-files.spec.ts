import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";


const env = new EnvStub();

const existsSyncSpy = vi.fn();

vi.mock("node:fs", () => ({
  existsSync: (file: string) => existsSyncSpy(file),
}));

vi.mock("node:path", () => ({
  resolve: (...parts: readonly string[]) => parts.join("/"),
}));

vi.mock("#shared/config/env.ts", () => env.module);

const { FONT_FILES, requireFonts } = await import("#shared/fonts/font-files.ts");

const FACES = 2;

describe("FONT_FILES", () => {
  it("should name the faces under the project's own assets", () => {
    expect(FONT_FILES).toEqual([
      `${env.rootDir}/assets/fonts/NotoSans-Regular.ttf`,
      `${env.rootDir}/assets/fonts/NotoSans-Bold.ttf`,
    ]);
  });

  it("should ship a bold face, since the sheets ask for one", () => {
    expect(FONT_FILES.some((file) => file.includes("Bold"))).toBe(true);
  });
});

describe("requireFonts()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    existsSyncSpy.mockReturnValue(true);
  });

  it("should pass when every font is in place", () => {
    expect(() => requireFonts()).not.toThrow();
  });

  it("should check every face anything will load", () => {
    requireFonts();

    expect(existsSyncSpy).toHaveBeenCalledTimes(FACES);
  });

  it("should refuse when a font is missing", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(() => requireFonts()).toThrow();
  });

  it("should name the missing file, so the fix is obvious", () => {
    existsSyncSpy.mockImplementation((file: string) => !file.includes("Bold"));

    expect(() => requireFonts()).toThrow(/NotoSans-Bold\.ttf/);
  });

  it("should list every missing face apart, not run their names together", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(() => requireFonts()).toThrow(/NotoSans-Regular\.ttf, .*NotoSans-Bold\.ttf/);
  });

  it("should not complain about a face that is present", () => {
    existsSyncSpy.mockImplementation((file: string) => !file.includes("Bold"));

    expect(() => requireFonts()).not.toThrow(/NotoSans-Regular\.ttf/);
  });
});

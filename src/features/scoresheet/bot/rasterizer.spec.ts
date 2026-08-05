import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";


const FONT_FAMILY = "Test Sans";

const env = new EnvStub();

const PNG = Buffer.from("png-bytes");

const resvgSpy = vi.fn();

const renderSpy = vi.fn();

const asPngSpy = vi.fn();

const existsSyncSpy = vi.fn();

vi.mock("@resvg/resvg-js", () => ({
  Resvg: class {
    public constructor(svg: string, options: unknown) {
      resvgSpy(svg, options);
    }

    public render(): { asPng: () => Buffer } {
      renderSpy();

      return { asPng: () => asPngSpy() };
    }
  },
}));

vi.mock("node:fs", () => ({
  existsSync: (file: string) => existsSyncSpy(file),
}));

vi.mock("node:path", () => ({
  resolve: (...parts: readonly string[]) => parts.join("/"),
}));

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY,
}));

const { rasterize, requireFonts } = await import("#scoresheet/bot/rasterizer.ts");

const SVG = "<svg/>";

const optionsUsed = (): { font: Record<string, unknown> } =>
  (resvgSpy.mock.calls[0]?.[1] ?? { font: {} }) as { font: Record<string, unknown> };

describe("rasterize()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    asPngSpy.mockReturnValue(PNG);
    existsSyncSpy.mockReturnValue(true);
  });

  it("should hand the drawing to the rasterizer untouched", () => {
    rasterize(SVG);

    expect(resvgSpy.mock.calls[0]?.[0]).toBe(SVG);
  });

  it("should return the bytes the rasterizer produced", () => {
    expect(rasterize(SVG)).toBe(PNG);
  });

  it("should refuse the machine's own fonts, so the image is the same everywhere", () => {
    rasterize(SVG);

    expect(optionsUsed().font.loadSystemFonts).toBe(false);
  });

  it("should load the fonts shipped with the repository", () => {
    rasterize(SVG);

    expect(optionsUsed().font.fontFiles).toEqual([
      `${env.rootDir}/assets/fonts/NotoSans-Regular.ttf`,
      `${env.rootDir}/assets/fonts/NotoSans-Bold.ttf`,
    ]);
  });

  it("should ship a bold face, since the sheet asks for one", () => {
    rasterize(SVG);
    const files = optionsUsed().font.fontFiles as readonly string[];

    expect(files.some((file) => file.includes("Bold"))).toBe(true);
  });

  it("should name the same family the drawing asks for", () => {
    rasterize(SVG);

    expect(optionsUsed().font.defaultFontFamily).toBe(FONT_FAMILY);
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

  it("should check every font the rasterizer will load", () => {
    const FACES = 2;

    requireFonts();

    expect(existsSyncSpy).toHaveBeenCalledTimes(FACES);
  });

  it("should refuse to start when a font is missing", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(() => requireFonts()).toThrow();
  });

  it("should name the missing file, so the fix is obvious", () => {
    existsSyncSpy.mockImplementation((file: string) => !file.includes("Bold"));

    expect(() => requireFonts()).toThrow(/NotoSans-Bold\.ttf/);
  });

  it("should not complain about a face that is present", () => {
    existsSyncSpy.mockImplementation((file: string) => !file.includes("Bold"));

    expect(() => requireFonts()).not.toThrow(/NotoSans-Regular\.ttf/);
  });
});

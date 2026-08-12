import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { SlowestRenderStub } from "#shared/timing/slowest-render.stub.ts";


const FONT_FAMILY = "Test Sans";

const env = new EnvStub();

const timing = new SlowestRenderStub();

const PNG = Buffer.from("png-bytes");

const renderAsyncSpy = vi.fn();

const asPngSpy = vi.fn();

const existsSyncSpy = vi.fn();

vi.mock("@resvg/resvg-js", () => ({
  renderAsync: (svg: string, options: unknown) => renderAsyncSpy(svg, options),
}));

vi.mock("node:fs", () => ({
  existsSync: (file: string) => existsSyncSpy(file),
}));

vi.mock("node:path", () => ({
  resolve: (...parts: readonly string[]) => parts.join("/"),
}));

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("#shared/timing/slowest-render.ts", () => timing.module);

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY,
}));

const { rasterize, requireFonts } = await import("#scoresheet/bot/rasterizer.ts");

const SVG = "<svg/>";

const ONCE = 1;

const optionsUsed = (): { font: Record<string, unknown> } =>
  (renderAsyncSpy.mock.calls[0]?.[1] ?? { font: {} }) as { font: Record<string, unknown> };

describe("rasterize()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    asPngSpy.mockReturnValue(PNG);
    renderAsyncSpy.mockResolvedValue({ asPng: () => asPngSpy() as Buffer });
    existsSyncSpy.mockReturnValue(true);
  });

  it("should hand the drawing to the rasterizer untouched", async () => {
    await rasterize(SVG);

    expect(renderAsyncSpy.mock.calls[0]?.[0]).toBe(SVG);
  });

  it("should return the bytes the rasterizer produced", async () => {
    expect(await rasterize(SVG)).toBe(PNG);
  });

  it("should encode from what the drawing settled to, not from the call itself", async () => {
    await rasterize(SVG);

    expect(renderAsyncSpy).toHaveBeenCalledTimes(ONCE);
    expect(asPngSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should refuse the machine's own fonts, so the image is the same everywhere", async () => {
    await rasterize(SVG);

    expect(optionsUsed().font.loadSystemFonts).toBe(false);
  });

  it("should load the fonts shipped with the repository", async () => {
    await rasterize(SVG);

    expect(optionsUsed().font.fontFiles).toEqual([
      `${env.rootDir}/assets/fonts/NotoSans-Regular.ttf`,
      `${env.rootDir}/assets/fonts/NotoSans-Bold.ttf`,
    ]);
  });

  it("should ship a bold face, since the sheet asks for one", async () => {
    await rasterize(SVG);
    const files = optionsUsed().font.fontFiles as readonly string[];

    expect(files.some((file) => file.includes("Bold"))).toBe(true);
  });

  it("should name the same family the drawing asks for", async () => {
    await rasterize(SVG);

    expect(optionsUsed().font.defaultFontFamily).toBe(FONT_FAMILY);
  });

  it("should time the drawing, since /status reports the slowest one", async () => {
    await rasterize(SVG);

    expect(timing.finishedSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should start the clock before handing the drawing over", async () => {
    renderAsyncSpy.mockImplementation(() => {
      expect(timing.startTimingSpy).toHaveBeenCalledTimes(ONCE);

      return Promise.resolve({ asPng: () => asPngSpy() as Buffer });
    });

    await rasterize(SVG);
  });

  it("should stop the clock only once the bytes exist", async () => {
    asPngSpy.mockImplementation(() => {
      expect(timing.finishedSpy).not.toHaveBeenCalled();

      return PNG;
    });

    await rasterize(SVG);
  });

  it("should not time a drawing that failed", async () => {
    renderAsyncSpy.mockRejectedValue(new Error("resvg gave up"));

    await expect(rasterize(SVG)).rejects.toThrow();

    expect(timing.finishedSpy).not.toHaveBeenCalled();
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

  it("should list every missing face apart, not run their names together", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(() => requireFonts()).toThrow(/NotoSans-Regular\.ttf, .*NotoSans-Bold\.ttf/);
  });

  it("should not complain about a face that is present", () => {
    existsSyncSpy.mockImplementation((file: string) => !file.includes("Bold"));

    expect(() => requireFonts()).not.toThrow(/NotoSans-Regular\.ttf/);
  });
});

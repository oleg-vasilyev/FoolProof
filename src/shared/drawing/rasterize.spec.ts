import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { SlowestRenderStub } from "#shared/timing/slowest-render.stub.ts";


const FONT_FAMILY = "Test Sans";

const env = new EnvStub();

const timing = new SlowestRenderStub();

const PNG = Buffer.from("png-bytes");

const renderAsyncSpy = vi.fn();

const asPngSpy = vi.fn();

const FONT_FILES = ["regular.ttf", "bold.ttf"];

vi.mock("@resvg/resvg-js", () => ({
  renderAsync: (svg: string, options: unknown) => renderAsyncSpy(svg, options),
}));

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("#shared/timing/slowest-render.ts", () => timing.module);

vi.mock("#shared/fonts/font-family.ts", () => ({ FONT_FAMILY }));

vi.mock("#shared/fonts/font-files.ts", () => ({ FONT_FILES }));

const { rasterize, rasterizeToWidth } = await import("#shared/drawing/rasterize.ts");

const SVG = "<svg/>";

const ONCE = 1;

const optionsUsed = (): { font: Record<string, unknown> } =>
  (renderAsyncSpy.mock.calls[0]?.[1] ?? { font: {} }) as { font: Record<string, unknown> };

describe("rasterize()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    asPngSpy.mockReturnValue(PNG);
    renderAsyncSpy.mockResolvedValue({ asPng: () => asPngSpy() as Buffer });
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

  it("should load every face the project ships, and nothing else", async () => {
    await rasterize(SVG);

    expect(optionsUsed().font.fontFiles).toEqual(FONT_FILES);
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

const ASKED_FOR = 700;

const DREW = 704;

const TALL = 1100;

const PIXELS = Uint8Array.from([1, 2, 3, 4]);

const FIT_TO_A_WIDTH = "width";

describe("rasterizeToWidth()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    renderAsyncSpy.mockResolvedValue({ pixels: PIXELS, width: DREW, height: TALL });
  });

  it("should ask for the width it was given rather than the drawing's own", async () => {
    await rasterizeToWidth(SVG, ASKED_FOR);

    expect(renderAsyncSpy.mock.calls[0]?.[1]).toMatchObject({
      fitTo: { mode: FIT_TO_A_WIDTH, value: ASKED_FOR },
    });
  });

  it("should draw with the same fonts as everything else, so the two agree", async () => {
    await rasterizeToWidth(SVG, ASKED_FOR);

    expect(optionsUsed().font).toEqual({
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    });
  });

  it("should report the size the rasterizer actually drew, not the one asked for", async () => {
    const drawn = await rasterizeToWidth(SVG, ASKED_FOR);

    expect({ width: drawn.width, height: drawn.height }).toEqual({ width: DREW, height: TALL });
  });

  it("should hand back the raw pixels as bytes an encoder can take", async () => {
    const drawn = await rasterizeToWidth(SVG, ASKED_FOR);

    expect(Buffer.isBuffer(drawn.pixels)).toBe(true);
    expect([...drawn.pixels]).toEqual([...PIXELS]);
  });

  it("should not claim to be the slowest render, since no player is waiting for it", async () => {
    await rasterizeToWidth(SVG, ASKED_FOR);

    expect(timing.startTimingSpy).not.toHaveBeenCalled();
  });
});

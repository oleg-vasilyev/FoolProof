import { renderAsync } from "@resvg/resvg-js";
import { FONT_FAMILY } from "#shared/fonts/font-family.ts";
import { FONT_FILES } from "#shared/fonts/font-files.ts";
import { startTiming } from "#shared/timing/slowest-render.ts";


export interface Rasterized {
  readonly pixels: Buffer;
  readonly width: number;
  readonly height: number;
}

const withTheProjectsFonts = {
  font: {
    fontFiles: [...FONT_FILES],
    loadSystemFonts: false,
    defaultFontFamily: FONT_FAMILY,
  },
};

export const rasterize = async (svg: string): Promise<Buffer> => {
  const finished = startTiming();

  const drawn = await renderAsync(svg, withTheProjectsFonts);
  const png = drawn.asPng();

  finished();

  return png;
};

export const rasterizeToWidth = async (svg: string, width: number): Promise<Rasterized> => {
  const drawn = await renderAsync(svg, {
    ...withTheProjectsFonts,
    fitTo: { mode: "width", value: width },
  });

  return { pixels: Buffer.from(drawn.pixels), width: drawn.width, height: drawn.height };
};

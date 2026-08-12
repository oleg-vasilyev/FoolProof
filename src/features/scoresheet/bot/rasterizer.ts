import { renderAsync } from "@resvg/resvg-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";
import { startTiming } from "#shared/timing/slowest-render.ts";
import { FONT_FAMILY } from "#scoresheet/render/card-metrics.ts";


const FONT_FILES: readonly string[] = ["NotoSans-Regular.ttf", "NotoSans-Bold.ttf"].map((file) =>
  resolve(rootDir, "assets", "fonts", file)
);

export const requireFonts = (): void => {
  const missing = FONT_FILES.filter((file) => !existsSync(file));

  if (missing.length > 0) {
    throw new Error(`the scoresheet cannot be drawn without ${missing.join(", ")}`);
  }
};

export const rasterize = async (svg: string): Promise<Buffer> => {
  const finished = startTiming();

  const drawn = await renderAsync(svg, {
    font: {
      fontFiles: [...FONT_FILES],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });

  const png = drawn.asPng();
  finished();

  return png;
};

import { renderAsync } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import encodeWebp, { init as initWebp } from "@jsquash/webp/encode.js";
import { rootDir } from "#shared/config/env.ts";
import { FONT_FAMILY } from "#scoresheet/render/card-metrics.ts";
import { FONT_FILES, requireFonts } from "#scoresheet/bot/rasterizer.ts";


const SITE_IMAGE_WIDTH = 1048;

const QUALITY = 80;

const WASM = "node_modules/@jsquash/webp/codec/enc/webp_enc_simd.wasm";

interface CompilesWasm {
  compile(bytes: Uint8Array): Promise<unknown>;
}

const { WebAssembly: assembly } = globalThis as unknown as { WebAssembly: CompilesWasm };

let readied: Promise<unknown> | undefined = undefined;

const readyEncoder = (): Promise<unknown> => {
  readied ??= assembly
    .compile(readFileSync(resolve(rootDir, WASM)))
    .then((module) => initWebp(module));

  return readied;
};

export const siteImageOf = async (svg: string): Promise<Buffer> => {
  requireFonts();

  await readyEncoder();

  const drawn = await renderAsync(svg, {
    font: {
      fontFiles: [...FONT_FILES],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
    fitTo: { mode: "width", value: SITE_IMAGE_WIDTH },
  });

  const encoded = await encodeWebp(
    { data: new Uint8ClampedArray(drawn.pixels), width: drawn.width, height: drawn.height },
    { quality: QUALITY }
  );

  return Buffer.from(encoded);
};

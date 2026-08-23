import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";


const NOTHING_MISSING = 0;

export const FONT_FILES: readonly string[] = [
  "NotoSans-Regular.ttf",
  "NotoSans-Bold.ttf",
].map((file) => resolve(rootDir, "assets", "fonts", file));

export const requireFonts = (): void => {
  const missing = FONT_FILES.filter((file) => !existsSync(file));

  if (missing.length > NOTHING_MISSING) {
    throw new Error(`nothing can be drawn without ${missing.join(", ")}`);
  }
};

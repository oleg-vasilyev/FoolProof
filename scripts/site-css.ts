import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";


const TAILWIND = "node_modules/@tailwindcss/cli/dist/index.mjs";

export const SITE_CSS_SOURCE = "scripts/site.css";

export const SITE_CSS = "docs/styles.css";

export const buildSiteCss = (into: string): void => {
  execFileSync(
    process.execPath,
    [
      resolve(rootDir, TAILWIND),
      "--input",
      resolve(rootDir, SITE_CSS_SOURCE),
      "--output",
      into,
      "--minify",
    ],
    { cwd: rootDir, stdio: "pipe" }
  );
};

export const freshSiteCss = (): string => {
  const scratch = join(mkdtempSync(join(tmpdir(), "site-css-")), "styles.css");

  buildSiteCss(scratch);

  return readFileSync(scratch, "utf8");
};

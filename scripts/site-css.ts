import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";


const TAILWIND = "@tailwindcss/cli@4";

export const SITE_CSS_SOURCE = "scripts/site.css";

export const SITE_CSS = "docs/styles.css";

export const SITE_PAGES = ["docs/index.html", "docs/ru/index.html"];

export const buildSiteCss = (): void => {
  const input = resolve(rootDir, SITE_CSS_SOURCE);
  const output = resolve(rootDir, SITE_CSS);

  execSync(`npx --yes ${TAILWIND} --input "${input}" --output "${output}" --minify`, {
    cwd: rootDir,
    stdio: "inherit",
  });
};

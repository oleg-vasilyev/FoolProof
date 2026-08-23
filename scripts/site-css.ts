import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";


const TAILWIND_MANIFEST = "node_modules/tailwindcss/package.json";

export const SITE_CSS_SOURCE = "docs/styles.source.css";

export const SITE_CSS = "docs/styles.computed.css";

export const SITE_PAGES = ["docs/index.html", "docs/ru/index.html"];

const installedTailwind = (): string =>
  (
    JSON.parse(readFileSync(resolve(rootDir, TAILWIND_MANIFEST), "utf8")) as {
      version: string;
    }
  ).version;

export const buildSiteCss = (): void => {
  const input = resolve(rootDir, SITE_CSS_SOURCE);
  const output = resolve(rootDir, SITE_CSS);
  const cli = `@tailwindcss/cli@${installedTailwind()}`;

  execSync(`npx --yes ${cli} --input "${input}" --output "${output}" --minify`, {
    cwd: rootDir,
    stdio: "inherit",
  });
};

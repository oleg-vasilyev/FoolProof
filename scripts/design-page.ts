import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { posters, type Posters } from "./mockups.ts";


const A_NAMED_SLOT = /(<div class="poster" data-poster="([a-z]+)">)([\s\S]*?)(<\/div>)/g;

const isPosterName = (name: string, drawn: Posters): name is keyof Posters =>
  Object.hasOwn(drawn, name);

const refuse = (why: string): never => {
  throw new Error(`${why} — the page cannot be spliced, fix it by hand and try again`);
};

export const withFreshPosters = (page: string): string => {
  const drawn = posters();
  const filled = new Set<string>();

  const spliced = page.replace(
    A_NAMED_SLOT,
    (whole, opening: string, name: string, body: string, closing: string) => {
      if (!isPosterName(name, drawn)) {
        return refuse(`the page has a slot named "${name}", which nothing draws`);
      }

      if (body.includes("<div")) {
        return refuse(`the "${name}" slot holds nested markup, not one drawing`);
      }

      filled.add(name);

      return `${opening}${drawn[name]}${closing}`;
    }
  );

  for (const name of Object.keys(drawn)) {
    if (!filled.has(name)) {
      refuse(`the page has no slot for "${name}"`);
    }
  }

  return spliced;
};

export const DESIGN_PAGE_SYNC = "docs/mockups/design-page.sync";

export const fingerprintOf = (drawn: Posters): string =>
  createHash("sha256")
    .update(
      Object.entries(drawn)
        .map(([name, svg]) => `${name}\n${svg}`)
        .sort()
        .join("\n")
    )
    .digest("hex");

export const refreshDesignPage = (from: string, to: string): void => {
  const spliced = withFreshPosters(readFileSync(from, "utf8"));

  writeFileSync(to, spliced, "utf8");
  writeFileSync(
    DESIGN_PAGE_SYNC,
    `mockups: ${fingerprintOf(posters())}\n`,
    "utf8"
  );

  console.log(`${to} — every named slot redrawn, every other line left alone`);
  console.log(`${DESIGN_PAGE_SYNC} — the fingerprint of what was spliced in`);
};

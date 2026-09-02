import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { drawnByName } from "./feature-drawings.ts";
import { POSTER_DIR } from "./drawn-into.ts";
import { Locale } from "#shared/locale/locales.ts";


export const ENGLISH_SUFFIX = `-${Locale.En}`;


const A_NAMED_SLOT = /(<div class="poster" data-poster="([a-z]+)">)([\s\S]*?)(<\/div>)/g;

const isPosterName = (name: string, drawn: Readonly<Record<string, string>>): boolean =>
  Object.hasOwn(drawn, name);

const refuse = (why: string): never => {
  throw new Error(`${why} — the page cannot be spliced, fix it by hand and try again`);
};

const withFreshPosters = (page: string, drawn: Readonly<Record<string, string>>): string => {
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

export const DESIGN_PAGE_SYNC = `${POSTER_DIR}/design-page.sync`;

export const inSlotNames = (
  drawn: Readonly<Record<string, string>>
): Readonly<Record<string, string>> =>
  Object.fromEntries(
    Object.entries(drawn)
      .filter(([name]) => name.endsWith(ENGLISH_SUFFIX))
      .map(([name, svg]) => [name.slice(0, -ENGLISH_SUFFIX.length), svg])
  );

export const fingerprintOf = (drawn: Readonly<Record<string, string>>): string =>
  createHash("sha256")
    .update(
      Object.entries(drawn)
        .map(([name, svg]) => `${name}\n${svg}`)
        .sort()
        .join("\n")
    )
    .digest("hex");

export const refreshDesignPage = async (from: string, to: string): Promise<void> => {
  const drawn = inSlotNames(await drawnByName((offered) => offered.posters()));
  const spliced = withFreshPosters(readFileSync(from, "utf8"), drawn);

  writeFileSync(to, spliced, "utf8");
  writeFileSync(
    DESIGN_PAGE_SYNC,
    `posters: ${fingerprintOf(drawn)}\n`,
    "utf8"
  );

  console.log(`${to} — every named slot redrawn, every other line left alone`);
  console.log(`${DESIGN_PAGE_SYNC} — the fingerprint of what was spliced in`);
};

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

export const refreshDesignPage = (from: string, to: string): void => {
  writeFileSync(to, withFreshPosters(readFileSync(from, "utf8")), "utf8");
  console.log(`${to} — every named slot redrawn, every other line left alone`);
};

import { existsSync, readdirSync } from "node:fs";
import { DESIGN_PAGE_SYNC, fingerprintOf, inSlotNames } from "../../../tools/design-page.ts";
import { POSTER_DIR } from "../../../drawings/drawn-into.ts";
import { read } from "../shared/document-files.ts";
import { FIRST_GROUP } from "../shared/markdown-text.ts";


const A_SYNCED_FINGERPRINT = /^posters: ([0-9a-f]{64})$/m;

const A_DRAWN_FILE = /\.(svg|png|webp)$/;

const THE_POSTER_TOOL = "node scripts/tools/tools.ts posters";

const postersTheDiskIsMissingOrHasStale = (
  drawings: Readonly<Record<string, string>>,
  committed: Readonly<Record<string, string | undefined>>
): readonly string[] =>
  Object.entries(drawings).flatMap(([name, svg]) => {
    const committedPath = `${POSTER_DIR}/${name}.svg`;
    const onDisk = committed[name];

    if (onDisk === undefined) {
      return [`${committedPath}: never drawn — run "${THE_POSTER_TOOL}"`];
    }

    return onDisk === svg
      ? []
      : [
          `${committedPath}: the renderer draws something else now — the ` +
            `"refresh-the-pictures" skill redraws this, and the Claude Design ` +
            `page then follows via "update-the-design-page"`,
        ];
  });

const picturesNobodyDraws = (
  drawings: Readonly<Record<string, string>>,
  filesOnDisk: readonly string[]
): readonly string[] =>
  filesOnDisk
    .filter((name) => A_DRAWN_FILE.test(name))
    .filter((name) => !(name.replace(A_DRAWN_FILE, "") in drawings))
    .map(
      (name) =>
        `${POSTER_DIR}/${name}: no feature draws this any more — a picture left behind by ` +
        `a renderer that went away is one a document can still show, so delete it with ` +
        `whatever stopped drawing it`
    );

const committedContentsOf = (
  drawings: Readonly<Record<string, string>>
): Readonly<Record<string, string | undefined>> =>
  Object.fromEntries(
    Object.keys(drawings).map((name) => {
      const committedPath = `${POSTER_DIR}/${name}.svg`;

      return [name, existsSync(committedPath) ? read(committedPath) : undefined];
    })
  );

export const committedPosterComplaints = (
  posters: Readonly<Record<string, string>>,
  committed: Readonly<Record<string, string | undefined>>,
  filesOnDisk: readonly string[]
): readonly string[] => [
  ...postersTheDiskIsMissingOrHasStale(posters, committed),
  ...picturesNobodyDraws(posters, filesOnDisk),
];

export const committedPostersTheRendererDisagreesWith = (
  posters: Readonly<Record<string, string>>
): readonly string[] =>
  committedPosterComplaints(posters, committedContentsOf(posters), readdirSync(POSTER_DIR));

export const designPageComplaints = (
  drawnNow: string,
  syncFile: string | undefined
): readonly string[] => {
  const behind =
    `${DESIGN_PAGE_SYNC}: the Claude Design page was last synced from different ` +
    `drawings than the code now produces — the "update-the-design-page" skill carries ` +
    `them back, and rewrites this file with the fingerprint it pushed`;

  if (syncFile === undefined) {
    return [behind];
  }

  return A_SYNCED_FINGERPRINT.exec(syncFile)?.[FIRST_GROUP] === drawnNow ? [] : [behind];
};

export const theDesignPageDrawnFromOlderPosters = (
  posters: Readonly<Record<string, string>>
): readonly string[] =>
  designPageComplaints(
    fingerprintOf(inSlotNames(posters)),
    existsSync(DESIGN_PAGE_SYNC) ? read(DESIGN_PAGE_SYNC) : undefined
  );

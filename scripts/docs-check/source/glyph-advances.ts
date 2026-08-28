import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { read } from "../document-files.ts";
import { FIRST_GROUP } from "../markdown-text.ts";


const THE_TABLE = "src/shared/fonts/glyph-advances.ts";

const THE_ROSTER = "src/shared/fonts/font-files.ts";

const THE_GENERATOR = "node scripts/tools.ts advances";

const FONT_DIRECTORY = "assets/fonts";

const A_FINGERPRINT = /^export const FONT_FINGERPRINT = "([0-9a-f]{64})";$/m;

const A_FACE = /"([\w-]+\.ttf)"/g;

export const facesOf = (roster: string): readonly string[] =>
  [...roster.matchAll(A_FACE)].map((found) => found[FIRST_GROUP] ?? "");

export const fingerprintOf = (faces: readonly Buffer[]): string =>
  createHash("sha256")
    .update(faces.reduce((all, one) => Buffer.concat([all, one])))
    .digest("hex");

export const advanceComplaints = (recorded: string | null, drawn: string): readonly string[] => {
  if (recorded === null) {
    return [
      `${THE_TABLE}: no FONT_FINGERPRINT to check the shipped faces against — run ` +
        `"${THE_GENERATOR}", which writes both the table and the stamp`,
    ];
  }

  return recorded === drawn
    ? []
    : [
        `${THE_TABLE}: measured against faces that are not the ones in ${FONT_DIRECTORY}/ now, so ` +
          `every name is fitted to a width nothing draws — run "${THE_GENERATOR}" to measure ` +
          `the shipped faces again`,
      ];
};

export const recordedIn = (table: string): string | null =>
  A_FINGERPRINT.exec(table)?.[FIRST_GROUP] ?? null;

export const advancesOutOfStep = (): readonly string[] => {
  const faces = facesOf(read(THE_ROSTER));
  const drawn = fingerprintOf(faces.map((face) => readFileSync(`${FONT_DIRECTORY}/${face}`)));

  return advanceComplaints(recordedIn(read(THE_TABLE)), drawn);
};

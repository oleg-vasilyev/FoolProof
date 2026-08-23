import { existsSync, readdirSync } from "node:fs";
import { basename, join, normalize } from "node:path";
import { DESIGN_PAGE_SYNC, fingerprintOf } from "../design-page.ts";
import { MOCKUP_DIR, SITE_POSTER_DIR } from "../drawn-into.ts";
import { A_LINE, FIRST_GROUP, read } from "./the-documents.ts";
import {
  FEATURE_FOLDERS,
  SAMPLES_FOLDER,
  everyPoster,
  featureFolders,
  foldersNamed,
} from "./the-repository.ts";


const A_GALLERY_SOURCE = /^([a-z][a-z0-9-]*-edges)\.ts$/;

const AN_APPROVED_CASE_LIST = /^([a-z][a-z0-9-]*-edges)\.cases\.txt$/;

const A_CASE_NAME = /^([a-z][a-z0-9-]*) — \S/;

const A_TYPESCRIPT_FILE = /\.ts$/;

const A_SYNCED_FINGERPRINT = /^mockups: ([0-9a-f]{64})$/m;

const A_PATH_SEPARATOR = /[\\/]/;

const PAST_THE_FEATURES_FOLDER = 2;

const drawingsOutOfStep = (
  folder: string,
  drawings: Readonly<Record<string, string>>,
  tool: string
): readonly string[] =>
  Object.entries(drawings).flatMap(([name, svg]) => {
    const committed = `${folder}/${name}.svg`;

    if (!existsSync(committed)) {
      return [`${committed}: never drawn — run "node scripts/tools.ts ${tool}"`];
    }

    return read(committed) === svg
      ? []
      : [
          `${committed}: the renderer draws something else now — the ` +
            `"refresh-the-pictures" skill redraws this, and the Claude Design ` +
            `page then follows via "update-the-design-page"`,
        ];
  });

const A_DRAWN_FILE = /\.(svg|png|webp)$/;

const picturesNobodyDraws = (
  folder: string,
  drawings: Readonly<Record<string, string>>
): readonly string[] =>
  readdirSync(folder)
    .filter((name) => A_DRAWN_FILE.test(name))
    .filter((name) => !(name.replace(A_DRAWN_FILE, "") in drawings))
    .map(
      (name) =>
        `${folder}/${name}: no feature draws this any more — a picture left behind by ` +
        `a renderer that went away is one a document can still show, so delete it with ` +
        `whatever stopped drawing it`
    );

const aliasFor = (file: string): string =>
  `#${normalize(file).split(A_PATH_SEPARATOR).slice(PAST_THE_FEATURES_FOLDER).join("/")}`;

const gallerySources = (): readonly string[] =>
  foldersNamed(SAMPLES_FOLDER).flatMap((folder) =>
    readdirSync(folder)
      .filter((name) => A_GALLERY_SOURCE.test(name))
      .map((name) => join(folder, name))
  );

const drawingsEntries = (): readonly string[] =>
  featureFolders()
    .map((feature) => join(FEATURE_FOLDERS, feature, `${feature}-drawings.ts`))
    .filter((entry) => existsSync(entry));

const sourceNamed = (script: string): string | undefined =>
  gallerySources().find((source) => source.endsWith(script));

export const postersOutOfTheGallery = (): readonly string[] => {
  const drawn = gallerySources()
    .map((source) => read(source))
    .join("");
  const gathered = drawingsEntries().map(read).join("");

  return [
    ...everyPoster()
      .filter((poster) => !drawn.includes(aliasFor(poster)))
      .map(
        (poster) =>
          `${poster}: assembles a poster the gallery draws no case through, so the ` +
          `poster gate has nothing to say about it — give it cases in the feature's ` +
          `${SAMPLES_FOLDER}/ folder`
      ),
    ...gallerySources()
      .filter(
        (source) =>
          !`${gathered}${gallerySources()
            .filter((other) => other !== source)
            .map(read)
            .join("")}`.includes(aliasFor(source))
      )
      .map(
        (source) =>
          `${source}: holds gallery cases no feature's drawings module gathers, so ` +
          `nothing draws them — the cases and the rule that counts them would both ` +
          `stay green`
      ),
  ];
};

const approvedListsIn = (): readonly string[] =>
  readdirSync(MOCKUP_DIR).filter((name) => AN_APPROVED_CASE_LIST.test(name));

const scriptBehind = (list: string): string =>
  `${AN_APPROVED_CASE_LIST.exec(list)?.[FIRST_GROUP] ?? ""}.ts`;

const casesApprovedIn = (list: string): readonly string[] =>
  read(join(MOCKUP_DIR, list))
    .split(A_LINE)
    .map((line) => A_CASE_NAME.exec(line))
    .filter((named) => named !== null)
    .map((named) => named[FIRST_GROUP] ?? "");

const casesMissingFrom = (list: string): readonly string[] => {
  const script = scriptBehind(list);
  const source = sourceNamed(script);

  if (source === undefined) {
    return [
      `${MOCKUP_DIR}/${list}: names ${script}, which no feature holds — an approved ` +
        `list of edges that nothing was ever written to draw`,
    ];
  }

  const drawn = read(source);

  return casesApprovedIn(list)
    .filter((approved) => !drawn.includes(`name: "${approved}"`))
    .map(
      (approved) =>
        `${MOCKUP_DIR}/${list}: "${approved}" was approved on a contact sheet and ` +
        `${source} draws no case by that name — an edge the owner looked at is now ` +
        `drawn by nobody`
    );
};

export const casesOutOfStep = (): readonly string[] => {
  const lists = approvedListsIn();

  return [
    ...gallerySources()
      .filter((source) => !lists.some((list) => source.endsWith(scriptBehind(list))))
      .map(
        (source) =>
          `${source}: draws cases no approved list holds — put the edges the owner ` +
          `signed off into ${MOCKUP_DIR}/${basename(source).replace(A_TYPESCRIPT_FILE, "")}` +
          `.cases.txt, or the gallery is judged against nothing`
      ),
    ...lists.flatMap(casesMissingFrom),
  ];
};

export const mockupsOutOfStep = (mockups: Readonly<Record<string, string>>): readonly string[] => [
  ...drawingsOutOfStep(MOCKUP_DIR, mockups, "mockups"),
  ...picturesNobodyDraws(MOCKUP_DIR, mockups),
];

export const sitePostersOutOfStep = (
  sitePosters: Readonly<Record<string, string>>
): readonly string[] => [
  ...drawingsOutOfStep(SITE_POSTER_DIR, sitePosters, "site-posters"),
  ...picturesNobodyDraws(SITE_POSTER_DIR, sitePosters),
];

export const designPageOutOfStep = (
  mockups: Readonly<Record<string, string>>
): readonly string[] => {
  const behind =
    `${DESIGN_PAGE_SYNC}: the Claude Design page was last synced from different ` +
    `drawings than the code now produces — the "update-the-design-page" skill carries ` +
    `them back, and rewrites this file with the fingerprint it pushed`;

  if (!existsSync(DESIGN_PAGE_SYNC)) {
    return [behind];
  }

  return A_SYNCED_FINGERPRINT.exec(read(DESIGN_PAGE_SYNC))?.[FIRST_GROUP] === fingerprintOf(mockups)
    ? []
    : [behind];
};

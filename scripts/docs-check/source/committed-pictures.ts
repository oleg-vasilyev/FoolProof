import { existsSync, readdirSync } from "node:fs";
import { basename, join, normalize } from "node:path";
import { DESIGN_PAGE_SYNC, fingerprintOf } from "../../design-page.ts";
import { MOCKUP_DIR, SITE_POSTER_DIR } from "../../drawn-into.ts";
import { read } from "../document-files.ts";
import { A_LINE, FIRST_GROUP } from "../markdown-text.ts";
import {
  FEATURE_FOLDERS,
  SAMPLES_FOLDER,
  everyPoster,
  featureFolders,
  foldersNamed,
} from "../source-files.ts";


const A_GALLERY_SOURCE = /^([a-z][a-z0-9-]*-edges)\.ts$/;

const AN_APPROVED_CASE_LIST = /^([a-z][a-z0-9-]*-edges)\.cases\.txt$/;

const A_CASE_NAME = /^([a-z][a-z0-9-]*) — \S/;

const A_DRAWN_CASE = /name: "([^"]+)"/g;

const A_TYPESCRIPT_FILE = /\.ts$/;

const A_SYNCED_FINGERPRINT = /^mockups: ([0-9a-f]{64})$/m;

const A_PATH_SEPARATOR = /[\\/]/;

const A_DRAWN_FILE = /\.(svg|png|webp)$/;

const PAST_THE_FEATURES_FOLDER = 2;

const drawingsOutOfStepComplaints = (
  folder: string,
  drawings: Readonly<Record<string, string>>,
  tool: string,
  committed: Readonly<Record<string, string | undefined>>
): readonly string[] =>
  Object.entries(drawings).flatMap(([name, svg]) => {
    const committedPath = `${folder}/${name}.svg`;
    const onDisk = committed[name];

    if (onDisk === undefined) {
      return [`${committedPath}: never drawn — run "node scripts/tools.ts ${tool}"`];
    }

    return onDisk === svg
      ? []
      : [
          `${committedPath}: the renderer draws something else now — the ` +
            `"refresh-the-pictures" skill redraws this, and the Claude Design ` +
            `page then follows via "update-the-design-page"`,
        ];
  });

const picturesNobodyDrawsComplaints = (
  folder: string,
  drawings: Readonly<Record<string, string>>,
  filesOnDisk: readonly string[]
): readonly string[] =>
  filesOnDisk
    .filter((name) => A_DRAWN_FILE.test(name))
    .filter((name) => !(name.replace(A_DRAWN_FILE, "") in drawings))
    .map(
      (name) =>
        `${folder}/${name}: no feature draws this any more — a picture left behind by ` +
        `a renderer that went away is one a document can still show, so delete it with ` +
        `whatever stopped drawing it`
    );

const committedContentsOf = (
  folder: string,
  drawings: Readonly<Record<string, string>>
): Readonly<Record<string, string | undefined>> =>
  Object.fromEntries(
    Object.keys(drawings).map((name) => {
      const committedPath = `${folder}/${name}.svg`;

      return [name, existsSync(committedPath) ? read(committedPath) : undefined];
    })
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

const approvedListsIn = (): readonly string[] =>
  readdirSync(MOCKUP_DIR).filter((name) => AN_APPROVED_CASE_LIST.test(name));

const scriptBehind = (list: string): string =>
  `${AN_APPROVED_CASE_LIST.exec(list)?.[FIRST_GROUP] ?? ""}.ts`;

const casesApprovedIn = (text: string): readonly string[] =>
  text
    .split(A_LINE)
    .map((line) => A_CASE_NAME.exec(line))
    .filter((named) => named !== null)
    .map((named) => named[FIRST_GROUP] ?? "");

export const postersOutOfTheGalleryComplaints = (
  posters: readonly string[],
  sources: readonly string[],
  sourceContents: Readonly<Record<string, string>>,
  gathered: string
): readonly string[] => {
  const drawn = sources.map((source) => sourceContents[source] ?? "").join("");

  return [
    ...posters
      .filter((poster) => !drawn.includes(aliasFor(poster)))
      .map(
        (poster) =>
          `${poster}: assembles a poster the gallery draws no case through, so the ` +
          `poster gate has nothing to say about it — give it cases in the feature's ` +
          `${SAMPLES_FOLDER}/ folder`
      ),
    ...sources
      .filter(
        (source) =>
          !`${gathered}${sources
            .filter((other) => other !== source)
            .map((other) => sourceContents[other] ?? "")
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

export const postersOutOfTheGallery = (): readonly string[] =>
  postersOutOfTheGalleryComplaints(
    everyPoster(),
    gallerySources(),
    Object.fromEntries(gallerySources().map((source) => [source, read(source)])),
    drawingsEntries().map(read).join("")
  );

export const casesOutOfStepComplaints = (
  sources: readonly string[],
  lists: readonly string[],
  sourceContents: Readonly<Record<string, string>>,
  listContents: Readonly<Record<string, string>>
): readonly string[] => {
  const casesMissingFrom = (list: string): readonly string[] => {
    const script = scriptBehind(list);
    const source = sources.find((candidate) => candidate.endsWith(script));

    if (source === undefined) {
      return [
        `${MOCKUP_DIR}/${list}: names ${script}, which no feature holds — an approved ` +
          `list of edges that nothing was ever written to draw`,
      ];
    }

    const drawn = sourceContents[source] ?? "";
    const approved = casesApprovedIn(listContents[list] ?? "");

    return [
      ...approved
        .filter((one) => !drawn.includes(`name: "${one}"`))
        .map(
          (one) =>
            `${MOCKUP_DIR}/${list}: "${one}" was approved on a contact sheet and ` +
            `${source} draws no case by that name — an edge the owner looked at is now ` +
            `drawn by nobody`
        ),
      ...[...drawn.matchAll(A_DRAWN_CASE)]
        .map((found) => found[FIRST_GROUP] ?? "")
        .filter((one) => !approved.includes(one))
        .map(
          (one) =>
            `${source}: draws a case called "${one}" that ${MOCKUP_DIR}/${list} does not ` +
            `hold — the gallery is read against the owner's own list, so an edge appearing ` +
            `only in the code is one nobody agreed was worth drawing`
        ),
    ];
  };

  return [
    ...sources
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

export const casesOutOfStep = (): readonly string[] => {
  const sources = gallerySources();
  const lists = approvedListsIn();

  return casesOutOfStepComplaints(
    sources,
    lists,
    Object.fromEntries(sources.map((source) => [source, read(source)])),
    Object.fromEntries(lists.map((list) => [list, read(join(MOCKUP_DIR, list))]))
  );
};

export const mockupsOutOfStepComplaints = (
  mockups: Readonly<Record<string, string>>,
  committed: Readonly<Record<string, string | undefined>>,
  filesOnDisk: readonly string[]
): readonly string[] => [
  ...drawingsOutOfStepComplaints(MOCKUP_DIR, mockups, "mockups", committed),
  ...picturesNobodyDrawsComplaints(MOCKUP_DIR, mockups, filesOnDisk),
];

export const mockupsOutOfStep = (mockups: Readonly<Record<string, string>>): readonly string[] =>
  mockupsOutOfStepComplaints(
    mockups,
    committedContentsOf(MOCKUP_DIR, mockups),
    readdirSync(MOCKUP_DIR)
  );

export const sitePostersOutOfStepComplaints = (
  sitePosters: Readonly<Record<string, string>>,
  committed: Readonly<Record<string, string | undefined>>,
  filesOnDisk: readonly string[]
): readonly string[] => [
  ...drawingsOutOfStepComplaints(SITE_POSTER_DIR, sitePosters, "site-posters", committed),
  ...picturesNobodyDrawsComplaints(SITE_POSTER_DIR, sitePosters, filesOnDisk),
];

export const sitePostersOutOfStep = (
  sitePosters: Readonly<Record<string, string>>
): readonly string[] =>
  sitePostersOutOfStepComplaints(
    sitePosters,
    committedContentsOf(SITE_POSTER_DIR, sitePosters),
    readdirSync(SITE_POSTER_DIR)
  );

export const designPageOutOfStepComplaints = (
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

export const designPageOutOfStep = (
  mockups: Readonly<Record<string, string>>
): readonly string[] =>
  designPageOutOfStepComplaints(
    fingerprintOf(mockups),
    existsSync(DESIGN_PAGE_SYNC) ? read(DESIGN_PAGE_SYNC) : undefined
  );

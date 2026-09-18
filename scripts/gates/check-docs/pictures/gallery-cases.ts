import { existsSync, readdirSync } from "node:fs";
import { basename, join, normalize } from "node:path";
import { POSTER_DIR } from "../../../drawings/drawn-into.ts";
import { read } from "../shared/document-files.ts";
import { A_LINE, FIRST_GROUP } from "../shared/markdown-text.ts";
import {
  FEATURE_FOLDERS,
  SAMPLES_FOLDER,
  everyPoster,
  featureFolders,
  foldersNamed,
} from "../shared/source-files.ts";


const A_GALLERY_SOURCE = /^([a-z][a-z0-9-]*-edges)\.ts$/;

const AN_APPROVED_CASE_LIST = /^([a-z][a-z0-9-]*-edges)\.cases\.txt$/;

const A_CASE_NAME = /^([a-z][a-z0-9-]*) — \S/;

const A_DRAWN_CASE = /name: "([^"]+)"/g;

const A_TYPESCRIPT_FILE = /\.ts$/;

const A_PATH_SEPARATOR = /[\\/]/;

const PAST_THE_FEATURES_FOLDER = 2;

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
  readdirSync(POSTER_DIR).filter((name) => AN_APPROVED_CASE_LIST.test(name));

const scriptBehind = (list: string): string =>
  `${AN_APPROVED_CASE_LIST.exec(list)?.[FIRST_GROUP] ?? ""}.ts`;

const casesApprovedIn = (text: string): readonly string[] =>
  text
    .split(A_LINE)
    .map((line) => A_CASE_NAME.exec(line))
    .filter((named) => named !== null)
    .map((named) => named[FIRST_GROUP] ?? "");

export const galleryReachComplaints = (
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

export const postersNoGalleryCaseDraws = (): readonly string[] =>
  galleryReachComplaints(
    everyPoster(),
    gallerySources(),
    Object.fromEntries(gallerySources().map((source) => [source, read(source)])),
    drawingsEntries().map(read).join("")
  );

export const approvedCaseComplaints = (
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
        `${POSTER_DIR}/${list}: names ${script}, which no feature holds — an approved ` +
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
            `${POSTER_DIR}/${list}: "${one}" was approved on a contact sheet and ` +
            `${source} draws no case by that name — an edge the owner looked at is now ` +
            `drawn by nobody`
        ),
      ...[...drawn.matchAll(A_DRAWN_CASE)]
        .map((found) => found[FIRST_GROUP] ?? "")
        .filter((one) => !approved.includes(one))
        .map(
          (one) =>
            `${source}: draws a case called "${one}" that ${POSTER_DIR}/${list} does not ` +
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
          `signed off into ${POSTER_DIR}/${basename(source).replace(A_TYPESCRIPT_FILE, "")}` +
          `.cases.txt, or the gallery is judged against nothing`
      ),
    ...lists.flatMap(casesMissingFrom),
  ];
};

export const galleryCasesNobodyApproved = (): readonly string[] => {
  const sources = gallerySources();
  const lists = approvedListsIn();

  return approvedCaseComplaints(
    sources,
    lists,
    Object.fromEntries(sources.map((source) => [source, read(source)])),
    Object.fromEntries(lists.map((list) => [list, read(join(POSTER_DIR, list))]))
  );
};

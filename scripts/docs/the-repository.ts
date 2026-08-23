import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { read } from "./the-documents.ts";


export const FEATURE_FOLDERS = "src/features";

export const SAMPLES_FOLDER = "samples";

const RENDER_LAYER = "render";

const A_SPEC = /\.spec\.ts$/;

const A_STUB = /\.stub\.ts$/;

const A_TYPESCRIPT_FILE = /\.ts$/;

const ASSEMBLES_A_POSTER = "svgOf(";

export const featureFolders = (): readonly string[] =>
  readdirSync(FEATURE_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

export const filesIn = (folder: string): readonly string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesIn(join(folder, entry.name)) : [join(folder, entry.name)]
  );

export const sourceFilesIn = (folder: string): readonly string[] =>
  readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => A_TYPESCRIPT_FILE.test(name))
    .filter((name) => !A_SPEC.test(name) && !A_STUB.test(name));

export const foldersNamed = (folder: string): readonly string[] =>
  featureFolders()
    .map((feature) => join(FEATURE_FOLDERS, feature, folder))
    .filter((found) => existsSync(found));

export const everyPoster = (): readonly string[] =>
  foldersNamed(RENDER_LAYER)
    .flatMap(filesIn)
    .filter((file) => !A_SPEC.test(file))
    .filter((file) => read(file).includes(ASSEMBLES_A_POSTER));

export const packageScripts = (): ReadonlySet<string> =>
  new Set(Object.keys((JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts));

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { TREE_DOCUMENT, backtickedWordsOf, read } from "./the-documents.ts";
import {
  FEATURE_FOLDERS,
  featureFolders,
  packageScripts,
  sourceFilesIn,
} from "./the-repository.ts";


const ONE_COMMAND = 1;

const ROOMY_ENOUGH = 9;

const A_FEATURE_ENTRY_POINT = /-feature\.ts$/;

const A_DECLARED_COMMAND = /command: "/g;

export const featuresMissingFromTheTree = (): readonly string[] => {
  const tree = read(TREE_DOCUMENT);

  return featureFolders()
    .filter((feature) => !tree.includes(`${feature}/`))
    .map((feature) => `${TREE_DOCUMENT}: does not mention ${FEATURE_FOLDERS}/${feature}/`);
};

export const scriptsOutOfStep = (): readonly string[] => {
  const documented = backtickedWordsOf(read(TREE_DOCUMENT));

  return [...packageScripts()]
    .filter((name) => !documented.has(name))
    .map((name) => `${TREE_DOCUMENT}: does not list the "${name}" script`);
};

const commandsDeclaredBy = (feature: string): number =>
  readdirSync(join(FEATURE_FOLDERS, feature))
    .filter((name) => A_FEATURE_ENTRY_POINT.test(name))
    .flatMap(
      (name) => read(join(FEATURE_FOLDERS, feature, name)).match(A_DECLARED_COMMAND) ?? []
    ).length;

export const crowdedLayers = (): readonly string[] =>
  featureFolders()
    .filter((feature) => commandsDeclaredBy(feature) > ONE_COMMAND)
    .flatMap((feature) =>
      readdirSync(join(FEATURE_FOLDERS, feature), { withFileTypes: true })
        .filter((layer) => layer.isDirectory())
        .flatMap((layer) => {
          const folder = join(FEATURE_FOLDERS, feature, layer.name);
          const files = sourceFilesIn(folder).length;

          return files <= ROOMY_ENOUGH
            ? []
            : [
                `${folder}: ${String(files)} files at one level in a feature that gives the player more than one thing — name the sub-features as folders rather than raising the number`,
              ];
        })
    );

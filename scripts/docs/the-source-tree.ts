import { readdirSync } from "node:fs";
import { join } from "node:path";
import { backtickedWordsOf } from "./a-markdown-document.ts";
import { SESSION_DOCUMENT, TREE_DOCUMENT, read } from "./the-documents.ts";
import {
  FEATURE_FOLDERS,
  featureFolders,
  packageScripts,
  sourceFilesIn,
} from "./the-repository.ts";


const NOTHING = 0;

const ONE_COMMAND = 1;

const ROOMY_ENOUGH = 9;

const A_FEATURE_ENTRY_POINT = /-feature\.ts$/;

const A_DECLARED_COMMAND = /command: "/g;

const SHARED_FOLDERS = "src/shared";

const DRAWS_THE_TREE = [TREE_DOCUMENT, SESSION_DOCUMENT];

const sharedFolders = (): readonly string[] =>
  readdirSync(SHARED_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

export const isAFeatureEntryPoint = (name: string): boolean => A_FEATURE_ENTRY_POINT.test(name);

export const commandsDeclaredIn = (sources: readonly string[]): number =>
  sources.flatMap((source) => source.match(A_DECLARED_COMMAND) ?? []).length;

const commandsDeclaredBy = (feature: string): number =>
  commandsDeclaredIn(
    readdirSync(join(FEATURE_FOLDERS, feature))
      .filter(isAFeatureEntryPoint)
      .map((name) => read(join(FEATURE_FOLDERS, feature, name)))
  );

export const foldersMissingFromTheTreeComplaints = (
  documents: readonly string[],
  documentContents: Readonly<Record<string, string>>,
  features: readonly string[],
  shared: readonly string[]
): readonly string[] =>
  documents.flatMap((document) => {
    const tree = documentContents[document] ?? "";

    return [
      ...features
        .filter((feature) => !tree.includes(`${feature}/`))
        .map((feature) => `${document}: does not mention ${FEATURE_FOLDERS}/${feature}/`),
      ...shared
        .filter((folder) => !tree.includes(`${folder}/`))
        .map(
          (folder) =>
            `${document}: does not mention ${SHARED_FOLDERS}/${folder}/ — the tree is the ` +
            `only place a reader learns what is down there, and a folder missing from it ` +
            `is one the next person invents a second time`
        ),
    ];
  });

export const foldersMissingFromTheTree = (): readonly string[] =>
  foldersMissingFromTheTreeComplaints(
    DRAWS_THE_TREE,
    Object.fromEntries(DRAWS_THE_TREE.map((document) => [document, read(document)])),
    featureFolders(),
    sharedFolders()
  );

export const scriptsOutOfStepComplaints = (
  documented: ReadonlySet<string>,
  scripts: ReadonlySet<string>
): readonly string[] =>
  [...scripts]
    .filter((name) => !documented.has(name))
    .map((name) => `${TREE_DOCUMENT}: does not list the "${name}" script`);

export const scriptsOutOfStep = (): readonly string[] =>
  scriptsOutOfStepComplaints(backtickedWordsOf(read(TREE_DOCUMENT)), packageScripts());

export const crowdedLayersComplaints = (
  features: readonly string[],
  commandCounts: Readonly<Record<string, number>>,
  layersByFeature: Readonly<Record<string, readonly string[]>>,
  fileCounts: Readonly<Record<string, number>>
): readonly string[] =>
  features
    .filter((feature) => (commandCounts[feature] ?? NOTHING) > ONE_COMMAND)
    .flatMap((feature) =>
      (layersByFeature[feature] ?? []).flatMap((layer) => {
        const folder = join(FEATURE_FOLDERS, feature, layer);
        const files = fileCounts[folder] ?? NOTHING;

        return files <= ROOMY_ENOUGH
          ? []
          : [
              `${folder}: ${String(files)} files at one level in a feature that gives the player more than one thing — name the sub-features as folders rather than raising the number`,
            ];
      })
    );

const layersOf = (feature: string): readonly string[] =>
  readdirSync(join(FEATURE_FOLDERS, feature), { withFileTypes: true })
    .filter((layer) => layer.isDirectory())
    .map((layer) => layer.name);

const filesInEachLayer = (
  layersByFeature: Readonly<Record<string, readonly string[]>>
): Readonly<Record<string, number>> =>
  Object.fromEntries(
    Object.entries(layersByFeature).flatMap(([feature, layers]) =>
      layers.map((layer) => {
        const folder = join(FEATURE_FOLDERS, feature, layer);

        return [folder, sourceFilesIn(folder).length];
      })
    )
  );

export const crowdedLayers = (): readonly string[] => {
  const features = featureFolders();
  const layersByFeature = Object.fromEntries(features.map((feature) => [feature, layersOf(feature)]));

  return crowdedLayersComplaints(
    features,
    Object.fromEntries(features.map((feature) => [feature, commandsDeclaredBy(feature)])),
    layersByFeature,
    filesInEachLayer(layersByFeature)
  );
};

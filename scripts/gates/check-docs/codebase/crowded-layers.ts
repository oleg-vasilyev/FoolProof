import { readdirSync } from "node:fs";
import { join } from "node:path";
import { read } from "../shared/document-files.ts";
import { FEATURE_FOLDERS, featureFolders, sourceFilesIn } from "../shared/source-files.ts";


const NOTHING = 0;

const ONE_COMMAND = 1;

const ROOMY_ENOUGH = 9;

const A_FEATURE_ENTRY_POINT = /-feature\.ts$/;

const A_DECLARED_COMMAND = /command: "/g;

export const isAFeatureEntryPoint = (name: string): boolean => A_FEATURE_ENTRY_POINT.test(name);

export const commandsDeclaredIn = (sources: readonly string[]): number =>
  sources.flatMap((source) => source.match(A_DECLARED_COMMAND) ?? []).length;

const commandsDeclaredBy = (feature: string): number =>
  commandsDeclaredIn(
    readdirSync(join(FEATURE_FOLDERS, feature))
      .filter(isAFeatureEntryPoint)
      .map((name) => read(join(FEATURE_FOLDERS, feature, name)))
  );

export const crowdedLayerComplaints = (
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

export const layersWithMoreFilesThanTheRuleAllows = (): readonly string[] => {
  const features = featureFolders();
  const layersByFeature = Object.fromEntries(features.map((feature) => [feature, layersOf(feature)]));

  return crowdedLayerComplaints(
    features,
    Object.fromEntries(features.map((feature) => [feature, commandsDeclaredBy(feature)])),
    layersByFeature,
    filesInEachLayer(layersByFeature)
  );
};

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Drawing, FeatureDrawings } from "#shared/drawings/drawings-contract.ts";


const FEATURE_FOLDERS = "src/features";

const featureFolders = (): readonly string[] =>
  readdirSync(FEATURE_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const drawingsOf = async (feature: string): Promise<FeatureDrawings | null> => {
  const file = join(FEATURE_FOLDERS, feature, `${feature}-drawings.ts`);

  if (!existsSync(file)) {
    return null;
  }

  const loaded = (await import(`#${feature}/${feature}-drawings.ts`)) as {
    drawings?: FeatureDrawings;
  };

  if (loaded.drawings === undefined) {
    throw new Error(
      `${file}: exports no "drawings" — a feature offers its pictures and its tools ` +
        `under that name, and a module nobody can read from is one whose posters ` +
        `silently stop being checked`
    );
  }

  return loaded.drawings;
};

export const featuresThatDraw = async (): Promise<readonly FeatureDrawings[]> => {
  const found = await Promise.all(featureFolders().map(drawingsOf));

  return found.filter((drawings): drawings is FeatureDrawings => drawings !== null);
};

export const everyDrawing = async (
  asked: (drawings: FeatureDrawings) => readonly Drawing[]
): Promise<readonly Drawing[]> => (await featuresThatDraw()).flatMap(asked);

export const drawnByName = async (
  asked: (drawings: FeatureDrawings) => readonly Drawing[]
): Promise<Readonly<Record<string, string>>> =>
  Object.fromEntries((await everyDrawing(asked)).map((drawing) => [drawing.file, drawing.svg]));

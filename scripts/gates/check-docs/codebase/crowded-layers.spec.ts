import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";


const readdirSyncSpy = vi.fn();

const readSpy = vi.fn();

const featureFoldersSpy = vi.fn();

const sourceFilesInSpy = vi.fn();

vi.mock("node:fs", () => ({
  readdirSync: (folder: string, options: unknown) => readdirSyncSpy(folder, options),
}));

vi.mock("../shared/document-files.ts", () => ({
  read: (file: string) => readSpy(file),
}));

vi.mock("../shared/source-files.ts", () => ({
  FEATURE_FOLDERS: "src/features",
  featureFolders: () => featureFoldersSpy(),
  sourceFilesIn: (folder: string) => sourceFilesInSpy(folder),
}));

const {
  commandsDeclaredIn,
  crowdedLayerComplaints,
  isAFeatureEntryPoint,
  layersWithMoreFilesThanTheRuleAllows,
} = await import("./crowded-layers.ts");


const FIRST = 0;

const ONE_COMPLAINT = 1;

const NOTHING_DECLARED = 0;

const ONE_COMMAND = 1;

const TWO_COMMANDS = 2;

const AT_THE_LIMIT = 9;

const OVER_THE_LIMIT = 10;

const PLENTY_OF_FILES = 50;

const FEATURES_ROOT = "src/features";

const layerPath = (feature: string, layer: string): string => join(FEATURES_ROOT, feature, layer);

describe("crowdedLayerComplaints", () => {
  it("should leave a single-command feature alone no matter how many files a layer holds", () => {
    const complaints = crowdedLayerComplaints(
      ["diagnostics"],
      { diagnostics: ONE_COMMAND },
      { diagnostics: ["render"] },
      { [layerPath("diagnostics", "render")]: PLENTY_OF_FILES }
    );

    expect(complaints).toEqual([]);
  });

  it("should say nothing right at the roomy boundary of nine files", () => {
    const complaints = crowdedLayerComplaints(
      ["live-game"],
      { "live-game": TWO_COMMANDS },
      { "live-game": ["render"] },
      { [layerPath("live-game", "render")]: AT_THE_LIMIT }
    );

    expect(complaints).toEqual([]);
  });

  it("should complain the moment a layer crosses nine files, and say why", () => {
    const complaints = crowdedLayerComplaints(
      ["live-game"],
      { "live-game": TWO_COMMANDS },
      { "live-game": ["render"] },
      { [layerPath("live-game", "render")]: OVER_THE_LIMIT }
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(layerPath("live-game", "render"));
    expect(complaints[FIRST]).toContain(`${String(OVER_THE_LIMIT)} files at one level`);
    expect(complaints[FIRST]).toContain("name the sub-features as folders rather than raising the number");
  });

  it("should treat a feature missing from the command count as declaring none, and stay quiet", () => {
    const complaints = crowdedLayerComplaints(
      ["live-game"],
      {},
      { "live-game": ["render"] },
      { [layerPath("live-game", "render")]: PLENTY_OF_FILES }
    );

    expect(complaints).toEqual([]);
  });

  it("should treat a feature missing from the layer table as having none, rather than throw", () => {
    expect(crowdedLayerComplaints(["live-game"], { "live-game": TWO_COMMANDS }, {}, {})).toEqual([]);
  });

  it("should count a second layer on its own, so one roomy layer does not hide a crowded one", () => {
    const complaints = crowdedLayerComplaints(
      ["live-game"],
      { "live-game": TWO_COMMANDS },
      { "live-game": ["render", "bot"] },
      {
        [layerPath("live-game", "render")]: AT_THE_LIMIT,
        [layerPath("live-game", "bot")]: OVER_THE_LIMIT,
      }
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(layerPath("live-game", "bot"));
  });
});

describe("isAFeatureEntryPoint", () => {
  it("should know the file a feature declares its commands in", () => {
    expect(isAFeatureEntryPoint("scoresheet-feature.ts")).toBe(true);
  });

  it("should not take the spec beside it for the entry point", () => {
    expect(isAFeatureEntryPoint("scoresheet-feature.spec.ts")).toBe(false);
  });

  it("should not take a file that merely mentions the word", () => {
    expect(isAFeatureEntryPoint("feature-installer.ts")).toBe(false);
  });

  it("should need the hyphen, so a file called feature.ts is not one", () => {
    expect(isAFeatureEntryPoint("feature.ts")).toBe(false);
  });
});

describe("commandsDeclaredIn", () => {
  it("should count every command an entry point declares", () => {
    const source = 'commands: [{ command: "stats" }, { command: "personal" }]';

    expect(commandsDeclaredIn([source])).toBe(TWO_COMMANDS);
  });

  it("should add up what two entry points declare between them", () => {
    expect(commandsDeclaredIn(['command: "one"', 'command: "two"'])).toBe(TWO_COMMANDS);
  });

  it("should not count a mention of the word without its colon and quote", () => {
    expect(commandsDeclaredIn(["the command is a string"])).toBe(NOTHING_DECLARED);
  });

  it("should count nothing in a feature that declares nothing", () => {
    expect(commandsDeclaredIn([])).toBe(NOTHING_DECLARED);
  });
});

describe("layersWithMoreFilesThanTheRuleAllows", () => {
  const aFolder = (name: string) => ({ name, isDirectory: () => true });

  const walking = (dirents: readonly unknown[], names: readonly string[]) => {
    readdirSyncSpy.mockImplementation((_folder: string, options: unknown) =>
      options === undefined ? names : dirents
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    readdirSyncSpy.mockReturnValue([]);
    readSpy.mockReturnValue("");
    featureFoldersSpy.mockReturnValue([]);
    sourceFilesInSpy.mockReturnValue([]);
  });

  it("should count a layer's files through the repository, at the folder it names", () => {
    featureFoldersSpy.mockReturnValue(["live-game"]);
    walking([aFolder("bot")], ["live-game-feature.ts"]);
    readSpy.mockReturnValue('command: "one" command: "two"');
    sourceFilesInSpy.mockReturnValue(new Array<string>(OVER_THE_LIMIT).fill("a.ts"));

    const said = layersWithMoreFilesThanTheRuleAllows();

    expect(sourceFilesInSpy).toHaveBeenCalledWith(join(FEATURES_ROOT, "live-game", "bot"));
    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("10 files at one level");
  });

  it("should say nothing about a feature that gives the player only one thing", () => {
    featureFoldersSpy.mockReturnValue(["merge-names"]);
    walking([aFolder("bot")], ["merge-names-feature.ts"]);
    readSpy.mockReturnValue('command: "one"');
    sourceFilesInSpy.mockReturnValue(new Array<string>(OVER_THE_LIMIT).fill("a.ts"));

    expect(layersWithMoreFilesThanTheRuleAllows()).toEqual([]);
  });

  it("should read a feature's commands only out of its entry point", () => {
    featureFoldersSpy.mockReturnValue(["live-game"]);
    walking([], ["live-game-feature.ts", "card-service.ts"]);
    readSpy.mockReturnValue('command: "one" command: "two"');
    sourceFilesInSpy.mockReturnValue([]);

    layersWithMoreFilesThanTheRuleAllows();

    expect(readSpy).toHaveBeenCalledWith(join(FEATURES_ROOT, "live-game", "live-game-feature.ts"));
    expect(readSpy).not.toHaveBeenCalledWith(join(FEATURES_ROOT, "live-game", "card-service.ts"));
  });
});

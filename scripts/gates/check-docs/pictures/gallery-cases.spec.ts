import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";


const readdirSyncSpy = vi.fn();

const existsSyncSpy = vi.fn();

const readSpy = vi.fn();

const everyPosterSpy = vi.fn();

const featureFoldersSpy = vi.fn();

const foldersNamedSpy = vi.fn();

vi.mock("node:fs", () => ({
  readdirSync: (folder: string) => readdirSyncSpy(folder),
  existsSync: (file: string) => existsSyncSpy(file),
}));

vi.mock("../shared/document-files.ts", () => ({
  read: (file: string) => readSpy(file),
}));

vi.mock("../shared/source-files.ts", () => ({
  FEATURE_FOLDERS: "src/features",
  SAMPLES_FOLDER: "samples",
  everyPoster: () => everyPosterSpy(),
  featureFolders: () => featureFoldersSpy(),
  foldersNamed: (folder: string) => foldersNamedSpy(folder),
}));

const {
  approvedCaseComplaints,
  galleryCasesNobodyApproved,
  galleryReachComplaints,
  postersNoGalleryCaseDraws,
} = await import("./gallery-cases.ts");


const FIRST = 0;

const NOTHING = 0;

const ONE_COMPLAINT = 1;

describe("galleryReachComplaints", () => {
  const POSTER = "src/features/live-game/render/card-message.ts";
  const SOURCE = "src/features/live-game/samples/live-game-edges.ts";
  const OTHER_SOURCE = "src/features/scoresheet/samples/scoresheet-edges.ts";
  const POSTER_ALIAS = "#live-game/render/card-message.ts";
  const SOURCE_ALIAS = "#live-game/samples/live-game-edges.ts";

  it("should say nothing when a gallery source draws the poster's alias", () => {
    const complaints = galleryReachComplaints(
      [POSTER],
      [SOURCE],
      { [SOURCE]: `svgOf(${POSTER_ALIAS})` },
      SOURCE_ALIAS
    );

    expect(complaints).toEqual([]);
  });

  it("should name a poster no gallery source draws a case through", () => {
    const complaints = galleryReachComplaints(
      [POSTER],
      [SOURCE],
      { [SOURCE]: "nothing about it here" },
      SOURCE_ALIAS
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(POSTER);
    expect(complaints[FIRST]).toContain("the poster gate has nothing to say about it");
    expect(complaints[FIRST]).toContain("samples/ folder");
  });

  it("should say nothing when the drawings module gathers a gallery source's own alias", () => {
    const complaints = galleryReachComplaints([], [SOURCE], { [SOURCE]: "" }, `import "${SOURCE_ALIAS}"`);

    expect(complaints).toEqual([]);
  });

  it("should count a sibling source's mention as covering it, even though the drawings module does not", () => {
    const complaints = galleryReachComplaints(
      [],
      [SOURCE, OTHER_SOURCE],
      { [SOURCE]: "", [OTHER_SOURCE]: `see also ${SOURCE_ALIAS}` },
      ""
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(OTHER_SOURCE);
  });

  it("should name a gallery source that gathers nowhere at all", () => {
    const complaints = galleryReachComplaints([], [SOURCE], { [SOURCE]: "" }, "");

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(SOURCE);
    expect(complaints[FIRST]).toContain("nothing draws them");
    expect(complaints[FIRST]).toContain("the rule that counts them would both");
  });

  it("should not let a source's own mention of its own alias satisfy the check", () => {
    const complaints = galleryReachComplaints([], [SOURCE], { [SOURCE]: `name: "${SOURCE_ALIAS}"` }, "");

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(SOURCE);
  });
});

describe("approvedCaseComplaints", () => {
  const LIST = "live-game-edges.cases.txt";
  const SCRIPT_SOURCE = "src/features/live-game/samples/live-game-edges.ts";

  it("should say nothing when the approved list and the drawn cases agree", () => {
    const complaints = approvedCaseComplaints(
      [SCRIPT_SOURCE],
      [LIST],
      { [SCRIPT_SOURCE]: 'name: "seat-ten"' },
      { [LIST]: "seat-ten — ten players sit down" }
    );

    expect(complaints).toEqual([]);
  });

  it("should name an approved case the source draws under no name at all", () => {
    const complaints = approvedCaseComplaints(
      [SCRIPT_SOURCE],
      [LIST],
      { [SCRIPT_SOURCE]: "nothing drawn here" },
      { [LIST]: "seat-ten — ten players sit down" }
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"seat-ten"');
    expect(complaints[FIRST]).toContain("was approved on a contact sheet");
    expect(complaints[FIRST]).toContain("drawn by nobody");
  });

  it("should name a case the source draws that the approved list never held", () => {
    const complaints = approvedCaseComplaints(
      [SCRIPT_SOURCE],
      [LIST],
      { [SCRIPT_SOURCE]: 'name: "ghost-case"' },
      { [LIST]: "" }
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"ghost-case"');
    expect(complaints[FIRST]).toContain("does not hold");
    expect(complaints[FIRST]).toContain("nobody agreed was worth drawing");
  });

  it("should name a gallery source no approved list covers", () => {
    const complaints = approvedCaseComplaints([SCRIPT_SOURCE], [], {}, {});

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(SCRIPT_SOURCE);
    expect(complaints[FIRST]).toContain("docs/posters/live-game-edges.cases.txt");
    expect(complaints[FIRST]).toContain("judged against nothing");
  });

  it("should name an approved list whose script no feature holds", () => {
    const complaints = approvedCaseComplaints([], [LIST], {}, { [LIST]: "" });

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("docs/posters/live-game-edges.cases.txt");
    expect(complaints[FIRST]).toContain("live-game-edges.ts");
    expect(complaints[FIRST]).toContain("nothing was ever written to draw");
  });

  it("should not read a case name from a line with no description after the dash", () => {
    const complaints = approvedCaseComplaints(
      [SCRIPT_SOURCE],
      [LIST],
      { [SCRIPT_SOURCE]: "" },
      { [LIST]: "seat-ten — " }
    );

    expect(complaints).toEqual([]);
  });
});

describe("the readers, against a repository that is not there", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readdirSyncSpy.mockReturnValue([]);
    existsSyncSpy.mockReturnValue(false);
    readSpy.mockReturnValue("");
    everyPosterSpy.mockReturnValue([]);
    featureFoldersSpy.mockReturnValue([]);
    foldersNamedSpy.mockReturnValue([]);
  });

  it("should read each gallery source once and hand its text to the reasoning", () => {
    everyPosterSpy.mockReturnValue(["src/features/scoresheet/render/awards-svg.ts"]);
    foldersNamedSpy.mockReturnValue(["src/features/scoresheet/samples"]);
    readdirSyncSpy.mockReturnValue(["gallery-edges.ts"]);
    readSpy.mockReturnValue("renderAwards(copy)");

    postersNoGalleryCaseDraws();

    expect(foldersNamedSpy).toHaveBeenCalledWith("samples");
    expect(readSpy).toHaveBeenCalledWith(join("src/features/scoresheet/samples", "gallery-edges.ts"));
  });

  it("should complain about a poster no gallery source ever draws", () => {
    everyPosterSpy.mockReturnValue(["src/features/scoresheet/render/personal-svg.ts"]);
    foldersNamedSpy.mockReturnValue(["src/features/scoresheet/samples"]);
    readdirSyncSpy.mockReturnValue(["gallery-edges.ts"]);
    readSpy.mockReturnValue("nothing that draws it");

    expect(postersNoGalleryCaseDraws().length).toBeGreaterThan(NOTHING);
  });

  it("should take the approved lists off the posters folder rather than a list in code", () => {
    readdirSyncSpy.mockReturnValue(["gallery-edges.cases.txt", "a-poster.svg"]);
    foldersNamedSpy.mockReturnValue(["src/features/scoresheet/samples"]);
    readSpy.mockReturnValue("");

    galleryCasesNobodyApproved();

    expect(readdirSyncSpy).toHaveBeenCalledWith("docs/posters");
    expect(readSpy).toHaveBeenCalledWith(join("docs/posters", "gallery-edges.cases.txt"));
    expect(readSpy).not.toHaveBeenCalledWith(join("docs/posters", "a-poster.svg"));
  });
});

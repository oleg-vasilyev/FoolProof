import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DESIGN_PAGE_SYNC } from "../../design-page.ts";


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

vi.mock("../document-files.ts", () => ({
  read: (file: string) => readSpy(file),
}));

vi.mock("../source-files.ts", () => ({
  FEATURE_FOLDERS: "src/features",
  SAMPLES_FOLDER: "samples",
  everyPoster: () => everyPosterSpy(),
  featureFolders: () => featureFoldersSpy(),
  foldersNamed: (folder: string) => foldersNamedSpy(folder),
}));

const {
  casesOutOfStep,
  casesOutOfStepComplaints,
  designPageOutOfStep,
  designPageOutOfStepComplaints,
  mockupsOutOfStep,
  mockupsOutOfStepComplaints,
  postersOutOfTheGallery,
  postersOutOfTheGalleryComplaints,
  sitePostersOutOfStep,
  sitePostersOutOfStepComplaints,
} = await import("./committed-pictures.ts");


const FIRST = 0;

const NOTHING = 0;

const ONE_COMPLAINT = 1;

const SHA256_HEX_LENGTH = 64;


describe("postersOutOfTheGalleryComplaints", () => {
  const POSTER = "src/features/live-game/render/card-message.ts";
  const SOURCE = "src/features/live-game/samples/live-game-edges.ts";
  const OTHER_SOURCE = "src/features/scoresheet/samples/scoresheet-edges.ts";
  const POSTER_ALIAS = "#live-game/render/card-message.ts";
  const SOURCE_ALIAS = "#live-game/samples/live-game-edges.ts";

  it("should say nothing when a gallery source draws the poster's alias", () => {
    const complaints = postersOutOfTheGalleryComplaints(
      [POSTER],
      [SOURCE],
      { [SOURCE]: `svgOf(${POSTER_ALIAS})` },
      SOURCE_ALIAS
    );

    expect(complaints).toEqual([]);
  });

  it("should name a poster no gallery source draws a case through", () => {
    const complaints = postersOutOfTheGalleryComplaints(
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
    const complaints = postersOutOfTheGalleryComplaints(
      [],
      [SOURCE],
      { [SOURCE]: "" },
      `import "${SOURCE_ALIAS}"`
    );

    expect(complaints).toEqual([]);
  });

  it("should count a sibling source's mention as covering it, even though the drawings module does not", () => {
    const complaints = postersOutOfTheGalleryComplaints(
      [],
      [SOURCE, OTHER_SOURCE],
      { [SOURCE]: "", [OTHER_SOURCE]: `see also ${SOURCE_ALIAS}` },
      ""
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(OTHER_SOURCE);
  });

  it("should name a gallery source that gathers nowhere at all", () => {
    const complaints = postersOutOfTheGalleryComplaints([], [SOURCE], { [SOURCE]: "" }, "");

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(SOURCE);
    expect(complaints[FIRST]).toContain("nothing draws them");
    expect(complaints[FIRST]).toContain("the rule that counts them would both");
  });

  it("should not let a source's own mention of its own alias satisfy the check", () => {
    const complaints = postersOutOfTheGalleryComplaints(
      [],
      [SOURCE],
      { [SOURCE]: `name: "${SOURCE_ALIAS}"` },
      ""
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(SOURCE);
  });
});

describe("casesOutOfStepComplaints", () => {
  const LIST = "live-game-edges.cases.txt";
  const SCRIPT_SOURCE = "src/features/live-game/samples/live-game-edges.ts";

  it("should say nothing when the approved list and the drawn cases agree", () => {
    const complaints = casesOutOfStepComplaints(
      [SCRIPT_SOURCE],
      [LIST],
      { [SCRIPT_SOURCE]: 'name: "seat-ten"' },
      { [LIST]: "seat-ten — ten players sit down" }
    );

    expect(complaints).toEqual([]);
  });

  it("should name an approved case the source draws under no name at all", () => {
    const complaints = casesOutOfStepComplaints(
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
    const complaints = casesOutOfStepComplaints(
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
    const complaints = casesOutOfStepComplaints([SCRIPT_SOURCE], [], {}, {});

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(SCRIPT_SOURCE);
    expect(complaints[FIRST]).toContain("docs/mockups/live-game-edges.cases.txt");
    expect(complaints[FIRST]).toContain("judged against nothing");
  });

  it("should name an approved list whose script no feature holds", () => {
    const complaints = casesOutOfStepComplaints([], [LIST], {}, { [LIST]: "" });

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("docs/mockups/live-game-edges.cases.txt");
    expect(complaints[FIRST]).toContain("live-game-edges.ts");
    expect(complaints[FIRST]).toContain("nothing was ever written to draw");
  });

  it("should not read a case name from a line with no description after the dash", () => {
    const complaints = casesOutOfStepComplaints(
      [SCRIPT_SOURCE],
      [LIST],
      { [SCRIPT_SOURCE]: "" },
      { [LIST]: "seat-ten — " }
    );

    expect(complaints).toEqual([]);
  });
});

describe("mockupsOutOfStepComplaints", () => {
  const CARD = "card";
  const SVG = "<svg>card</svg>";

  it("should say nothing when the committed picture matches what the code draws now", () => {
    const complaints = mockupsOutOfStepComplaints({ [CARD]: SVG }, { [CARD]: SVG }, [`${CARD}.svg`]);

    expect(complaints).toEqual([]);
  });

  it("should say a picture was never drawn when nothing is committed for it", () => {
    const complaints = mockupsOutOfStepComplaints({ [CARD]: SVG }, { [CARD]: undefined }, []);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(`docs/mockups/${CARD}.svg`);
    expect(complaints[FIRST]).toContain("never drawn");
    expect(complaints[FIRST]).toContain('node scripts/tools.ts mockups');
  });

  it("should say the renderer draws something else now when the committed picture differs", () => {
    const complaints = mockupsOutOfStepComplaints(
      { [CARD]: SVG },
      { [CARD]: "<svg>different</svg>" },
      [`${CARD}.svg`]
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(`docs/mockups/${CARD}.svg`);
    expect(complaints[FIRST]).toContain('"refresh-the-pictures" skill redraws this');
    expect(complaints[FIRST]).toContain('"update-the-design-page"');
  });

  it("should name a committed picture no feature draws any more", () => {
    const complaints = mockupsOutOfStepComplaints({}, {}, ["ghost.svg"]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("docs/mockups/ghost.svg");
    expect(complaints[FIRST]).toContain("no feature draws this any more");
    expect(complaints[FIRST]).toContain("delete it with whatever stopped drawing it");
  });

  it("should ignore a file on disk that is not a picture at all", () => {
    expect(mockupsOutOfStepComplaints({}, {}, ["notes.txt"])).toEqual([]);
  });

  it("should not call a picture orphaned when a feature still draws it under that name", () => {
    const complaints = mockupsOutOfStepComplaints({ [CARD]: SVG }, { [CARD]: SVG }, [`${CARD}.svg`]);

    expect(complaints).toEqual([]);
  });
});

describe("sitePostersOutOfStepComplaints", () => {
  const CARD = "card";
  const SVG = "<svg>card</svg>";

  it("should say nothing when the committed poster matches what the site draws now", () => {
    const complaints = sitePostersOutOfStepComplaints({ [CARD]: SVG }, { [CARD]: SVG }, [
      `${CARD}.svg`,
    ]);

    expect(complaints).toEqual([]);
  });

  it("should point the tool name at site-posters, not at mockups", () => {
    const complaints = sitePostersOutOfStepComplaints({ [CARD]: SVG }, { [CARD]: undefined }, []);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(`docs/posters/${CARD}.svg`);
    expect(complaints[FIRST]).toContain("node scripts/tools.ts site-posters");
  });

  it("should name an orphaned site poster under docs/posters, not docs/mockups", () => {
    const complaints = sitePostersOutOfStepComplaints({}, {}, ["ghost.svg"]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("docs/posters/ghost.svg");
  });
});

describe("designPageOutOfStepComplaints", () => {
  const DRAWN_NOW = "a".repeat(SHA256_HEX_LENGTH);

  const SOMETHING_ELSE = "b".repeat(SHA256_HEX_LENGTH);

  it("should say the page is behind when nothing has been synced yet", () => {
    const complaints = designPageOutOfStepComplaints(DRAWN_NOW, undefined);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(DESIGN_PAGE_SYNC);
    expect(complaints[FIRST]).toContain('"update-the-design-page" skill');
    expect(complaints[FIRST]).toContain("last synced from different");
    expect(complaints[FIRST]).toContain("rewrites this file with the fingerprint it pushed");
  });

  it("should say nothing when the synced fingerprint matches what the mockups hash to now", () => {
    expect(designPageOutOfStepComplaints(DRAWN_NOW, `mockups: ${DRAWN_NOW}`)).toEqual([]);
  });

  it("should say the page is behind when the synced fingerprint no longer matches", () => {
    const complaints = designPageOutOfStepComplaints(SOMETHING_ELSE, `mockups: ${DRAWN_NOW}`);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"update-the-design-page" skill');
  });

  it("should not read a fingerprint that is not written on its own labeled line", () => {
    const wrongShape = `not the right shape: ${DRAWN_NOW}`;

    expect(designPageOutOfStepComplaints(DRAWN_NOW, wrongShape)).toHaveLength(ONE_COMPLAINT);
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

    postersOutOfTheGallery();

    expect(foldersNamedSpy).toHaveBeenCalledWith("samples");
    expect(readSpy).toHaveBeenCalledWith(join("src/features/scoresheet/samples", "gallery-edges.ts"));
  });

  it("should complain about a poster no gallery source ever draws", () => {
    everyPosterSpy.mockReturnValue(["src/features/scoresheet/render/personal-svg.ts"]);
    foldersNamedSpy.mockReturnValue(["src/features/scoresheet/samples"]);
    readdirSyncSpy.mockReturnValue(["gallery-edges.ts"]);
    readSpy.mockReturnValue("nothing that draws it");

    expect(postersOutOfTheGallery().length).toBeGreaterThan(NOTHING);
  });

  it("should take the approved lists off the mockups folder rather than a list in code", () => {
    readdirSyncSpy.mockReturnValue(["gallery-edges.cases.txt", "a-poster.svg"]);
    foldersNamedSpy.mockReturnValue(["src/features/scoresheet/samples"]);
    readSpy.mockReturnValue("");

    casesOutOfStep();

    expect(readdirSyncSpy).toHaveBeenCalledWith("docs/mockups");
    expect(readSpy).toHaveBeenCalledWith(join("docs/mockups", "gallery-edges.cases.txt"));
    expect(readSpy).not.toHaveBeenCalledWith(join("docs/mockups", "a-poster.svg"));
  });

  it("should read a committed mockup only where one exists, and list the folder besides", () => {
    existsSyncSpy.mockReturnValue(true);
    readSpy.mockReturnValue("<svg>one</svg>");
    readdirSyncSpy.mockReturnValue(["a.svg"]);

    expect(mockupsOutOfStep({ a: "<svg>one</svg>" })).toEqual([]);
    expect(existsSyncSpy).toHaveBeenCalledWith("docs/mockups/a.svg");
    expect(readdirSyncSpy).toHaveBeenCalledWith("docs/mockups");
  });

  it("should say a mockup is out of step when the committed file says something else", () => {
    existsSyncSpy.mockReturnValue(true);
    readSpy.mockReturnValue("<svg>stale</svg>");
    readdirSyncSpy.mockReturnValue(["a.svg"]);

    expect(mockupsOutOfStep({ a: "<svg>fresh</svg>" })).toHaveLength(ONE_COMPLAINT);
  });

  it("should weigh the site posters against their own folder, not the mockups one", () => {
    existsSyncSpy.mockReturnValue(true);
    readSpy.mockReturnValue("<svg>one</svg>");
    readdirSyncSpy.mockReturnValue(["a.svg"]);

    expect(sitePostersOutOfStep({ a: "<svg>one</svg>" })).toEqual([]);
    expect(readdirSyncSpy).toHaveBeenCalledWith("docs/posters");
  });

  it("should say the design page is behind when nothing was ever synced", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(designPageOutOfStep({})).toHaveLength(ONE_COMPLAINT);
    expect(readSpy).not.toHaveBeenCalledWith(DESIGN_PAGE_SYNC);
  });
});

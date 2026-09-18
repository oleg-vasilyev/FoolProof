import { beforeEach, describe, expect, it, vi } from "vitest";
import { DESIGN_PAGE_SYNC } from "../../../tools/design-page.ts";


const readdirSyncSpy = vi.fn();

const existsSyncSpy = vi.fn();

const readSpy = vi.fn();

vi.mock("node:fs", () => ({
  readdirSync: (folder: string) => readdirSyncSpy(folder),
  existsSync: (file: string) => existsSyncSpy(file),
}));

vi.mock("../shared/document-files.ts", () => ({
  read: (file: string) => readSpy(file),
}));

const {
  committedPosterComplaints,
  committedPostersTheRendererDisagreesWith,
  designPageComplaints,
  theDesignPageDrawnFromOlderPosters,
} = await import("./committed-posters.ts");


const FIRST = 0;

const ONE_COMPLAINT = 1;

const SHA256_HEX_LENGTH = 64;

describe("committedPosterComplaints", () => {
  const CARD = "card";
  const SVG = "<svg>card</svg>";

  it("should say nothing when the committed picture matches what the code draws now", () => {
    const complaints = committedPosterComplaints({ [CARD]: SVG }, { [CARD]: SVG }, [`${CARD}.svg`]);

    expect(complaints).toEqual([]);
  });

  it("should say a picture was never drawn when nothing is committed for it", () => {
    const complaints = committedPosterComplaints({ [CARD]: SVG }, { [CARD]: undefined }, []);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(`docs/posters/${CARD}.svg`);
    expect(complaints[FIRST]).toContain("never drawn");
    expect(complaints[FIRST]).toContain("node scripts/tools/tools.ts posters");
  });

  it("should say the renderer draws something else now when the committed picture differs", () => {
    const complaints = committedPosterComplaints(
      { [CARD]: SVG },
      { [CARD]: "<svg>different</svg>" },
      [`${CARD}.svg`]
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(`docs/posters/${CARD}.svg`);
    expect(complaints[FIRST]).toContain('"refresh-the-pictures" skill redraws this');
    expect(complaints[FIRST]).toContain('"update-the-design-page"');
  });

  it("should name a committed picture no feature draws any more", () => {
    const complaints = committedPosterComplaints({}, {}, ["ghost.svg"]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("docs/posters/ghost.svg");
    expect(complaints[FIRST]).toContain("no feature draws this any more");
    expect(complaints[FIRST]).toContain("delete it with whatever stopped drawing it");
  });

  it("should ignore a file on disk that is not a picture at all", () => {
    expect(committedPosterComplaints({}, {}, ["notes.txt"])).toEqual([]);
  });

  it("should not call a picture orphaned when a feature still draws it under that name", () => {
    const complaints = committedPosterComplaints({ [CARD]: SVG }, { [CARD]: SVG }, [`${CARD}.svg`]);

    expect(complaints).toEqual([]);
  });
});

describe("designPageComplaints", () => {
  const DRAWN_NOW = "a".repeat(SHA256_HEX_LENGTH);

  const SOMETHING_ELSE = "b".repeat(SHA256_HEX_LENGTH);

  it("should say the page is behind when nothing has been synced yet", () => {
    const complaints = designPageComplaints(DRAWN_NOW, undefined);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain(DESIGN_PAGE_SYNC);
    expect(complaints[FIRST]).toContain('"update-the-design-page" skill');
    expect(complaints[FIRST]).toContain("last synced from different");
    expect(complaints[FIRST]).toContain("rewrites this file with the fingerprint it pushed");
  });

  it("should say nothing when the synced fingerprint matches what the posters hash to now", () => {
    expect(designPageComplaints(DRAWN_NOW, `posters: ${DRAWN_NOW}`)).toEqual([]);
  });

  it("should say the page is behind when the synced fingerprint no longer matches", () => {
    const complaints = designPageComplaints(SOMETHING_ELSE, `posters: ${DRAWN_NOW}`);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"update-the-design-page" skill');
  });

  it("should not read a fingerprint that is not written on its own labeled line", () => {
    const wrongShape = `not the right shape: ${DRAWN_NOW}`;

    expect(designPageComplaints(DRAWN_NOW, wrongShape)).toHaveLength(ONE_COMPLAINT);
  });
});

describe("the readers, against a repository that is not there", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readdirSyncSpy.mockReturnValue([]);
    existsSyncSpy.mockReturnValue(false);
    readSpy.mockReturnValue("");
  });

  it("should read a committed poster only where one exists, and list the folder besides", () => {
    existsSyncSpy.mockReturnValue(true);
    readSpy.mockReturnValue("<svg>one</svg>");
    readdirSyncSpy.mockReturnValue(["a.svg"]);

    expect(committedPostersTheRendererDisagreesWith({ a: "<svg>one</svg>" })).toEqual([]);
    expect(existsSyncSpy).toHaveBeenCalledWith("docs/posters/a.svg");
    expect(readdirSyncSpy).toHaveBeenCalledWith("docs/posters");
  });

  it("should say a poster is out of step when the committed file says something else", () => {
    existsSyncSpy.mockReturnValue(true);
    readSpy.mockReturnValue("<svg>stale</svg>");
    readdirSyncSpy.mockReturnValue(["a.svg"]);

    expect(committedPostersTheRendererDisagreesWith({ a: "<svg>fresh</svg>" })).toHaveLength(ONE_COMPLAINT);
  });

  it("should say the design page is behind when nothing was ever synced", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(theDesignPageDrawnFromOlderPosters({})).toHaveLength(ONE_COMPLAINT);
    expect(readSpy).not.toHaveBeenCalledWith(DESIGN_PAGE_SYNC);
  });
});

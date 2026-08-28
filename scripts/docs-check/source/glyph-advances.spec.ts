import { describe, expect, it } from "vitest";
import {
  advanceComplaints,
  advancesOutOfStep,
  facesOf,
  fingerprintOf,
  recordedIn,
} from "./glyph-advances.ts";


const NOTHING = 0;

const A_STAMP = "a".repeat(64);

const ANOTHER_STAMP = "b".repeat(64);

const A_ROSTER = `
export const FONT_FILES = [
  "NotoSans-Regular.ttf",
  "NotoSans-Bold.ttf",
].map(inside);
`;

describe("facesOf()", () => {
  it("should name every face the app ships, in the order it loads them", () => {
    expect(facesOf(A_ROSTER)).toEqual(["NotoSans-Regular.ttf", "NotoSans-Bold.ttf"]);
  });

  it("should find no face in a file that names none", () => {
    expect(facesOf("export const NOTHING = 1;")).toEqual([]);
  });

  it("should not be blind to a face from some other family, which is how a stamp drifts", () => {
    expect(facesOf('["Inter-Bold.ttf"].map(inside);')).toEqual(["Inter-Bold.ttf"]);
  });
});

describe("recordedIn()", () => {
  it("should read the stamp the generator wrote", () => {
    expect(recordedIn(`export const FONT_FINGERPRINT = "${A_STAMP}";`)).toBe(A_STAMP);
  });

  it("should find no stamp in a table that carries none", () => {
    expect(recordedIn("export const ADVANCES = {};")).toBeNull();
  });

  it("should refuse a stamp of the wrong length, rather than take half of one", () => {
    expect(recordedIn('export const FONT_FINGERPRINT = "abc";')).toBeNull();
  });

  it("should refuse a stamp that is not written in hex", () => {
    expect(recordedIn(`export const FONT_FINGERPRINT = "${"z".repeat(64)}";`)).toBeNull();
  });
});

describe("advancesOutOfStep()", () => {
  it("should say nothing about the table this repository actually carries", () => {
    expect(advancesOutOfStep()).toHaveLength(NOTHING);
  });
});

describe("fingerprintOf()", () => {
  it("should give the same faces the same stamp", () => {
    const faces = [Buffer.from("regular"), Buffer.from("bold")];

    expect(fingerprintOf(faces)).toBe(fingerprintOf([...faces]));
  });

  it("should give a changed face a different stamp, which is the whole point", () => {
    expect(fingerprintOf([Buffer.from("regular"), Buffer.from("bold")])).not.toBe(
      fingerprintOf([Buffer.from("regular"), Buffer.from("bolder")])
    );
  });

  it("should notice two faces swapping places, since the app loads them in order", () => {
    expect(fingerprintOf([Buffer.from("a"), Buffer.from("b")])).not.toBe(
      fingerprintOf([Buffer.from("b"), Buffer.from("a")])
    );
  });
});

describe("advanceComplaints()", () => {
  it("should say nothing while the table was measured against the shipped faces", () => {
    expect(advanceComplaints(A_STAMP, A_STAMP)).toHaveLength(NOTHING);
  });

  it("should complain when the faces have moved on without the table", () => {
    expect(advanceComplaints(A_STAMP, ANOTHER_STAMP)).toHaveLength(1);
  });

  it("should name the generator, so the fix does not have to be remembered", () => {
    expect(advanceComplaints(A_STAMP, ANOTHER_STAMP)[NOTHING]).toContain(
      "scripts/tools.ts advances"
    );
  });

  it("should complain about a table carrying no stamp at all", () => {
    expect(advanceComplaints(null, A_STAMP)).toHaveLength(1);
  });

  it("should say what a missing stamp costs rather than only that it is missing", () => {
    expect(advanceComplaints(null, A_STAMP)[NOTHING]).toContain("FONT_FINGERPRINT");
  });
});

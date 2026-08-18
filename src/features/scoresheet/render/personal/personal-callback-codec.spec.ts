import { describe, expect, it } from "vitest";
import {
  PERSONAL_TAPS,
  decodePersonalCallback,
  encodePersonalCallback,
} from "#scoresheet/render/personal/personal-callback-codec.ts";


const PLAYER_ID = 7;

const LONG_PLAYER_ID = 1204;

const NOBODY = 0;

describe("encodePersonalCallback()", () => {
  it("should write the player id behind the screen's own prefix", () => {
    expect(encodePersonalCallback(PLAYER_ID)).toBe("pc:7");
  });

  it("should keep every digit of a long id", () => {
    expect(encodePersonalCallback(LONG_PLAYER_ID)).toBe("pc:1204");
  });

  it("should encode the id zero rather than dropping it", () => {
    expect(encodePersonalCallback(NOBODY)).toBe("pc:0");
  });
});

describe("decodePersonalCallback()", () => {
  it("should read back the id its own encoder wrote", () => {
    expect(decodePersonalCallback(encodePersonalCallback(PLAYER_ID))).toBe(PLAYER_ID);
  });

  it("should read back a long id as a number, not as text", () => {
    expect(decodePersonalCallback(encodePersonalCallback(LONG_PLAYER_ID))).toBe(LONG_PLAYER_ID);
  });

  it("should read back the id zero rather than reporting no match", () => {
    expect(decodePersonalCallback(encodePersonalCallback(NOBODY))).toBe(NOBODY);
  });

  it("should refuse a payload with no id at all", () => {
    expect(decodePersonalCallback("pc:")).toBeNull();
  });

  it("should refuse an id that is not digits", () => {
    expect(decodePersonalCallback("pc:seven")).toBeNull();
  });

  it("should refuse an id with digits and a tail", () => {
    expect(decodePersonalCallback("pc:7x")).toBeNull();
  });

  it("should refuse a payload carrying a second segment", () => {
    expect(decodePersonalCallback("pc:7:9")).toBeNull();
  });

  it("should refuse a payload whose prefix is only a suffix", () => {
    expect(decodePersonalCallback("xpc:7")).toBeNull();
  });

  it("should refuse a payload that merely starts with the prefix", () => {
    expect(decodePersonalCallback("pcx:7")).toBeNull();
  });

  it("should refuse an empty payload", () => {
    expect(decodePersonalCallback("")).toBeNull();
  });

  describe("keeping its hands off the other screens' taps", () => {
    it("should refuse a merge tap", () => {
      expect(decodePersonalCallback("m:1:p:2")).toBeNull();
    });

    it("should refuse a language tap", () => {
      expect(decodePersonalCallback("l:ru")).toBeNull();
    });

    it("should refuse a seating tap", () => {
      expect(decodePersonalCallback("s:1:2:p:3")).toBeNull();
    });

    it("should refuse a live card tap", () => {
      expect(decodePersonalCallback("7f:p:-:3")).toBeNull();
    });
  });
});

describe("PERSONAL_TAPS", () => {
  it("should match what the encoder writes", () => {
    expect(PERSONAL_TAPS.test(encodePersonalCallback(PLAYER_ID))).toBe(true);
  });

  it("should match nothing another screen sends", () => {
    expect(PERSONAL_TAPS.test("m:1:p:2")).toBe(false);
  });

  it("should carry no global flag, so testing twice gives the same answer", () => {
    const first = PERSONAL_TAPS.test(encodePersonalCallback(PLAYER_ID));

    expect(PERSONAL_TAPS.test(encodePersonalCallback(PLAYER_ID))).toBe(first);
  });
});

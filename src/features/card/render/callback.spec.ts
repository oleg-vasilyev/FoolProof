import { describe, expect, it } from "vitest";
import {
  decodeCallback,
  encodeCallback,
  fromBase62,
  toBase62,
  type CallbackPayload,
} from "./callback.ts";


const CALLBACK_DATA_LIMIT_BYTES = 64;

const HUGE_GAME_ID = 999_999_999;

const HUGE_VERSION = 999_999;

describe("toBase62() / fromBase62()", () => {
  it("should encode zero", () => {
    expect(toBase62(0)).toBe("0");
  });

  it("should encode a single digit", () => {
    expect(toBase62(9)).toBe("9");
  });

  it("should roll over into letters past nine", () => {
    expect(toBase62(10)).toBe("A");
  });

  it("should carry into a second character at the base", () => {
    expect(toBase62(62)).toBe("10");
  });

  it("should round-trip a range of values", () => {
    const values = [0, 1, 61, 62, 63, 1000, HUGE_GAME_ID];

    expect(values.map((value) => fromBase62(toBase62(value)))).toEqual(values);
  });

  it("should stay shorter than decimal for large ids", () => {
    expect(toBase62(HUGE_GAME_ID).length).toBeLessThan(String(HUGE_GAME_ID).length);
  });
});

describe("encodeCallback()", () => {
  it("should lay out the four fields separated by colons", () => {
    const encoded = encodeCallback({ gameId: 1, action: "pick", slot: 3, version: 5 });

    expect(encoded).toBe("1:p:3:5");
  });

  it("should mark a missing slot rather than omitting the field", () => {
    const encoded = encodeCallback({ gameId: 1, action: "confirm", slot: null, version: 2 });

    expect(encoded).toBe("1:k:-:2");
  });

  it("should never carry a player name", () => {
    const encoded = encodeCallback({ gameId: 7, action: "pick", slot: 0, version: 1 });

    expect(encoded).not.toMatch(/[a-zA-Zа-яА-Я]{2,}/);
  });

  it("should stay inside Telegram's 64 byte limit at absurd sizes", () => {
    const encoded = encodeCallback({
      gameId: HUGE_GAME_ID,
      action: "pick",
      slot: 99,
      version: HUGE_VERSION,
    });

    expect(Buffer.byteLength(encoded, "utf8")).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT_BYTES);
  });
});

describe("decodeCallback()", () => {
  const roundTrip = (payload: CallbackPayload): CallbackPayload | null =>
    decodeCallback(encodeCallback(payload));

  it("should round-trip a pick", () => {
    const payload: CallbackPayload = { gameId: 42, action: "pick", slot: 2, version: 9 };

    expect(roundTrip(payload)).toEqual(payload);
  });

  it("should round-trip every action", () => {
    const actions = ["pick", "draw", "back", "confirm", "cancel"] as const;

    const decoded = actions.map(
      (action) => roundTrip({ gameId: 5, action, slot: null, version: 1 })?.action
    );

    expect(decoded).toEqual([...actions]);
  });

  it("should round-trip a large game id through base62", () => {
    const payload: CallbackPayload = {
      gameId: HUGE_GAME_ID,
      action: "back",
      slot: null,
      version: 3,
    };

    expect(roundTrip(payload)).toEqual(payload);
  });

  it("should reject data with too few fields", () => {
    expect(decodeCallback("1:p:3")).toBeNull();
  });

  it("should reject data with too many fields", () => {
    expect(decodeCallback("1:p:3:5:9")).toBeNull();
  });

  it("should reject an unknown action code", () => {
    expect(decodeCallback("1:z:3:5")).toBeNull();
  });

  it("should reject a non-base62 game id", () => {
    expect(decodeCallback("1-2:p:3:5")).toBeNull();
  });

  it("should reject a non-numeric version", () => {
    expect(decodeCallback("1:p:3:x")).toBeNull();
  });

  it("should reject a non-numeric slot", () => {
    expect(decodeCallback("1:p:x:5")).toBeNull();
  });

  it("should reject empty data", () => {
    expect(decodeCallback("")).toBeNull();
  });

  it("should reject trailing rubbish after the version", () => {
    expect(decodeCallback("1:p:3:5x")).toBeNull();
  });

  it("should reject leading rubbish before the version", () => {
    expect(decodeCallback("1:p:3:x5")).toBeNull();
  });

  it("should reject trailing rubbish after the slot", () => {
    expect(decodeCallback("1:p:3x:5")).toBeNull();
  });

  it("should reject a game id that is not base62", () => {
    expect(decodeCallback("1_2:p:3:5")).toBeNull();
  });

  it("should reject a multi-character action code", () => {
    expect(decodeCallback("1:pp:3:5")).toBeNull();
  });

  it("should accept a multi-digit version", () => {
    expect(decodeCallback("1:p:3:42")?.version).toBe(42);
  });

  it("should accept a multi-digit slot", () => {
    expect(decodeCallback("1:p:12:5")?.slot).toBe(12);
  });

  it("should accept a multi-character game id", () => {
    expect(decodeCallback("2v:p:0:1")?.gameId).toBe(fromBase62("2v"));
  });

  it("should treat a lone dash as no slot rather than a number", () => {
    expect(decodeCallback("1:p:-:5")?.slot).toBeNull();
  });

  it("should reject a negative slot", () => {
    expect(decodeCallback("1:p:-3:5")).toBeNull();
  });

  it("should reject an empty field", () => {
    expect(decodeCallback("1:p::5")).toBeNull();
  });

  it("should reject whitespace padding", () => {
    expect(decodeCallback(" 1:p:3:5")).toBeNull();
  });

  it("should reject a newline smuggled onto the end", () => {
    expect(decodeCallback("1:p:3:5\n")).toBeNull();
  });
});

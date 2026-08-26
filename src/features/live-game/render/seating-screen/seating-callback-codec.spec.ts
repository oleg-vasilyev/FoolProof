import { ActionKind } from "#live-game/domain/card-states.ts";
import { describe, expect, it } from "vitest";
import { CARD_TAPS, toBase62 } from "#live-game/render/callback-data-codec.ts";
import {
  decodeSeatingCallback,
  encodeSeatingCallback,
  SEATING_TAPS,
} from "#live-game/render/seating-screen/seating-callback-codec.ts";


const OLEG = 3;

const ANYA = 7;

const ROMA = 12;

const KIM = 41;

const NONE_PLACED = 0;

const TWO_PLACED = 2;

const TWELVE_PLACED = 12;

const SHORTENED_ID = 72;

const ANOTHER_SHORTENED_ID = 135;

const CALLBACK_DATA_LIMIT = 64;

const BIGGEST_TABLE = 10;

const WIDEST_ID = 999_999;

describe("encodeSeatingCallback()", () => {
  it("should carry the roster in seating order, with how many are already seated", () => {
    expect(
      encodeSeatingCallback({
        order: [ANYA, KIM, OLEG, ROMA],
        placed: TWO_PLACED,
        action: { kind: ActionKind.Pick, playerId: OLEG },
      })
    ).toBe("s:7.f.3.C:2:p:3");
  });

  it("should give an action with nobody to seat an empty argument", () => {
    expect(
      encodeSeatingCallback({ order: [OLEG, ANYA], placed: NONE_PLACED, action: { kind: ActionKind.Back } })
    ).toBe("s:3.7:0:b:-");
  });

  it("should give Play a code of its own, so it cannot be read as a seat being taken", () => {
    expect(
      encodeSeatingCallback({
        order: [OLEG, ANYA],
        placed: TWO_PLACED,
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("s:3.7:2:k:-");
  });

  it("should shorten an id rather than spell it out, so a full table still fits", () => {
    expect(
      encodeSeatingCallback({
        order: [WIDEST_ID],
        placed: NONE_PLACED,
        action: { kind: ActionKind.Cancel },
      })
    ).toBe(`s:${toBase62(WIDEST_ID)}:0:x:-`);
  });

  it("should stay inside the Bot API's budget for a table nobody will ever exceed", () => {
    const order = Array.from({ length: BIGGEST_TABLE }, () => WIDEST_ID);

    const data = encodeSeatingCallback({
      order,
      placed: BIGGEST_TABLE,
      action: { kind: ActionKind.Pick, playerId: WIDEST_ID },
    });

    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT);
  });
});

describe("decodeSeatingCallback()", () => {
  it("should read back what it wrote", () => {
    const payload = {
      order: [ANYA, KIM, OLEG, ROMA],
      placed: TWO_PLACED,
      action: { kind: ActionKind.Pick, playerId: OLEG },
    } as const;

    expect(decodeSeatingCallback(encodeSeatingCallback(payload))).toEqual(payload);
  });

  it("should read every seat of the roster back, not only the first", () => {
    expect(decodeSeatingCallback("s:7.f.3.C:2:b:-")).toEqual({
      order: [ANYA, KIM, OLEG, ROMA],
      placed: TWO_PLACED,
      action: { kind: ActionKind.Back },
    });
  });

  it("should read a shortened id back whole, wherever it sits in the roster", () => {
    expect(decodeSeatingCallback("s:1A.7.2B:0:b:-")).toEqual({
      order: [SHORTENED_ID, ANYA, ANOTHER_SHORTENED_ID],
      placed: NONE_PLACED,
      action: { kind: ActionKind.Back },
    });
  });

  it("should read a shortened id back whole when it is the one being seated", () => {
    expect(decodeSeatingCallback("s:3.7:0:p:1A")).toEqual({
      order: [OLEG, ANYA],
      placed: NONE_PLACED,
      action: { kind: ActionKind.Pick, playerId: SHORTENED_ID },
    });
  });

  it("should read a seat count past the first ten back whole", () => {
    expect(decodeSeatingCallback("s:3.7:12:b:-")).toEqual({
      order: [OLEG, ANYA],
      placed: TWELVE_PLACED,
      action: { kind: ActionKind.Back },
    });
  });

  it("should refuse data belonging to the live card", () => {
    expect(decodeSeatingCallback("12:p:0:3")).toBeNull();
  });

  it("should read Play back as the confirmation it is", () => {
    expect(decodeSeatingCallback("s:3.7:2:k:-")).toEqual({
      order: [OLEG, ANYA],
      placed: TWO_PLACED,
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should refuse an action code it does not know", () => {
    expect(decodeSeatingCallback("s:3.7:0:z:-")).toBeNull();
  });

  it("should refuse a pick with nobody to seat", () => {
    expect(decodeSeatingCallback("s:3.7:0:p:-")).toBeNull();
  });

  it("should refuse an empty string", () => {
    expect(decodeSeatingCallback("")).toBeNull();
  });

  it("should refuse data with anything after it", () => {
    expect(decodeSeatingCallback("s:3.7:0:p:3 and more")).toBeNull();
  });

  it("should refuse data with anything before it", () => {
    expect(decodeSeatingCallback("before s:3.7:0:p:3")).toBeNull();
  });
});

describe("SEATING_TAPS", () => {
  it("should match what the codec writes", () => {
    const data = encodeSeatingCallback({
      order: [OLEG, ANYA],
      placed: NONE_PLACED,
      action: { kind: ActionKind.Cancel },
    });

    expect(SEATING_TAPS.test(data)).toBe(true);
  });

  it("should not match the live card's data", () => {
    expect(SEATING_TAPS.test("12:p:0:3")).toBe(false);
  });

  it("should not let the live card claim a seating tap, since a game id can spell s", () => {
    const data = encodeSeatingCallback({
      order: [OLEG, ANYA],
      placed: NONE_PLACED,
      action: { kind: ActionKind.Pick, playerId: OLEG },
    });

    expect(CARD_TAPS.test(data)).toBe(false);
  });
});

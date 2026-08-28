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

const ORDER = [ANYA, KIM, OLEG, ROMA];

const NOBODY_SEATED: readonly number[] = [];

const SHORTENED_ID = 72;

const ANOTHER_SHORTENED_ID = 135;

const CALLBACK_DATA_LIMIT = 64;

const BIGGEST_TABLE = 10;

const SEATS_A_TAP_CAN_FILL = 9;

const WIDEST_ID = 999_999;

const A_CARD_TAP = "12:p:0:3";

describe("encodeSeatingCallback()", () => {
  it("should carry the table in the order it is drawn, and the seats already taken", () => {
    expect(
      encodeSeatingCallback({
        order: ORDER,
        seated: [ANYA, KIM],
        action: { kind: ActionKind.Pick, playerId: OLEG },
      })
    ).toBe("S:17f3C:01:p:3");
  });

  it("should write a seat as its place in the order it travels with, not as an id", () => {
    expect(
      encodeSeatingCallback({
        order: ORDER,
        seated: [ROMA],
        action: { kind: ActionKind.Back },
      })
    ).toBe("S:17f3C:3:b:-");
  });

  it("should give an action with nobody to seat an empty argument", () => {
    expect(
      encodeSeatingCallback({
        order: [OLEG, ANYA],
        seated: NOBODY_SEATED,
        action: { kind: ActionKind.Back },
      })
    ).toBe("S:137::b:-");
  });

  it("should give Play a code of its own, so it cannot be read as a seat being taken", () => {
    expect(
      encodeSeatingCallback({
        order: [OLEG, ANYA],
        seated: [OLEG],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("S:137:0:k:-");
  });

  it("should shorten an id rather than spell it out, so a full table still fits", () => {
    expect(
      encodeSeatingCallback({
        order: [WIDEST_ID],
        seated: NOBODY_SEATED,
        action: { kind: ActionKind.Cancel },
      })
    ).toBe(`S:${toBase62(toBase62(WIDEST_ID).length)}${toBase62(WIDEST_ID)}::x:-`);
  });

  it("should stay inside the Bot API's budget for a table nobody will ever exceed", () => {
    const order = Array.from({ length: BIGGEST_TABLE }, (_unused, at) => WIDEST_ID - at);

    const data = encodeSeatingCallback({
      order,
      seated: order.slice(0, SEATS_A_TAP_CAN_FILL),
      action: { kind: ActionKind.Pick, playerId: WIDEST_ID },
    });

    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT);
  });
});

describe("decodeSeatingCallback()", () => {
  it("should read back what it wrote", () => {
    const payload = {
      order: ORDER,
      seated: [ANYA, KIM],
      action: { kind: ActionKind.Pick, playerId: OLEG },
    } as const;

    expect(decodeSeatingCallback(encodeSeatingCallback(payload))).toEqual(payload);
  });

  it("should read every seat of the table back, not only the first", () => {
    expect(decodeSeatingCallback("S:17f3C:01:b:-")).toEqual({
      order: ORDER,
      seated: [ANYA, KIM],
      action: { kind: ActionKind.Back },
    });
  });

  it("should read a seat as a place in the order it travels with, not as an id", () => {
    expect(decodeSeatingCallback("S:137:1:k:-")?.seated).toEqual([ANYA]);
    expect(decodeSeatingCallback("S:173:1:k:-")?.seated).toEqual([OLEG]);
  });

  it("should keep the seats in the order they were tapped", () => {
    expect(decodeSeatingCallback("S:17f3C:31:b:-")?.seated).toEqual([ROMA, KIM]);
  });

  it("should read a shortened id back whole, wherever it sits in the table", () => {
    expect(decodeSeatingCallback("S:21A072B:0:b:-")).toEqual({
      order: [SHORTENED_ID, ANYA, ANOTHER_SHORTENED_ID],
      seated: [SHORTENED_ID],
      action: { kind: ActionKind.Back },
    });
  });

  it("should read a shortened id back whole when it is the one being seated", () => {
    expect(decodeSeatingCallback("S:137::p:1A")).toEqual({
      order: [OLEG, ANYA],
      seated: NOBODY_SEATED,
      action: { kind: ActionKind.Pick, playerId: SHORTENED_ID },
    });
  });

  it("should refuse a screen drawn before the order stopped moving, since it cannot be redrawn", () => {
    expect(decodeSeatingCallback("s:7.f.3.C:2:p:3")).toBeNull();
  });

  it("should refuse data belonging to the live card", () => {
    expect(decodeSeatingCallback(A_CARD_TAP)).toBeNull();
  });

  it("should read Play back as the confirmation it is", () => {
    expect(decodeSeatingCallback("S:137:0:k:-")).toEqual({
      order: [OLEG, ANYA],
      seated: [OLEG],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should refuse an action code it does not know", () => {
    expect(decodeSeatingCallback("S:137::z:-")).toBeNull();
  });

  it("should refuse a pick with nobody to seat", () => {
    expect(decodeSeatingCallback("S:137::p:-")).toBeNull();
  });

  it.each([
    ["a seat nobody at the table holds", "S:137:5:b:-"],
    ["the same seat taken twice", "S:137:00:b:-"],
    ["a table that does not divide by its own width", "S:2137:0:b:-"],
    ["no table at all", "S:::b:-"],
  ])("should refuse data with %s", (_unused, data) => {
    expect(decodeSeatingCallback(data)).toBeNull();
  });

  it("should refuse an empty string", () => {
    expect(decodeSeatingCallback("")).toBeNull();
  });

  it("should refuse data with anything after it", () => {
    expect(decodeSeatingCallback("S:137::p:3 and more")).toBeNull();
  });

  it("should refuse data with anything before it", () => {
    expect(decodeSeatingCallback("before S:137::p:3")).toBeNull();
  });
});

describe("SEATING_TAPS", () => {
  it("should match what the codec writes", () => {
    const data = encodeSeatingCallback({
      order: [OLEG, ANYA],
      seated: NOBODY_SEATED,
      action: { kind: ActionKind.Cancel },
    });

    expect(SEATING_TAPS.test(data)).toBe(true);
  });

  it("should not match the live card's data", () => {
    expect(SEATING_TAPS.test(A_CARD_TAP)).toBe(false);
  });

  it("should not claim a screen drawn before the order stopped moving", () => {
    expect(SEATING_TAPS.test("s:7.f.3.C:2:p:3")).toBe(false);
  });

  it("should not let the live card claim a seating tap, since a game id can spell S", () => {
    const data = encodeSeatingCallback({
      order: [OLEG, ANYA],
      seated: NOBODY_SEATED,
      action: { kind: ActionKind.Pick, playerId: OLEG },
    });

    expect(CARD_TAPS.test(data)).toBe(false);
  });
});

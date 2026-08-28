import { ActionKind } from "#live-game/domain/card-states.ts";
import { describe, expect, it } from "vitest";
import { CARD_TAPS } from "#live-game/render/callback-data-codec.ts";
import { SEATING_TAPS } from "#live-game/render/seating-screen/seating-callback-codec.ts";
import {
  decodeLeavingCallback,
  encodeLeavingCallback,
  LEAVING_TAPS,
} from "#live-game/render/leaving-screen/leaving-callback-codec.ts";
import type { LeavingAction } from "#live-game/domain/leaving-plan.ts";


const OLEG = 3;

const ANYA = 7;

const ROMA = 12;

const KIM = 41;

const SASHA = 5;

const DIMA = 9;

const MASHA = 20;

const NOBODY: readonly number[] = [];

const ORDER = [ANYA, KIM, OLEG, ROMA];

const A_CARD_TAP = "12:p:0:3";

const A_SEATING_TAP = "s:3.7:0:p:3";

const A_MERGE_TAP = "m:12:p:3";

const CALLBACK_DATA_LIMIT = 64;

const BIGGEST_TABLE = 10;

const WIDEST_ID = 999_999;

const WIDEST_ID_IN_BASE_62 = "4C91";

const ACTIONS: readonly LeavingAction[] = [
  { kind: ActionKind.Pick, playerId: OLEG },
  { kind: ActionKind.Back },
  { kind: ActionKind.Confirm },
  { kind: ActionKind.Cancel },
];

describe("encodeLeavingCallback()", () => {
  it("should carry the roster in seating order, with the marks as seats over it", () => {
    expect(
      encodeLeavingCallback({
        order: ORDER,
        leaving: [KIM, ROMA],
        action: { kind: ActionKind.Pick, playerId: OLEG },
      })
    ).toBe("W:17f3C:13:p:3");
  });

  it("should keep the marks in the order they were made, so Back knows which was last", () => {
    expect(
      encodeLeavingCallback({
        order: ORDER,
        leaving: [ROMA, KIM],
        action: { kind: ActionKind.Pick, playerId: OLEG },
      })
    ).toBe("W:17f3C:31:p:3");
  });

  it("should mark the seat a player sits in, not the seat their id would suggest", () => {
    expect(
      encodeLeavingCallback({
        order: [ROMA, OLEG],
        leaving: [ROMA],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("W:1C3:0:k:-");
  });

  it("should write nobody sitting out as no marks at all", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA],
        leaving: NOBODY,
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("W:137::k:-");
  });

  it("should write every seat of a table nobody is playing on", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA, ROMA],
        leaving: [OLEG, ANYA, ROMA],
        action: { kind: ActionKind.Cancel },
      })
    ).toBe("W:137C:012:x:-");
  });

  it("should give an action with nobody to mark an empty argument", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA],
        leaving: [ANYA],
        action: { kind: ActionKind.Cancel },
      })
    ).toBe("W:137:1:x:-");
  });

  it("should ignore a mark for somebody who is not at the table", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA],
        leaving: [ROMA],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("W:137::k:-");
  });

  it("should shorten an id rather than spell it out, so a full table still fits", () => {
    expect(
      encodeLeavingCallback({
        order: [WIDEST_ID],
        leaving: NOBODY,
        action: { kind: ActionKind.Cancel },
      })
    ).toBe(`W:4${WIDEST_ID_IN_BASE_62}::x:-`);
  });

  it("should pad a narrow id out to the widest, since no separator marks where one ends", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, WIDEST_ID],
        leaving: [WIDEST_ID],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe(`W:40003${WIDEST_ID_IN_BASE_62}:1:k:-`);
  });

  it("should write a seat too wide for one base-62 digit in base 62 as well", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA, ROMA, KIM, SASHA, DIMA, MASHA],
        leaving: [MASHA],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("W:137Cf59K:6:k:-");
  });

  it("should write a different code for every action the screen can send", () => {
    const written = ACTIONS.map((action) =>
      encodeLeavingCallback({ order: ORDER, leaving: NOBODY, action })
    );

    expect(new Set(written).size).toBe(ACTIONS.length);
  });

  it("should stay inside the Bot API's budget for the widest screen it can draw", () => {
    const order = Array.from({ length: BIGGEST_TABLE }, () => WIDEST_ID);

    const data = encodeLeavingCallback({
      order,
      leaving: order,
      action: { kind: ActionKind.Pick, playerId: WIDEST_ID },
    });

    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT);
  });
});

describe("decodeLeavingCallback()", () => {
  it.each(ACTIONS)("should read a $kind back with everything it was written with", (action) => {
    const payload = { order: ORDER, leaving: [KIM, ROMA], action };

    expect(decodeLeavingCallback(encodeLeavingCallback(payload))).toEqual(payload);
  });

  it("should read every seat of the roster back, not only the first", () => {
    expect(decodeLeavingCallback("W:17f3C:13:k:-")).toEqual({
      order: ORDER,
      leaving: [KIM, ROMA],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read the marks back in the order they were made, not in seating order", () => {
    expect(decodeLeavingCallback("W:17f3C:31:k:-")?.leaving).toEqual([ROMA, KIM]);
  });

  it("should read a mark as a seat over the order it travels with, not as an id", () => {
    expect(decodeLeavingCallback("W:137:0:k:-")?.leaving).toEqual([OLEG]);
    expect(decodeLeavingCallback("W:173:0:k:-")?.leaving).toEqual([ANYA]);
  });

  it("should read a mark on the last seat back, not always the first", () => {
    expect(decodeLeavingCallback("W:137C:2:x:-")).toEqual({
      order: [OLEG, ANYA, ROMA],
      leaving: [ROMA],
      action: { kind: ActionKind.Cancel },
    });
  });

  it("should read no marks back as nobody sitting out", () => {
    expect(decodeLeavingCallback("W:137::k:-")).toEqual({
      order: [OLEG, ANYA],
      leaving: NOBODY,
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a seat too wide for one base-62 digit back in base 62", () => {
    expect(decodeLeavingCallback("W:137Cf59K:6:k:-")).toEqual({
      order: [OLEG, ANYA, ROMA, KIM, SASHA, DIMA, MASHA],
      leaving: [MASHA],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a padded id back whole, wherever it sits in the roster", () => {
    expect(decodeLeavingCallback(`W:4${WIDEST_ID_IN_BASE_62}0007:0:k:-`)).toEqual({
      order: [WIDEST_ID, ANYA],
      leaving: [WIDEST_ID],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a padded id back whole when it is not the first seat", () => {
    expect(decodeLeavingCallback(`W:40007${WIDEST_ID_IN_BASE_62}:1:k:-`)).toEqual({
      order: [ANYA, WIDEST_ID],
      leaving: [WIDEST_ID],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a shortened id back whole when it is the one being marked", () => {
    expect(decodeLeavingCallback(`W:137::p:${WIDEST_ID_IN_BASE_62}`)).toEqual({
      order: [OLEG, ANYA],
      leaving: NOBODY,
      action: { kind: ActionKind.Pick, playerId: WIDEST_ID },
    });
  });

  it("should refuse an action code it does not know", () => {
    expect(decodeLeavingCallback("W:137::z:-")).toBeNull();
  });

  it("should refuse an action the leaving screen has no button for", () => {
    expect(decodeLeavingCallback("W:137::d:-")).toBeNull();
  });

  it("should refuse a pick with nobody to mark", () => {
    expect(decodeLeavingCallback("W:137::p:-")).toBeNull();
  });

  it.each([
    ["nothing at all", ""],
    ["a tap on the live card", A_CARD_TAP],
    ["a tap on the seating screen", A_SEATING_TAP],
    ["a tap on the merge screen", A_MERGE_TAP],
    ["a screen letter of its own", "137::k:-"],
    ["no roster at all", "W:::k:-"],
    ["a width of zero", "W:0137::k:-"],
    ["a width digit and no ids under it", "W:1::k:-"],
    ["a roster that does not divide by its own width", "W:2137::k:-"],
    ["an id that is not base 62", "W:1-37::k:-"],
    ["a separator left over from the old shape", "W:1.7::k:-"],
    ["a mark on a seat nobody sits in", "W:137:5:k:-"],
    ["the same seat marked twice", "W:137:00:k:-"],
    ["an action code in capitals", "W:137::K:-"],
    ["an action code of more than one letter", "W:137::kk:-"],
    ["a field missing", "W:137::k"],
    ["a field too many", "W:137::k:-:9"],
    ["anything before it", "before W:137::p:3"],
    ["anything after it", "W:137::p:3 and more"],
  ])("should refuse data with %s", (_unused, data) => {
    expect(decodeLeavingCallback(data)).toBeNull();
  });
});

describe("LEAVING_TAPS", () => {
  it.each(ACTIONS)("should match the $kind the codec writes", (action) => {
    const data = encodeLeavingCallback({ order: ORDER, leaving: [KIM], action });

    expect(LEAVING_TAPS.test(data)).toBe(true);
  });

  it("should not match a tap on the live card", () => {
    expect(LEAVING_TAPS.test(A_CARD_TAP)).toBe(false);
  });

  it("should not match a tap on the seating screen", () => {
    expect(LEAVING_TAPS.test(A_SEATING_TAP)).toBe(false);
  });

  it("should not match a tap on the merge screen", () => {
    expect(LEAVING_TAPS.test(A_MERGE_TAP)).toBe(false);
  });

  it("should not be matched by the patterns the other screens listen on", () => {
    const data = encodeLeavingCallback({
      order: ORDER,
      leaving: [KIM],
      action: { kind: ActionKind.Confirm },
    });

    expect(CARD_TAPS.test(data)).toBe(false);
    expect(SEATING_TAPS.test(data)).toBe(false);
  });
});

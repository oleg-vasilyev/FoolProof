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
    ).toBe("w:7.f.3.C:A:p:3");
  });

  it("should mark the seat a player sits in, not the seat their id would suggest", () => {
    expect(
      encodeLeavingCallback({
        order: [ROMA, OLEG],
        leaving: [ROMA],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("w:C.3:1:k:-");
  });

  it("should write nobody sitting out as an empty mask", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA],
        leaving: NOBODY,
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("w:3.7:0:k:-");
  });

  it("should write every seat of a table nobody is playing on", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA, ROMA],
        leaving: [OLEG, ANYA, ROMA],
        action: { kind: ActionKind.Cancel },
      })
    ).toBe("w:3.7.C:7:x:-");
  });

  it("should give an action with nobody to mark an empty argument", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA],
        leaving: [ANYA],
        action: { kind: ActionKind.Cancel },
      })
    ).toBe("w:3.7:2:x:-");
  });

  it("should ignore a mark for somebody who is not at the table", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA],
        leaving: [ROMA],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("w:3.7:0:k:-");
  });

  it("should shorten an id rather than spell it out, so a full table still fits", () => {
    expect(
      encodeLeavingCallback({
        order: [WIDEST_ID],
        leaving: NOBODY,
        action: { kind: ActionKind.Cancel },
      })
    ).toBe(`w:${WIDEST_ID_IN_BASE_62}:0:x:-`);
  });

  it("should write a mask too wide for one base-62 digit in base 62 as well", () => {
    expect(
      encodeLeavingCallback({
        order: [OLEG, ANYA, ROMA, KIM, SASHA, DIMA, MASHA],
        leaving: [MASHA],
        action: { kind: ActionKind.Confirm },
      })
    ).toBe("w:3.7.C.f.5.9.K:12:k:-");
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
    expect(decodeLeavingCallback("w:7.f.3.C:A:k:-")).toEqual({
      order: ORDER,
      leaving: [KIM, ROMA],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a mark as a seat over the order it travels with, not as an id", () => {
    expect(decodeLeavingCallback("w:3.7:1:k:-")?.leaving).toEqual([OLEG]);
    expect(decodeLeavingCallback("w:7.3:1:k:-")?.leaving).toEqual([ANYA]);
  });

  it("should read a mark on the last seat back, not always the first", () => {
    expect(decodeLeavingCallback("w:3.7.C:4:x:-")).toEqual({
      order: [OLEG, ANYA, ROMA],
      leaving: [ROMA],
      action: { kind: ActionKind.Cancel },
    });
  });

  it("should read an empty mask back as nobody sitting out", () => {
    expect(decodeLeavingCallback("w:3.7:0:k:-")).toEqual({
      order: [OLEG, ANYA],
      leaving: NOBODY,
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a mask too wide for one base-62 digit back in base 62", () => {
    expect(decodeLeavingCallback("w:3.7.C.f.5.9.K:12:k:-")).toEqual({
      order: [OLEG, ANYA, ROMA, KIM, SASHA, DIMA, MASHA],
      leaving: [MASHA],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a shortened id back whole, wherever it sits in the roster", () => {
    expect(decodeLeavingCallback(`w:${WIDEST_ID_IN_BASE_62}.7:1:k:-`)).toEqual({
      order: [WIDEST_ID, ANYA],
      leaving: [WIDEST_ID],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a shortened id back whole when it is not the first seat", () => {
    expect(decodeLeavingCallback(`w:7.${WIDEST_ID_IN_BASE_62}:2:k:-`)).toEqual({
      order: [ANYA, WIDEST_ID],
      leaving: [WIDEST_ID],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should read a shortened id back whole when it is the one being marked", () => {
    expect(decodeLeavingCallback(`w:3.7:0:p:${WIDEST_ID_IN_BASE_62}`)).toEqual({
      order: [OLEG, ANYA],
      leaving: NOBODY,
      action: { kind: ActionKind.Pick, playerId: WIDEST_ID },
    });
  });

  it("should refuse an action code it does not know", () => {
    expect(decodeLeavingCallback("w:3.7:0:z:-")).toBeNull();
  });

  it("should refuse an action the leaving screen has no button for", () => {
    expect(decodeLeavingCallback("w:3.7:0:b:-")).toBeNull();
    expect(decodeLeavingCallback("w:3.7:0:d:-")).toBeNull();
  });

  it("should refuse a pick with nobody to mark", () => {
    expect(decodeLeavingCallback("w:3.7:0:p:-")).toBeNull();
  });

  it.each([
    ["nothing at all", ""],
    ["a tap on the live card", A_CARD_TAP],
    ["a tap on the seating screen", A_SEATING_TAP],
    ["a tap on the merge screen", A_MERGE_TAP],
    ["a screen letter of its own", "3.7:0:k:-"],
    ["no roster at all", "w::0:k:-"],
    ["a gap in the roster", "w:3..7:0:k:-"],
    ["an id that is not base 62", "w:3.-7:0:k:-"],
    ["no mask", "w:3.7::k:-"],
    ["a mask that is not base 62", "w:3.7:-1:k:-"],
    ["an action code in capitals", "w:3.7:0:K:-"],
    ["an action code of more than one letter", "w:3.7:0:kk:-"],
    ["a field missing", "w:3.7:0:k"],
    ["a field too many", "w:3.7:0:k:-:9"],
    ["anything before it", "before w:3.7:0:p:3"],
    ["anything after it", "w:3.7:0:p:3 and more"],
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

  it("should not let the live card claim a leaving tap, since a game id can spell w", () => {
    const data = encodeLeavingCallback({
      order: [OLEG, ANYA],
      leaving: [OLEG],
      action: { kind: ActionKind.Pick, playerId: OLEG },
    });

    expect(CARD_TAPS.test(data)).toBe(false);
  });

  it("should not let the seating screen claim a leaving tap", () => {
    const data = encodeLeavingCallback({
      order: [OLEG, ANYA],
      leaving: [OLEG],
      action: { kind: ActionKind.Pick, playerId: OLEG },
    });

    expect(SEATING_TAPS.test(data)).toBe(false);
  });
});

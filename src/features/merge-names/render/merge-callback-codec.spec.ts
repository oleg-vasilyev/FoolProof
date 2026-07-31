import { describe, expect, it } from "vitest";
import { MOST_NAMES_AT_ONCE } from "#merge-names/domain/merge-selection.ts";
import {
  decodeMergeCallback,
  encodeMergeCallback,
  MERGE_TAPS,
} from "#merge-names/render/merge-callback-codec.ts";


const ANYA = 12;

const ANNA = 7;

const OLEG = 3;

const CALLBACK_DATA_LIMIT = 64;

const TWO_DIGIT_ID = 34;

const MULTI_DIGIT_ARG = 56;

const WIDEST_ID = 9_999_999;

describe("encodeMergeCallback()", () => {
  it("should carry the selection in tap order", () => {
    expect(
      encodeMergeCallback({ selection: [ANYA, ANNA], action: { kind: "pick", playerId: OLEG } })
    ).toBe("m:12.7:p:3");
  });

  it("should keep every digit of an id, not just the first", () => {
    expect(
      encodeMergeCallback({
        selection: [ANYA, TWO_DIGIT_ID],
        action: { kind: "pick", playerId: TWO_DIGIT_ID },
      })
    ).toBe("m:12.34:p:34");
  });

  it("should write an empty selection as nothing", () => {
    expect(encodeMergeCallback({ selection: [], action: { kind: "cancel" } })).toBe("m:-:x:-");
  });

  it("should give an action with no name an empty argument", () => {
    expect(encodeMergeCallback({ selection: [ANYA], action: { kind: "back" } })).toBe("m:12:b:-");
  });

  it("should stay inside the Bot API's budget for as many names as a merge allows", () => {
    const selection = Array.from({ length: MOST_NAMES_AT_ONCE }, () => WIDEST_ID);

    const data = encodeMergeCallback({
      selection,
      action: { kind: "pick", playerId: WIDEST_ID },
    });

    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT);
  });
});

describe("decodeMergeCallback()", () => {
  it("should read back what it wrote", () => {
    const payload = { selection: [ANYA, ANNA], action: { kind: "pick", playerId: OLEG } } as const;

    expect(decodeMergeCallback(encodeMergeCallback(payload))).toEqual(payload);
  });

  it("should read an empty selection back as no names", () => {
    expect(decodeMergeCallback("m:-:k:-")).toEqual({
      selection: [],
      action: { kind: "confirm" },
    });
  });

  it("should refuse data belonging to another screen", () => {
    expect(decodeMergeCallback("12:p:0:3")).toBeNull();
  });

  it("should refuse an action code it does not know", () => {
    expect(decodeMergeCallback("m:12:z:-")).toBeNull();
  });

  it("should refuse a pick with no name to pick", () => {
    expect(decodeMergeCallback("m:12:p:-")).toBeNull();
  });

  it("should refuse an empty string", () => {
    expect(decodeMergeCallback("")).toBeNull();
  });

  it("should refuse data with anything after it", () => {
    expect(decodeMergeCallback("m:12:p:3 and more")).toBeNull();
  });

  it("should refuse data with anything before it", () => {
    expect(decodeMergeCallback("before m:12:p:3")).toBeNull();
  });

  it("should read every digit of a multi-digit id back", () => {
    expect(decodeMergeCallback("m:12.34:p:56")).toEqual({
      selection: [ANYA, TWO_DIGIT_ID],
      action: { kind: "pick", playerId: MULTI_DIGIT_ARG },
    });
  });
});

describe("MERGE_TAPS", () => {
  it("should match what the codec writes", () => {
    const data = encodeMergeCallback({ selection: [ANYA], action: { kind: "confirm" } });

    expect(MERGE_TAPS.test(data)).toBe(true);
  });

  it("should not match the live card's data", () => {
    expect(MERGE_TAPS.test("12:p:0:3")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { ActionKind } from "#replace-names/domain/replace-states.ts";
import {
  decodeReplaceCallback,
  encodeReplaceCallback,
  REPLACE_TAPS,
} from "#replace-names/render/replace-callback-codec.ts";


const FIRST_GAME_ID = 12;

const ROMA_ID = 7;

const ROMANI_ID = 3;

const TWO_DIGIT_GAME = 34;

const TWO_DIGIT_FROM = 56;

const TWO_DIGIT_TO = 78;

const CALLBACK_DATA_LIMIT = 64;

const WIDEST_ID = 9_999_999;

const PAYLOAD = { firstGameId: FIRST_GAME_ID, fromId: ROMA_ID, toId: ROMANI_ID } as const;

describe("encodeReplaceCallback()", () => {
  it("should write a confirm as the screen, the three ids and k", () => {
    expect(encodeReplaceCallback(PAYLOAD, ActionKind.Confirm)).toBe("r:12:7:3:k");
  });

  it("should write a cancel with x", () => {
    expect(encodeReplaceCallback(PAYLOAD, ActionKind.Cancel)).toBe("r:12:7:3:x");
  });

  it("should keep every digit of each id, not just the first", () => {
    expect(
      encodeReplaceCallback(
        { firstGameId: TWO_DIGIT_GAME, fromId: TWO_DIGIT_FROM, toId: TWO_DIGIT_TO },
        ActionKind.Confirm
      )
    ).toBe("r:34:56:78:k");
  });

  it("should stay inside the Bot API's budget with the widest ids", () => {
    const data = encodeReplaceCallback(
      { firstGameId: WIDEST_ID, fromId: WIDEST_ID, toId: WIDEST_ID },
      ActionKind.Confirm
    );

    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT);
  });
});

describe("decodeReplaceCallback()", () => {
  it("should read a confirm back as it was written", () => {
    expect(decodeReplaceCallback(encodeReplaceCallback(PAYLOAD, ActionKind.Confirm))).toEqual({
      payload: PAYLOAD,
      action: ActionKind.Confirm,
    });
  });

  it("should read a cancel back as it was written", () => {
    expect(decodeReplaceCallback(encodeReplaceCallback(PAYLOAD, ActionKind.Cancel))).toEqual({
      payload: PAYLOAD,
      action: ActionKind.Cancel,
    });
  });

  it("should read every digit of a multi-digit id back", () => {
    expect(decodeReplaceCallback("r:34:56:78:x")).toEqual({
      payload: { firstGameId: TWO_DIGIT_GAME, fromId: TWO_DIGIT_FROM, toId: TWO_DIGIT_TO },
      action: ActionKind.Cancel,
    });
  });

  it("should refuse the merge screen's data", () => {
    expect(decodeReplaceCallback("m:12:p:3")).toBeNull();
  });

  it("should refuse an action code it does not know", () => {
    expect(decodeReplaceCallback("r:1:2:3:z")).toBeNull();
  });

  it("should refuse an empty string", () => {
    expect(decodeReplaceCallback("")).toBeNull();
  });

  it("should refuse data with anything after it", () => {
    expect(decodeReplaceCallback("r:1:2:3:k and more")).toBeNull();
  });

  it("should refuse data with anything before it", () => {
    expect(decodeReplaceCallback("before r:1:2:3:k")).toBeNull();
  });

  it("should refuse data missing an id", () => {
    expect(decodeReplaceCallback("r:1:2:k")).toBeNull();
  });
});

describe("REPLACE_TAPS", () => {
  it("should match what the codec writes", () => {
    expect(REPLACE_TAPS.test(encodeReplaceCallback(PAYLOAD, ActionKind.Cancel))).toBe(true);
  });

  it("should not match the live card's data", () => {
    expect(REPLACE_TAPS.test("12:p:0:3")).toBe(false);
  });
});

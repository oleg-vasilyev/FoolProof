import { describe, expect, it } from "vitest";
import { controlRow } from "#shared/telegram/control-row.ts";
import type { InlineButton } from "#shared/telegram/inline-keyboard.ts";


const CANCEL: InlineButton = { text: "cancel caption", callback_data: "cancel-data" };

const BACK: InlineButton = { text: "back caption", callback_data: "back-data" };

const WAY_ON: InlineButton = { text: "way on caption", callback_data: "way-on-data" };

const NOTHING_TO_UNDO = false;

const SOMETHING_TO_UNDO = true;

const FIRST_SLOT = 0;

const LAST_SLOT = -1;

const ALONE = 1;

const A_WAY_OUT_AND_A_WAY_ON = 2;

const rowWith = (wayOn: InlineButton | null, anythingToUndo: boolean) =>
  controlRow({ cancel: CANCEL, back: BACK, wayOn, anythingToUndo });

describe("controlRow()", () => {
  describe("the way off the screen", () => {
    it("should offer Cancel while there is nothing to undo", () => {
      expect(rowWith(null, NOTHING_TO_UNDO)).toEqual([CANCEL]);
    });

    it("should offer Back instead once something can be undone", () => {
      expect(rowWith(null, SOMETHING_TO_UNDO)).toEqual([BACK]);
    });

    it("should never draw both, so nothing asks which of two closes the screen", () => {
      expect(rowWith(WAY_ON, NOTHING_TO_UNDO)).not.toContain(BACK);
    });

    it("should keep the way off the screen in the first slot, whichever it is", () => {
      expect([
        rowWith(WAY_ON, NOTHING_TO_UNDO)[FIRST_SLOT],
        rowWith(WAY_ON, SOMETHING_TO_UNDO)[FIRST_SLOT],
      ]).toEqual([CANCEL, BACK]);
    });
  });

  describe("the way on", () => {
    it("should draw nothing beside the way out while the screen cannot be committed", () => {
      expect(rowWith(null, SOMETHING_TO_UNDO)).toHaveLength(ALONE);
    });

    it("should put the way on last, so it sits where the thumb expects it", () => {
      expect(rowWith(WAY_ON, SOMETHING_TO_UNDO).at(LAST_SLOT)).toEqual(WAY_ON);
    });

    it("should sit beside Cancel too, not only beside Back", () => {
      expect(rowWith(WAY_ON, NOTHING_TO_UNDO)).toEqual([CANCEL, WAY_ON]);
    });

    it("should leave the row at two buttons, since a row is never anything else", () => {
      expect(rowWith(WAY_ON, SOMETHING_TO_UNDO)).toHaveLength(A_WAY_OUT_AND_A_WAY_ON);
    });
  });
});

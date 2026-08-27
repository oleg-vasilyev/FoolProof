import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionKind, Role } from "#merge-names/domain/merge-states.ts";
import type { Candidate } from "#merge-names/domain/merge-selection.ts";
import { copy } from "#merge-names/copy.en.ts";
import { ControlRowStub } from "#shared/telegram/control-row.stub.ts";


const MIN_TO_MERGE = 2;

const roleOfSpy = vi.fn();

const encodeMergeCallbackSpy = vi.fn();

const controls = new ControlRowStub();

vi.mock("#merge-names/domain/merge-selection.ts", () => ({
  MIN_TO_MERGE,
  roleOf: (selection: unknown, playerId: unknown) => roleOfSpy(selection, playerId),
}));

vi.mock("#merge-names/render/merge-callback-codec.ts", () => ({
  encodeMergeCallback: (payload: unknown) => encodeMergeCallbackSpy(payload),
}));

vi.mock("#shared/telegram/control-row.ts", () => controls.module);

const { renderMergeKeyboard } = await import("#merge-names/render/merge-keyboard.ts");

const ANYA_ID = 12;

const ANNA_ID = 7;

const TWELVE_GAMES = 12;

const ONE_GAME = 1;

const ENCODED = "the-callback-data";

const ONE_ROW = 1;

const FIRST_CALL = 0;

const ONLY_ARGUMENT = 0;

const LAST_ROW = -1;

const NOTHING_TO_UNDO = false;

const SOMETHING_TO_UNDO = true;

const THE_CONTROLS = [{ text: "the control row", callback_data: "controls" }];

const candidate = (playerId: number, displayName: string, games: number): Candidate => ({
  playerId,
  displayName,
  games,
});

const ROSTER = [
  candidate(ANYA_ID, "Аня", TWELVE_GAMES),
  candidate(ANNA_ID, "Анна", ONE_GAME),
];

const everyRole = (role: Role): void => {
  roleOfSpy.mockReturnValue(role);
};

const captions = (selection: readonly number[]): readonly string[] =>
  renderMergeKeyboard(copy, ROSTER, selection)
    .flat()
    .map((button) => button.text);

const handedOver = (selection: readonly number[]) => {
  renderMergeKeyboard(copy, ROSTER, selection);

  return controls.controlRowSpy.mock.calls[FIRST_CALL]?.[ONLY_ARGUMENT];
};

describe("renderMergeKeyboard(copy, )", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    everyRole("free");
    encodeMergeCallbackSpy.mockReturnValue(ENCODED);
    controls.controlRowSpy.mockReturnValue(THE_CONTROLS);
  });

  describe("the names", () => {
    it("should give every player a row of their own", () => {
      expect(renderMergeKeyboard(copy, ROSTER, [])).toHaveLength(ROSTER.length + ONE_ROW);
    });

    it("should put the name and its games on the button", () => {
      expect(captions([])).toContain(copy.candidate("Аня", TWELVE_GAMES));
    });

    it("should ask the domain what part each name is playing", () => {
      renderMergeKeyboard(copy, ROSTER, [ANYA_ID]);

      expect(roleOfSpy).toHaveBeenCalledWith([ANYA_ID], ANNA_ID);
    });

    it("should mark the keeper", () => {
      everyRole("keeper");

      expect(captions([ANYA_ID])[0]).toContain(copy.markKeeper);
    });

    it("should mark a name being folded in", () => {
      everyRole("absorbed");

      expect(captions([ANYA_ID, ANNA_ID])[0]).toContain(copy.markAbsorbed);
    });

    it("should leave an unpicked name unmarked", () => {
      expect(captions([])[0]).toBe(copy.candidate("Аня", TWELVE_GAMES));
    });

    it("should carry the tapped name in the button's data", () => {
      renderMergeKeyboard(copy, ROSTER, [ANYA_ID]);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [ANYA_ID],
        action: { kind: ActionKind.Pick, playerId: ANNA_ID },
      });
    });

    it("should leave a name unescaped, because Telegram shows a caption as typed", () => {
      const named = [candidate(ANYA_ID, "A & B", ONE_GAME)];

      expect(renderMergeKeyboard(copy, named, [])[0]?.[0]?.text).toContain("A & B");
    });
  });

  describe("the controls", () => {
    it("should say there is nothing to undo while no name is picked", () => {
      expect(handedOver([])?.anythingToUndo).toBe(NOTHING_TO_UNDO);
    });

    it("should say there is something to undo once a name is picked", () => {
      expect(handedOver([ANYA_ID])?.anythingToUndo).toBe(SOMETHING_TO_UNDO);
    });

    it("should withhold the way on until there is a merge to make", () => {
      expect(handedOver([ANYA_ID])?.commit).toBeNull();
    });

    it("should offer Confirm as the way on once two names are picked", () => {
      expect(handedOver([ANYA_ID, ANNA_ID])?.commit).toEqual({
        text: copy.buttonConfirm,
        callback_data: ENCODED,
      });
    });

    it("should hand over a Cancel carrying an action with no name", () => {
      expect(handedOver([])?.cancel).toEqual({ text: copy.buttonCancel, callback_data: ENCODED });
    });

    it("should hand over a Back carrying the same caption the table names", () => {
      expect(handedOver([ANYA_ID])?.back).toEqual({
        text: copy.buttonBack,
        callback_data: ENCODED,
      });
    });

    it("should draw the row the shared builder returned, rather than one of its own", () => {
      expect(renderMergeKeyboard(copy, ROSTER, []).at(LAST_ROW)).toEqual(THE_CONTROLS);
    });

    it("should send cancel to the codec as an action with no name", () => {
      renderMergeKeyboard(copy, ROSTER, []);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [],
        action: { kind: ActionKind.Cancel },
      });
    });

    it("should send back to the codec with the selection it would undo", () => {
      renderMergeKeyboard(copy, ROSTER, [ANYA_ID]);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [ANYA_ID],
        action: { kind: ActionKind.Back },
      });
    });

    it("should send confirm to the codec with the whole selection", () => {
      renderMergeKeyboard(copy, ROSTER, [ANYA_ID, ANNA_ID]);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [ANYA_ID, ANNA_ID],
        action: { kind: ActionKind.Confirm },
      });
    });
  });
});

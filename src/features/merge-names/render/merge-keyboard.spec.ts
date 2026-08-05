import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Candidate } from "#merge-names/domain/merge-selection.ts";
import type { Role } from "#merge-names/domain/merge-states.ts";
import { copy } from "#merge-names/copy.en.ts";


const MIN_TO_MERGE = 2;

const roleOfSpy = vi.fn();

const encodeMergeCallbackSpy = vi.fn();

vi.mock("#merge-names/domain/merge-selection.ts", () => ({
  MIN_TO_MERGE,
  roleOf: (selection: unknown, playerId: unknown) => roleOfSpy(selection, playerId),
}));

vi.mock("#merge-names/render/merge-callback-codec.ts", () => ({
  encodeMergeCallback: (payload: unknown) => encodeMergeCallbackSpy(payload),
}));

const { renderMergeKeyboard } = await import("#merge-names/render/merge-keyboard.ts");

const ANYA_ID = 12;

const ANNA_ID = 7;

const TWELVE_GAMES = 12;

const ONE_GAME = 1;

const ENCODED = "the-callback-data";

const ONE_ROW = 1;

const TWO_BUTTONS = 2;

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
  renderMergeKeyboard(ROSTER, selection)
    .flat()
    .map((button) => button.text);

const controlRow = (selection: readonly number[]) => {
  const rows = renderMergeKeyboard(ROSTER, selection);

  return rows[rows.length - ONE_ROW] ?? [];
};

describe("renderMergeKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    everyRole("free");
    encodeMergeCallbackSpy.mockReturnValue(ENCODED);
  });

  describe("the names", () => {
    it("should give every player a row of their own", () => {
      expect(renderMergeKeyboard(ROSTER, [])).toHaveLength(ROSTER.length + ONE_ROW);
    });

    it("should put the name and its games on the button", () => {
      expect(captions([])).toContain(copy.candidate("Аня", TWELVE_GAMES));
    });

    it("should ask the domain what part each name is playing", () => {
      renderMergeKeyboard(ROSTER, [ANYA_ID]);

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
      renderMergeKeyboard(ROSTER, [ANYA_ID]);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [ANYA_ID],
        action: { kind: "pick", playerId: ANNA_ID },
      });
    });

    it("should leave a name unescaped, because Telegram shows a caption as typed", () => {
      const named = [candidate(ANYA_ID, "A & B", ONE_GAME)];

      expect(renderMergeKeyboard(named, [])[0]?.[0]?.text).toContain("A & B");
    });
  });

  describe("the controls", () => {
    it("should offer cancel while nothing is picked", () => {
      expect(controlRow([]).map((button) => button.text)).toEqual([copy.buttonCancel]);
    });

    it("should offer back instead once a name is picked", () => {
      expect(controlRow([ANYA_ID]).map((button) => button.text)).toEqual([copy.buttonBack]);
    });

    it("should withhold confirm until there is a merge to make", () => {
      expect(controlRow([ANYA_ID])).toHaveLength(ONE_ROW);
    });

    it("should offer confirm once two names are picked", () => {
      expect(controlRow([ANYA_ID, ANNA_ID]).map((button) => button.text)).toEqual([
        copy.buttonBack,
        copy.buttonConfirm,
      ]);
    });

    it("should keep both controls on one row", () => {
      expect(controlRow([ANYA_ID, ANNA_ID])).toHaveLength(TWO_BUTTONS);
    });

    it("should send cancel to the codec as an action with no name", () => {
      renderMergeKeyboard(ROSTER, []);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [],
        action: { kind: "cancel" },
      });
    });

    it("should send back to the codec with the selection it would undo", () => {
      renderMergeKeyboard(ROSTER, [ANYA_ID]);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [ANYA_ID],
        action: { kind: "back" },
      });
    });

    it("should send confirm to the codec with the whole selection", () => {
      renderMergeKeyboard(ROSTER, [ANYA_ID, ANNA_ID]);

      expect(encodeMergeCallbackSpy).toHaveBeenCalledWith({
        selection: [ANYA_ID, ANNA_ID],
        action: { kind: "confirm" },
      });
    });
  });
});

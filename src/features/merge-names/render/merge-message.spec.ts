import { beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlEscapeStub } from "#shared/text/html-escape.stub.ts";
import type { Candidate } from "#merge-names/domain/merge-selection.ts";
import { copy } from "#merge-names/copy.en.ts";


const escaper = new HtmlEscapeStub();

const chosenSpy = vi.fn();

const gamesAfterMergeSpy = vi.fn();

const gameTallySpy = vi.fn();

vi.mock("#shared/text/html-escape.ts", () => escaper.module);

vi.mock("#merge-names/domain/merge-selection.ts", () => ({
  chosen: (roster: unknown, selection: unknown) => chosenSpy(roster, selection),
  gamesAfterMerge: (keeper: unknown, absorbed: unknown) => gamesAfterMergeSpy(keeper, absorbed),
}));

vi.mock("#merge-names/render/game-tally.ts", () => ({
  gameTally: (table: unknown, games: unknown) => gameTallySpy(table, games),
}));

const { joinedNames, renderCancelled, renderMerged, renderMergeScreen } = await import(
  "#merge-names/render/merge-message.ts"
);

const ROSTER = [{ marker: "the-roster" }] as unknown as readonly Candidate[];

const SELECTION = [1, 2];

const GAMES_AFTER = 13;

const TALLY = "13 games";

const ESCAPED = "escaped";

const candidate = (displayName: string): Candidate => ({ playerId: 1, displayName, games: 0 });

const ANYA = candidate("Аня");

const ANNA = candidate("Анна");

const ANYUTA = candidate("Анюта");

describe("merge-message", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    escaper.escapeHtmlSpy.mockReturnValue(ESCAPED);
    chosenSpy.mockReturnValue([]);
    gamesAfterMergeSpy.mockReturnValue(GAMES_AFTER);
    gameTallySpy.mockReturnValue(TALLY);
  });

  describe("renderMergeScreen(copy, )", () => {
    it("should open with the header", () => {
      expect(renderMergeScreen(copy, ROSTER, SELECTION)).toContain(copy.header);
    });

    it("should ask for the keeper while nothing is picked", () => {
      expect(renderMergeScreen(copy, ROSTER, SELECTION)).toContain(copy.askKeeper);
    });

    it("should read the selection through the domain, not the roster order", () => {
      renderMergeScreen(copy, ROSTER, SELECTION);

      expect(chosenSpy).toHaveBeenCalledWith(ROSTER, SELECTION);
    });

    it("should say the keeper is settled once one name is picked", () => {
      chosenSpy.mockReturnValue([ANYA]);

      expect(renderMergeScreen(copy, ROSTER, SELECTION)).toContain(copy.keeperChosen(ESCAPED));
    });

    it("should read as a sentence once there is something to fold in", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA]);

      expect(renderMergeScreen(copy, ROSTER, SELECTION)).toContain(copy.plan(ESCAPED, ESCAPED));
    });

    it("should list every absorbed name", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA, ANYUTA]);
      escaper.escapeHtmlSpy.mockImplementation((value) => `<${value}>`);

      expect(renderMergeScreen(copy, ROSTER, SELECTION)).toContain("<Анна>, <Анюта>");
    });

    it("should put the sentence and the promise on lines of their own", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA]);

      expect(renderMergeScreen(copy, ROSTER, SELECTION).split("\n")).toEqual([
        copy.header,
        copy.plan(ESCAPED, ESCAPED),
        copy.willHave(ESCAPED, TALLY),
      ]);
    });

    it("should promise the keeper's total after the merge", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA]);

      expect(renderMergeScreen(copy, ROSTER, SELECTION)).toContain(copy.willHave(ESCAPED, TALLY));
    });

    it("should count that total from the picked names, not the whole roster", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA]);

      renderMergeScreen(copy, ROSTER, SELECTION);

      expect(gamesAfterMergeSpy).toHaveBeenCalledWith(ANYA, [ANNA]);
    });

    it("should put that total into words rather than a bare number", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA]);

      renderMergeScreen(copy, ROSTER, SELECTION);

      expect(gameTallySpy).toHaveBeenCalledWith(copy, GAMES_AFTER);
    });

    it("should take every name through the escaper", () => {
      chosenSpy.mockReturnValue([ANYA, ANNA]);

      renderMergeScreen(copy, ROSTER, SELECTION);

      expect(escaper.escapeHtmlSpy).toHaveBeenCalledWith("Анна");
    });
  });

  describe("renderMerged(copy, )", () => {
    it("should keep the sentence that was confirmed", () => {
      expect(renderMerged(copy, ANYA, [ANNA])).toContain(copy.plan(ESCAPED, ESCAPED));
    });

    it("should report the total as done rather than promised", () => {
      expect(renderMerged(copy, ANYA, [ANNA])).toContain(copy.nowHas(ESCAPED, TALLY));
    });

    it("should not ask for anything more", () => {
      expect(renderMerged(copy, ANYA, [ANNA])).not.toContain(copy.askKeeper);
    });

    it("should keep its three lines apart", () => {
      expect(renderMerged(copy, ANYA, [ANNA]).split("\n")).toEqual([
        copy.header,
        copy.plan(ESCAPED, ESCAPED),
        copy.nowHas(ESCAPED, TALLY),
      ]);
    });
  });

  describe("renderCancelled(copy)", () => {
    it("should say nothing was merged", () => {
      expect(renderCancelled(copy)).toContain(copy.cancelledBody);
    });

    it("should keep the header, so the message still says what it was", () => {
      expect(renderCancelled(copy)).toContain(copy.header);
    });
  });

  describe("joinedNames()", () => {
    it("should list the names as they were picked", () => {
      expect(joinedNames(copy, [ANYA, ANNA])).toBe(`Аня${copy.beforeLastName}Анна`);
    });

    it("should leave a name unescaped, because an alert is not HTML", () => {
      joinedNames(copy, [ANYA]);

      expect(escaper.escapeHtmlSpy).not.toHaveBeenCalled();
    });
  });
});

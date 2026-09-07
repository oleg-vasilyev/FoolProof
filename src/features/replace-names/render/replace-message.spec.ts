import { beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlEscapeStub } from "#shared/text/html-escape.stub.ts";
import type { Replacement } from "#replace-names/domain/replace-plan.ts";
import { copy } from "#replace-names/copy.en.ts";


const escaper = new HtmlEscapeStub();

const countedSpy = vi.fn();

const eveningDateSpy = vi.fn();

vi.mock("#shared/text/html-escape.ts", () => escaper.module);

vi.mock("#shared/locale/plural-rules.ts", () => ({
  counted: (locale: unknown, count: unknown, forms: unknown) => countedSpy(locale, count, forms),
}));

vi.mock("#replace-names/render/evening-date.ts", () => ({
  eveningDate: (table: unknown, isoDate: unknown) => eveningDateSpy(table, isoDate),
}));

const { renderCancelled, renderProposal, renderReplaced } = await import(
  "#replace-names/render/replace-message.ts"
);

const ROMA_ID = 7;

const ROMANI_ID = 3;

const ROMA_GAMES = 13;

const STARTED_ON = "2026-09-04";

const TALLY = "the-tally";

const DATE = "the-date";

const ESCAPED = "escaped";

const THREE_LINES = 3;

const FOUR_LINES = 4;

const TWO_NAMES = 2;

const planFor = (arrivingId: number | null): Replacement => ({
  evening: { startedOn: STARTED_ON, firstGameId: 1, gameIds: [1, 2], players: [] },
  leaving: { playerId: ROMA_ID, displayName: "Roma", games: ROMA_GAMES },
  arriving: { playerId: arrivingId, displayName: "Romani" },
});

const KNOWN_ARRIVAL = planFor(ROMANI_ID);

const NEW_ARRIVAL = planFor(null);

describe("replace-message", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    escaper.escapeHtmlSpy.mockReturnValue(ESCAPED);
    countedSpy.mockReturnValue(TALLY);
    eveningDateSpy.mockReturnValue(DATE);
  });

  describe("renderProposal(copy, )", () => {
    it("should put the header, the plan and the promise on lines of their own", () => {
      expect(renderProposal(copy, KNOWN_ARRIVAL).split("\n")).toEqual([
        copy.header,
        copy.plan(ESCAPED, ESCAPED),
        copy.willRewrite(TALLY, DATE),
      ]);
    });

    it("should add a fourth line warning about a name nobody has played under", () => {
      expect(renderProposal(copy, NEW_ARRIVAL).split("\n")).toEqual([
        copy.header,
        copy.plan(ESCAPED, ESCAPED),
        copy.willRewrite(TALLY, DATE),
        copy.newName(ESCAPED),
      ]);
    });

    it("should say nothing about a new name when the arrival is already known", () => {
      expect(renderProposal(copy, KNOWN_ARRIVAL).split("\n")).toHaveLength(THREE_LINES);
    });

    it("should say the new name once, on its own line", () => {
      expect(renderProposal(copy, NEW_ARRIVAL).split("\n")).toHaveLength(FOUR_LINES);
    });

    it("should write the leaving name first and the arriving name second", () => {
      escaper.escapeHtmlSpy.mockImplementation((value) => `<${value}>`);

      expect(renderProposal(copy, KNOWN_ARRIVAL)).toContain(copy.plan("<Roma>", "<Romani>"));
    });

    it("should take the leaving name through the escaper", () => {
      renderProposal(copy, KNOWN_ARRIVAL);

      expect(escaper.escapeHtmlSpy).toHaveBeenCalledWith("Roma");
    });

    it("should take the arriving name through the escaper", () => {
      renderProposal(copy, KNOWN_ARRIVAL);

      expect(escaper.escapeHtmlSpy).toHaveBeenCalledWith("Romani");
    });

    it("should count the leaving player's games in the chat's language with the game noun", () => {
      renderProposal(copy, KNOWN_ARRIVAL);

      expect(countedSpy).toHaveBeenCalledWith(copy.locale, ROMA_GAMES, copy.gameForms);
    });

    it("should date the promise by the evening it rewrites", () => {
      renderProposal(copy, KNOWN_ARRIVAL);

      expect(eveningDateSpy).toHaveBeenCalledWith(copy, STARTED_ON);
    });

    it("should put the tally before the date in the promise", () => {
      countedSpy.mockReturnValue("A_TALLY");
      eveningDateSpy.mockReturnValue("A_DATE");

      expect(renderProposal(copy, KNOWN_ARRIVAL)).toContain(copy.willRewrite("A_TALLY", "A_DATE"));
    });
  });

  describe("renderReplaced(copy, )", () => {
    it("should keep the header, the plan and the report on lines of their own", () => {
      expect(renderReplaced(copy, KNOWN_ARRIVAL).split("\n")).toEqual([
        copy.header,
        copy.plan(ESCAPED, ESCAPED),
        copy.rewritten(TALLY, DATE),
      ]);
    });

    it("should not warn about a new name once the replacement is done", () => {
      expect(renderReplaced(copy, NEW_ARRIVAL).split("\n")).toHaveLength(THREE_LINES);
    });

    it("should write the leaving name first and the arriving name second", () => {
      escaper.escapeHtmlSpy.mockImplementation((value) => `<${value}>`);

      expect(renderReplaced(copy, KNOWN_ARRIVAL)).toContain(copy.plan("<Roma>", "<Romani>"));
    });

    it("should take both names through the escaper", () => {
      renderReplaced(copy, KNOWN_ARRIVAL);

      expect(escaper.escapeHtmlSpy).toHaveBeenCalledWith("Roma");
      expect(escaper.escapeHtmlSpy).toHaveBeenCalledWith("Romani");
    });

    it("should count the leaving player's games in the chat's language with the game noun", () => {
      renderReplaced(copy, KNOWN_ARRIVAL);

      expect(countedSpy).toHaveBeenCalledWith(copy.locale, ROMA_GAMES, copy.gameForms);
    });

    it("should date the report by the evening it rewrote", () => {
      renderReplaced(copy, KNOWN_ARRIVAL);

      expect(eveningDateSpy).toHaveBeenCalledWith(copy, STARTED_ON);
    });

    it("should put the tally before the date in the report", () => {
      countedSpy.mockReturnValue("A_TALLY");
      eveningDateSpy.mockReturnValue("A_DATE");

      expect(renderReplaced(copy, KNOWN_ARRIVAL)).toContain(copy.rewritten("A_TALLY", "A_DATE"));
    });
  });

  describe("renderCancelled(copy)", () => {
    it("should keep the header and say nothing was replaced", () => {
      expect(renderCancelled(copy).split("\n")).toEqual([copy.header, copy.cancelledBody]);
    });

    it("should escape nothing, because it names nobody", () => {
      renderCancelled(copy);

      expect(escaper.escapeHtmlSpy).not.toHaveBeenCalled();
    });

    it("should ask for no tally and no date", () => {
      renderCancelled(copy);

      expect(countedSpy).not.toHaveBeenCalled();
      expect(eveningDateSpy).not.toHaveBeenCalled();
    });
  });

  describe("the escaper's reach", () => {
    it("should escape the two names and nothing else in a known arrival", () => {
      renderProposal(copy, KNOWN_ARRIVAL);

      expect(escaper.escapeHtmlSpy).toHaveBeenCalledTimes(TWO_NAMES);
    });
  });
});

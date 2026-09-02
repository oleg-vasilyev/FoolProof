import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Drawing } from "#shared/drawings/drawings-contract.ts";


const reportOnTheNewestEveningSpy = vi.fn();

const contactSheetSpy = vi.fn();

const gallerySpy = vi.fn();

const postersSpy = vi.fn();

vi.mock("#scoresheet/bot/evening-report.ts", () => ({
  reportOnTheNewestEvening: (chatId: number) => reportOnTheNewestEveningSpy(chatId),
}));

vi.mock("#scoresheet/samples/contact-sheet.ts", () => ({
  contactSheet: (title: string, drawings: readonly Drawing[]) => contactSheetSpy(title, drawings),
}));

vi.mock("#scoresheet/samples/gallery-edges.ts", () => ({
  gallery: () => gallerySpy() as readonly Drawing[],
}));

vi.mock("#scoresheet/samples/site-set.ts", () => ({
  posters: () => postersSpy() as Readonly<Record<string, string>>,
}));

const { drawings } = await import("#scoresheet/scoresheet-drawings.ts");

const A_CHAT = -100_500;

const AN_EDGE: Drawing = { file: "two-players", asks: "the narrowest table", svg: "<svg>edge</svg>" };

const FIRST = 0;

const SAYS_NOTHING = 0;

const LAST = -1;

const TITLE_GIVEN = 0;

const DRAWINGS_GIVEN = 1;

describe("what the scoresheet offers to be drawn", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    gallerySpy.mockReturnValue([AN_EDGE]);
    postersSpy.mockReturnValue({ "chronology-en": "<svg>a</svg>", "chronology-ru": "<svg>b</svg>" });
    contactSheetSpy.mockReturnValue("<svg>sheet</svg>");
    reportOnTheNewestEveningSpy.mockReturnValue(["one line", "another"]);
  });

  describe("posters", () => {
    it("should offer every poster under the file it is written to, locale and all", () => {
      expect(drawings.posters().map((drawing) => [drawing.file, drawing.svg])).toEqual([
        ["chronology-en", "<svg>a</svg>"],
        ["chronology-ru", "<svg>b</svg>"],
      ]);
    });

    it("should say what every one of them is, since the gallery prints that line", () => {
      expect(
        drawings.posters().filter((drawing) => drawing.asks.trim().length > SAYS_NOTHING)
      ).toHaveLength(drawings.posters().length);
    });

  });

  describe("gallery", () => {
    it("should keep every edge, and add one sheet showing all of them together", () => {
      const drawn = drawings.gallery();

      expect(drawn[FIRST]).toEqual(AN_EDGE);
      expect(drawn.at(LAST)?.file).toBe("contact-sheet");
      expect(drawn.at(LAST)?.svg).toBe("<svg>sheet</svg>");
      expect(drawn.at(LAST)?.asks.trim().length).toBeGreaterThan(SAYS_NOTHING);
    });

    it("should build that sheet from the edges themselves, under a title naming the bot", () => {
      drawings.gallery();

      expect(contactSheetSpy.mock.calls[FIRST]?.[DRAWINGS_GIVEN]).toEqual([AN_EDGE]);
      expect(contactSheetSpy.mock.calls[FIRST]?.[TITLE_GIVEN]).toContain("FoolProof");
    });
  });

  describe("the evening tool", () => {
    it("should read the chat it was asked about", () => {
      expect(drawings.tools.evening?.say(["evening", String(A_CHAT)])).toEqual([
        "one line",
        "another",
      ]);
      expect(reportOnTheNewestEveningSpy).toHaveBeenCalledWith(A_CHAT);
    });

    it("should refuse to run with no chat id rather than reading somebody else's", () => {
      expect(() => drawings.tools.evening?.say(["evening"])).toThrow(/chat id/);
    });

    it("should refuse anything that is not a chat id", () => {
      expect(() => drawings.tools.evening?.say(["evening", "-100abc"])).toThrow(/chat id/);
      expect(reportOnTheNewestEveningSpy).not.toHaveBeenCalled();
    });

    it("should say how it is run, so the tool list can print it", () => {
      expect(drawings.tools.evening?.usage).toContain("evening");
      expect(drawings.tools.evening?.does.length).toBeGreaterThan(SAYS_NOTHING);
    });
  });
});

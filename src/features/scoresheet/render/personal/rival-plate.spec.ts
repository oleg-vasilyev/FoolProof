import { beforeEach, describe, expect, it, vi } from "vitest";
import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  PLATE_HEIGHT,
  PLATE_INDENT,
  PLATE_NAME_DROP,
  PLATE_REASON_DROP,
  PLATE_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { Rival } from "#scoresheet/domain/career/career-rival.ts";


const rectSpy = vi.fn();

const textSpy = vi.fn();

const timeTallySpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  timeTally: (table: unknown, times: number) => timeTallySpy(table, times),
}));

const { rivalPlate } = await import("#scoresheet/render/personal/rival-plate.ts");

const ONCE = 1;

const PLATE_LINES = 4;

const TOP = 1800;

const RIVAL_ID = 3;

const DUELS = 9;

const LOST = 6;

const RIVAL_NAME = "Anna";

const SUBJECT = "Oleg";

const RIVAL: Rival = {
  playerId: RIVAL_ID,
  displayName: RIVAL_NAME,
  duels: DUELS,
  lost: LOST,
};

const DUEL_TALLY_MARK = "the-duels";

const REASON = copy.rivalReason(DUEL_TALLY_MARK, LOST, SUBJECT);

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("rivalPlate()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    timeTallySpy.mockReturnValue(DUEL_TALLY_MARK);
    rectSpy.mockImplementation(() => "<plate/>");
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  describe("what the plate holds", () => {
    it("should lay the plate down before anything written on it", () => {
      expect(rivalPlate(copy, RIVAL, SUBJECT, TOP)[0]).toBe("<plate/>");
    });

    it("should write a title, a name and a reason on it and nothing else", () => {
      expect(rivalPlate(copy, RIVAL, SUBJECT, TOP)).toHaveLength(PLATE_LINES);
      expect(textSpy).toHaveBeenCalledTimes(PLATE_LINES - ONCE);
    });

    it("should title the plate from the copy table", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(textSpy).toHaveBeenCalledWith(copy.rivalTitle, expect.anything());
    });

    it("should name the rival, not the player whose card this is", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(textSpy).toHaveBeenCalledWith(RIVAL_NAME, expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith(SUBJECT, expect.anything());
    });

    it("should count the duels through the tally, and blame the losses on the subject", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(timeTallySpy).toHaveBeenCalledWith(copy, DUELS);
      expect(timeTallySpy).toHaveBeenCalledTimes(ONCE);
      expect(textSpy).toHaveBeenCalledWith(REASON, expect.anything());
    });

    it("should count the duels rather than the ones lost", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(timeTallySpy).not.toHaveBeenCalledWith(copy, LOST);
    });

    it("should keep the title, the name and the reason on three lines of their own", () => {
      const drawn = rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(drawn.indexOf(`<text:${copy.rivalTitle}>`)).toBeLessThan(
        drawn.indexOf(`<text:${RIVAL_NAME}>`)
      );
      expect(drawn.indexOf(`<text:${RIVAL_NAME}>`)).toBeLessThan(drawn.indexOf(`<text:${REASON}>`));
    });
  });

  describe("where the plate sits", () => {
    it("should start the plate at the top it was given", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x: PAD, y: TOP, height: PLATE_HEIGHT })
      );
    });

    it("should run the plate from the left margin to the card's right edge", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ width: GRID_RIGHT - PAD })
      );
    });

    it("should indent every line from the plate's own left edge", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      for (const value of [copy.rivalTitle, RIVAL_NAME, REASON]) {
        expect(attributesOf(value).x).toBe(PAD + PLATE_INDENT);
      }
    });

    it("should stack the three lines down from the plate's own top", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(attributesOf(copy.rivalTitle).y).toBe(TOP + PLATE_TITLE_DROP);
      expect(attributesOf(RIVAL_NAME).y).toBe(TOP + PLATE_NAME_DROP);
      expect(attributesOf(REASON).y).toBe(TOP + PLATE_REASON_DROP);
    });

    it("should keep all three lines inside the plate", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      for (const value of [copy.rivalTitle, RIVAL_NAME, REASON]) {
        expect(attributesOf(value).y as number).toBeGreaterThan(TOP);
        expect(attributesOf(value).y as number).toBeLessThan(TOP + PLATE_HEIGHT);
      }
    });

    it("should move with the top it is handed", () => {
      const LOWER = 2100;

      rivalPlate(copy, RIVAL, SUBJECT, LOWER);

      expect(attributesOf(RIVAL_NAME).y).toBe(LOWER + PLATE_NAME_DROP);
    });
  });

  describe("how the plate is set", () => {
    it("should paint the plate in the fool's red", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(rectSpy).toHaveBeenCalledWith(expect.objectContaining({ fill: palette.cellFool }));
    });

    it("should set the title and the name in the plate's own ink, bold", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      for (const value of [copy.rivalTitle, RIVAL_NAME]) {
        expect(attributesOf(value).fill).toBe(palette.plateInk);
        expect(attributesOf(value)["font-weight"]).toBe("bold");
        expect(attributesOf(value)["font-family"]).toBe(FONT_FAMILY);
      }
    });

    it("should set the title larger than the name it introduces", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(attributesOf(copy.rivalTitle)["font-size"]).toBe(personalFont.plateTitle);
      expect(attributesOf(RIVAL_NAME)["font-size"]).toBe(personalFont.plateName);
      expect(personalFont.plateTitle).toBeGreaterThan(personalFont.plateName);
    });

    it("should set the reason in the plate's caption ink, unbolded", () => {
      rivalPlate(copy, RIVAL, SUBJECT, TOP);

      expect(attributesOf(REASON).fill).toBe(palette.plateCap);
      expect(attributesOf(REASON)["font-size"]).toBe(personalFont.plateReason);
      expect(attributesOf(REASON)["font-weight"]).toBeUndefined();
    });
  });
});

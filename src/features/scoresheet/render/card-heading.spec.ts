import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";


const textSpy = vi.fn();

const gameTallySpy = vi.fn();

const playerTallySpy = vi.fn();

const FONT_FAMILY = "Test Sans";

const GRID_RIGHT = 1560;

const PAD = 60;

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/session-tally.ts", () => ({
  gameTally: (games: number) => gameTallySpy(games),
  playerTally: (players: number) => playerTallySpy(players),
}));

const fontSize = { eyebrow: 30, title: 126, date: 52, subtitle: 42 };

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY,
  GRID_RIGHT,
  PAD,
  fontSize,
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { ink: "ink", inkMuted: "muted" },
}));

const { EYEBROW_TRACKING, cardHeading } = await import("#scoresheet/render/card-heading.ts");

const GAMES = 12;

const PLAYERS = 5;

const STARTED_ON = "2026-07-24";

const TITLE = "CHRONOLOGY";

const GAME_TALLY_MARK = "G_MARK";

const PLAYER_TALLY_MARK = "P_MARK";

const heading = () => ({ title: TITLE, startedOn: STARTED_ON, games: GAMES, players: PLAYERS });

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("cardHeading()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    gameTallySpy.mockReturnValue(GAME_TALLY_MARK);
    playerTallySpy.mockReturnValue(PLAYER_TALLY_MARK);
  });

  it("should print the given title, not a hardcoded one", () => {
    cardHeading(heading());

    expect(textSpy).toHaveBeenCalledWith(TITLE, expect.anything());
  });

  it("should format the date through copy.sheetDate", () => {
    cardHeading(heading());

    expect(textSpy).toHaveBeenCalledWith(copy.sheetDate(STARTED_ON), expect.anything());
  });

  it("should build the subtitle from the game and player tallies", () => {
    cardHeading(heading());

    expect(gameTallySpy).toHaveBeenCalledWith(GAMES);
    expect(playerTallySpy).toHaveBeenCalledWith(PLAYERS);
    expect(textSpy).toHaveBeenCalledWith(
      copy.sheetSubtitle(GAME_TALLY_MARK, PLAYER_TALLY_MARK),
      expect.anything()
    );
  });

  it("should not build the subtitle by concatenating the raw counts", () => {
    cardHeading(heading());

    expect(textSpy).not.toHaveBeenCalledWith(copy.sheetSubtitle(String(GAMES), String(PLAYERS)), expect.anything());
  });

  it("should anchor the date to the right-hand edge", () => {
    cardHeading(heading());

    expect(attributesOf(copy.sheetDate(STARTED_ON))["text-anchor"]).toBe("end");
  });

  it("should anchor the subtitle to the right-hand edge", () => {
    cardHeading(heading());

    expect(attributesOf(copy.sheetSubtitle(GAME_TALLY_MARK, PLAYER_TALLY_MARK))["text-anchor"]).toBe(
      "end"
    );
  });

  it("should set the eyebrow's own letter-spacing to EYEBROW_TRACKING", () => {
    cardHeading(heading());

    expect(attributesOf(copy.sheetEyebrow)["letter-spacing"]).toBe(EYEBROW_TRACKING);
  });

  it("should build exactly four elements", () => {
    const FOUR = 4;

    expect(cardHeading(heading())).toHaveLength(FOUR);
  });

  it("should set the title in bold, and the eyebrow above it not", () => {
    cardHeading(heading());

    expect(attributesOf(TITLE)["font-weight"]).toBe("bold");
    expect(attributesOf(copy.sheetEyebrow)["font-weight"]).toBeUndefined();
  });

  it("should set the title against the left margin, in the card's own title size", () => {
    cardHeading(heading());

    expect(attributesOf(TITLE).x).toBe(PAD);
    expect(attributesOf(TITLE)["font-size"]).toBe(fontSize.title);
    expect(attributesOf(TITLE)["font-family"]).toBe(FONT_FAMILY);
  });

  it("should hang the title below the eyebrow that introduces it", () => {
    cardHeading(heading());

    expect(attributesOf(TITLE).y as number).toBeGreaterThan(
      attributesOf(copy.sheetEyebrow).y as number
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";


const NEUTRAL_MOCK = 0.5;

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  NEUTRAL: NEUTRAL_MOCK,
}));

const A_PLOT_RIGHT = 1000;

const A_NAME_ROOM = 200;

const A_NAME_GAP = 20;

const A_CHART_FLOOR = 800;

vi.mock("#scoresheet/render/chronology/chronology-layout.ts", () => ({
  NAME_ROOM: A_NAME_ROOM,
  NAME_GAP: A_NAME_GAP,
  PLOT_RIGHT: A_PLOT_RIGHT,
  chartBottomOf: () => A_CHART_FLOOR,
}));

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY: "Test Sans",
  USUAL_FALLBACK: 0.6,
  fontSize: { legend: 30 },
}));

const colourForSpy = vi.fn();

vi.mock("#scoresheet/render/palette.ts", () => ({
  colourFor: (column: number) => colourForSpy(column),
}));

const nameToFitSpy = vi.fn();

vi.mock("#scoresheet/render/name-to-fit.ts", () => ({
  nameToFit: (name: string, room: number, size: number, advance: number) =>
    nameToFitSpy(name, room, size, advance),
}));

const textSpy = vi.fn();

const lineSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { endLabels, spreadApart } = await import(
  "#scoresheet/render/chronology/chart-end-labels.ts"
);

const NOTHING = 0;

const ONCE = 1;

const A_PITCH = 40;

const A_FLOOR = 500;

const TOP_OF_THE_PLOT = 100;

const A_SHARE = 0.7;

const ANOTHER_SHARE = 0.3;

const OLEG = 1;

const ANYA = 2;

const A_COLOUR = "oleg-colour";

const ANOTHER_COLOUR = "anya-colour";

const playerOf = (playerId: number, displayName: string, share: number): ScoredPlayer =>
  ({
    playerId,
    displayName,
    cells: [],
    running: [share],
    share,
    games: ONCE,
  }) as ScoredPlayer;

const sheetOf = (...players: readonly ScoredPlayer[]): Sheet =>
  ({ players, played: ONCE }) as unknown as Sheet;

const heightFor = (_sheet: Sheet, share: number): number => A_CHART_FLOOR - share * A_CHART_FLOOR;

describe("spreadApart()", () => {
  it("should leave labels that already clear each other where they are", () => {
    const wanted = [TOP_OF_THE_PLOT, TOP_OF_THE_PLOT + A_PITCH * 2];

    expect(spreadApart(wanted, A_PITCH, A_FLOOR)).toEqual(wanted);
  });

  it("should push a label down until it clears the one above it", () => {
    const CROWDED = 5;

    expect(spreadApart([TOP_OF_THE_PLOT, TOP_OF_THE_PLOT + CROWDED], A_PITCH, A_FLOOR)).toEqual([
      TOP_OF_THE_PLOT,
      TOP_OF_THE_PLOT + A_PITCH,
    ]);
  });

  it("should answer in the order it was asked, not in the order it placed", () => {
    const LOWER = 300;

    const spread = spreadApart([LOWER, TOP_OF_THE_PLOT], A_PITCH, A_FLOOR);

    expect(spread[NOTHING]).toBeGreaterThan(spread[ONCE] ?? NOTHING);
  });

  it("should lift the whole stack back inside the plot when it overshoots the floor", () => {
    const AT_THE_FLOOR = A_FLOOR;

    const spread = spreadApart([AT_THE_FLOOR, AT_THE_FLOOR, AT_THE_FLOOR], A_PITCH, A_FLOOR);

    expect(Math.max(...spread)).toBe(A_FLOOR);
    expect(Math.min(...spread)).toBe(A_FLOOR - A_PITCH * 2);
  });
});

describe("endLabels()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    colourForSpy.mockImplementation((column: number) =>
      column === NOTHING ? A_COLOUR : ANOTHER_COLOUR
    );
    nameToFitSpy.mockImplementation((name: string) => `fitted(${name})`);
    textSpy.mockImplementation((value: string) => `<text>${value}</text>`);
    lineSpy.mockImplementation(() => "<line/>");
  });

  it("should name every line at its end", () => {
    endLabels(sheetOf(playerOf(OLEG, "Oleg", A_SHARE), playerOf(ANYA, "Anya", ANOTHER_SHARE)), heightFor);

    expect(textSpy.mock.calls.map((call) => call[NOTHING])).toEqual([
      "fitted(Oleg)",
      "fitted(Anya)",
    ]);
  });

  it("should set each name in the colour of its own line", () => {
    endLabels(sheetOf(playerOf(OLEG, "Oleg", A_SHARE), playerOf(ANYA, "Anya", ANOTHER_SHARE)), heightFor);

    expect(textSpy.mock.calls.map((call) => (call[ONCE] as Record<string, unknown>).fill)).toEqual([
      A_COLOUR,
      ANOTHER_COLOUR,
    ]);
  });

  it("should stand every name clear of the plot's right edge", () => {
    endLabels(sheetOf(playerOf(OLEG, "Oleg", A_SHARE)), heightFor);

    expect((textSpy.mock.calls[NOTHING]?.[ONCE] as Record<string, unknown>).x).toBe(
      A_PLOT_RIGHT + A_NAME_GAP
    );
  });

  it("should trim a name to the room the margin actually leaves", () => {
    endLabels(sheetOf(playerOf(OLEG, "Александра-Константиновна", A_SHARE)), heightFor);

    expect(nameToFitSpy).toHaveBeenCalledWith(
      "Александра-Константиновна",
      A_NAME_ROOM - A_NAME_GAP,
      expect.anything(),
      expect.anything()
    );
  });

  it("should run a leader from the line to a name it had to move", () => {
    endLabels(sheetOf(playerOf(OLEG, "Oleg", A_SHARE), playerOf(ANYA, "Anya", A_SHARE)), heightFor);

    expect(lineSpy).toHaveBeenCalledTimes(ONCE);
    expect((lineSpy.mock.calls[NOTHING]?.[NOTHING] as Record<string, unknown>).stroke).toBe(
      ANOTHER_COLOUR
    );
  });

  it("should leave a name that never moved without a leader", () => {
    endLabels(sheetOf(playerOf(OLEG, "Oleg", A_SHARE)), heightFor);

    expect(lineSpy).not.toHaveBeenCalled();
    expect(textSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should part two names whose lines finish level", () => {
    endLabels(sheetOf(playerOf(OLEG, "Oleg", A_SHARE), playerOf(ANYA, "Anya", A_SHARE)), heightFor);

    const [first, second] = textSpy.mock.calls.map(
      (call) => (call[ONCE] as Record<string, number>).y
    );

    expect(second).toBeGreaterThan(first ?? NOTHING);
  });
});

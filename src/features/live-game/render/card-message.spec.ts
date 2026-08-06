import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";
import { HtmlEscapeStub } from "#shared/text/html-escape.stub.ts";
import type { CardState } from "#live-game/domain/card-state.ts";


const nameAtSpy = vi.fn();

const finalPlacementsSpy = vi.fn();

const remainingSlotsSpy = vi.fn();

const html = new HtmlEscapeStub();

vi.mock("#live-game/domain/card-state.ts", () => ({
  nameAt: (state: unknown, slot: number) => nameAtSpy(state, slot),
  finalPlacements: (state: unknown) => finalPlacementsSpy(state),
  remainingSlots: (state: unknown) => remainingSlotsSpy(state),
}));

vi.mock("#shared/text/html-escape.ts", () => html.module);

const { renderCard, renderResult } = await import("#live-game/render/card-message.ts");

const GAME_NUMBER = 3;

const OLEG = 0;

const ANYA = 1;

const ONE_EXIT = [ANYA];

const TWO_EXITS = [ANYA, 2];

const TWICE = 2;

const stateWith = (over: Partial<CardState>): CardState =>
  ({ seats: [], starterSlot: OLEG, exits: [], drawAccepted: false, ...over }) as CardState;

const linesOf = (rendered: string): readonly string[] => rendered.split("\n");

const namesBySlot = (_state: unknown, slot: number) => `player${slot}`;

const identity = (value: string) => value;

describe("renderCard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    nameAtSpy.mockImplementation(namesBySlot);
    html.escapeHtmlSpy.mockImplementation(identity);
    finalPlacementsSpy.mockReturnValue([]);
    remainingSlotsSpy.mockReturnValue([]);
  });

  it("should ask for the starter before one is picked", () => {
    const rendered = renderCard(copy, stateWith({ starterSlot: null }), GAME_NUMBER);

    expect(linesOf(rendered)).toEqual(["<b>Game 3</b>", "Who went first?"]);
  });

  it("should name nobody before a starter is picked", () => {
    renderCard(copy, stateWith({ starterSlot: null }), GAME_NUMBER);

    expect(nameAtSpy).not.toHaveBeenCalled();
  });

  it("should name the starter once one is picked", () => {
    nameAtSpy.mockReturnValue("Oleg");

    const rendered = renderCard(copy, stateWith({ starterSlot: OLEG }), GAME_NUMBER);

    expect(linesOf(rendered)).toEqual(["<b>Game 3</b>", "Went first: <b>Oleg</b>"]);
  });

  it("should read the name out of the starter's own slot", () => {
    const state = stateWith({ starterSlot: 2 });

    renderCard(copy, state, GAME_NUMBER);

    expect(nameAtSpy).toHaveBeenCalledWith(state, 2);
  });

  it("should stop changing once the starter is picked", () => {
    const early = stateWith({ starterSlot: OLEG, exits: [] });
    const later = stateWith({ starterSlot: OLEG, exits: TWO_EXITS });

    expect(renderCard(copy, later, GAME_NUMBER)).toBe(renderCard(copy, early, GAME_NUMBER));
  });

  it("should never list the standings", () => {
    renderCard(copy, stateWith({ exits: TWO_EXITS }), GAME_NUMBER);

    expect(finalPlacementsSpy).not.toHaveBeenCalled();
  });

  it("should escape the starter's name, since it is user data", () => {
    nameAtSpy.mockReturnValue("Аня & Оля");

    renderCard(copy, stateWith({}), GAME_NUMBER);

    expect(html.escapeHtmlSpy).toHaveBeenCalledWith("Аня & Оля");
  });

  it("should print what the escaper returned, not the raw name", () => {
    html.escapeHtmlSpy.mockReturnValue("ESCAPED");

    expect(renderCard(copy, stateWith({}), GAME_NUMBER)).toContain("ESCAPED");
  });

  it("should carry the game number it was given", () => {
    const rendered = renderCard(copy, stateWith({ starterSlot: null }), 12);

    expect(rendered).toContain("Game 12");
  });
});

describe("renderResult()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    nameAtSpy.mockImplementation(namesBySlot);
    html.escapeHtmlSpy.mockImplementation(identity);
    remainingSlotsSpy.mockReturnValue([]);
  });

  it("should separate the heading from the standings with a blank line", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: OLEG, position: 1 }]);

    const lines = linesOf(renderResult(copy, stateWith({ exits: [] }), GAME_NUMBER));

    expect(lines[2]).toBe("");
  });

  it("should list every placement the reducer produced", () => {
    finalPlacementsSpy.mockReturnValue([
      { slot: 0, position: 1 },
      { slot: 1, position: 2 },
      { slot: 2, position: 3 },
    ]);

    const lines = linesOf(renderResult(copy, stateWith({ exits: TWO_EXITS }), GAME_NUMBER));

    expect(lines.slice(3)).toEqual(["1 · player0", "2 · player1", "3 · <b>player2</b> — fool"]);
  });

  it("should keep the middle places unbolded", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: 0, position: 1 }]);

    const rendered = renderResult(copy, stateWith({ exits: TWO_EXITS }), GAME_NUMBER);

    expect(rendered).toContain("1 · player0");
  });

  it("should mark the last position as the fool when one player holds it", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: ANYA, position: 2 }]);
    remainingSlotsSpy.mockReturnValue([ANYA]);

    const rendered = renderResult(copy, stateWith({ exits: ONE_EXIT }), GAME_NUMBER);

    expect(rendered).toContain("2 · <b>player1</b> — fool");
  });

  it("should mark the last position as a draw when two players share it", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: ANYA, position: 2 }]);
    remainingSlotsSpy.mockReturnValue([ANYA, 2]);

    const rendered = renderResult(copy, stateWith({ exits: ONE_EXIT }), GAME_NUMBER);

    expect(rendered).toContain("2 · <b>player1</b> — draw");
  });

  it("should name no fool once a draw was accepted", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: ANYA, position: 2 }]);
    remainingSlotsSpy.mockReturnValue([ANYA, 2]);

    const rendered = renderResult(copy, stateWith({ exits: ONE_EXIT }), GAME_NUMBER);

    expect(rendered).not.toContain("fool");
  });

  it("should escape every name it prints, not only the starter's", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: ANYA, position: 2 }]);
    nameAtSpy.mockReturnValue("<b>x</b>");

    renderResult(copy, stateWith({ exits: ONE_EXIT }), GAME_NUMBER);

    expect(html.escapeHtmlSpy).toHaveBeenCalledTimes(TWICE);
  });

  it("should print no raw markup a player smuggled into their name", () => {
    finalPlacementsSpy.mockReturnValue([{ slot: ANYA, position: 2 }]);
    nameAtSpy.mockReturnValue("<i>x</i>");
    html.escapeHtmlSpy.mockReturnValue("&lt;i&gt;x&lt;/i&gt;");

    const rendered = renderResult(copy, stateWith({ exits: ONE_EXIT }), GAME_NUMBER);

    expect(rendered).not.toContain("<i>x</i>");
  });

  it("should ask the reducer how many players are still unplaced", () => {
    finalPlacementsSpy.mockReturnValue([]);
    const state = stateWith({ exits: ONE_EXIT });

    renderResult(copy, state, GAME_NUMBER);

    expect(remainingSlotsSpy).toHaveBeenCalledWith(state);
  });
});

import { ActionKind } from "#live-game/domain/card-states.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";


const seatNumberOfSpy = vi.fn();

const encodeSeatingCallbackSpy = vi.fn();

vi.mock("#live-game/domain/seating-plan.ts", () => ({
  seatNumberOf: (plan: unknown, slot: number) => seatNumberOfSpy(plan, slot),
}));

vi.mock("#live-game/render/seating-screen/seating-callback-codec.ts", () => ({
  encodeSeatingCallback: (payload: unknown) => encodeSeatingCallbackSpy(payload),
}));

const { renderSeatingKeyboard } = await import("#live-game/render/seating-screen/seating-keyboard.ts");


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const ROMA = { playerId: 12, displayName: "Roma" };

const ROSTER = [OLEG, ANYA, ROMA];

const ORDER = [OLEG.playerId, ANYA.playerId, ROMA.playerId];

const NONE_PLACED = 0;

const ONE_PLACED = 1;

const FIRST_SEAT = 1;

const FIRST_ROW = 0;

const SECOND_ROW = 1;

const FIRST_BUTTON = 0;

const FIRST_SLOT = 0;

const SECOND_SLOT = 1;

const LAST_ROW = -1;

const A_CONTROL_ROW = 1;

const DATA = "encoded";

const rowsOf = (placed: number) => renderSeatingKeyboard({ roster: ROSTER, placed });

const seatRows = (placed: number) => rowsOf(placed).slice(FIRST_ROW, LAST_ROW);

const controlRow = (placed: number) => rowsOf(placed).slice(LAST_ROW)[FIRST_ROW] ?? [];

describe("renderSeatingKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seatNumberOfSpy.mockReturnValue(null);
    encodeSeatingCallbackSpy.mockReturnValue(DATA);
  });

  it("should give every player a row of their own, in roster order", () => {
    expect(seatRows(NONE_PLACED).map((row) => row.map((button) => button.text))).toEqual([
      [OLEG.displayName],
      [ANYA.displayName],
      [ROMA.displayName],
    ]);
  });

  it("should mark a seated player with their seat number", () => {
    seatNumberOfSpy.mockReturnValue(FIRST_SEAT);

    const rows = rowsOf(ONE_PLACED);

    expect(rows[FIRST_ROW]?.[FIRST_BUTTON]?.text).toBe(
      `${copy.markSeat} ${FIRST_SEAT} ${OLEG.displayName}`
    );
  });

  it("should ask the plan which seat each slot holds", () => {
    rowsOf(ONE_PLACED);

    expect(seatNumberOfSpy).toHaveBeenCalledWith({ roster: ROSTER, placed: ONE_PLACED }, FIRST_SLOT);
  });

  it("should send the whole roster and a pick back with each name", () => {
    rowsOf(ONE_PLACED);

    expect(encodeSeatingCallbackSpy).toHaveBeenCalledWith({
      order: ORDER,
      placed: ONE_PLACED,
      action: { kind: ActionKind.Pick, playerId: ANYA.playerId },
    });
  });

  it("should ask for a pick of the player whose row it is, not always the first", () => {
    rowsOf(NONE_PLACED);

    expect(encodeSeatingCallbackSpy.mock.calls[SECOND_ROW]?.[FIRST_BUTTON]).toEqual({
      order: ORDER,
      placed: NONE_PLACED,
      action: { kind: ActionKind.Pick, playerId: ROSTER[SECOND_SLOT]?.playerId },
    });
  });

  it("should carry the encoded data onto the button", () => {
    expect(rowsOf(NONE_PLACED)[FIRST_ROW]?.[FIRST_BUTTON]?.callback_data).toBe(DATA);
  });

  it("should offer only Cancel while nobody is seated, since there is nothing to undo", () => {
    expect(controlRow(NONE_PLACED).map((button) => button.text)).toEqual([copy.buttonCancel]);
  });

  it("should offer Back once a seat is taken", () => {
    expect(controlRow(ONE_PLACED).map((button) => button.text)).toEqual([
      copy.buttonBack,
      copy.buttonCancel,
    ]);
  });

  it("should send the roster back with Back too, so the screen survives the tap", () => {
    controlRow(ONE_PLACED);

    expect(encodeSeatingCallbackSpy).toHaveBeenCalledWith({
      order: ORDER,
      placed: ONE_PLACED,
      action: { kind: ActionKind.Back },
    });
  });

  it("should send the roster back with Cancel", () => {
    controlRow(NONE_PLACED);

    expect(encodeSeatingCallbackSpy).toHaveBeenCalledWith({
      order: ORDER,
      placed: NONE_PLACED,
      action: { kind: ActionKind.Cancel },
    });
  });

  it("should put the controls in the last row, below every player", () => {
    expect(rowsOf(NONE_PLACED)).toHaveLength(ROSTER.length + A_CONTROL_ROW);
  });
});

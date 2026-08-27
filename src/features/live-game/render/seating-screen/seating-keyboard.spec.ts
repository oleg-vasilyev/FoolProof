import { ActionKind } from "#live-game/domain/card-states.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";
import { ControlRowStub } from "#shared/telegram/control-row.stub.ts";


const seatNumberOfSpy = vi.fn();

const everyoneSeatedSpy = vi.fn();

const encodeSeatingCallbackSpy = vi.fn();

const controls = new ControlRowStub();

vi.mock("#live-game/domain/seating-plan.ts", () => ({
  seatNumberOf: (plan: unknown, slot: number) => seatNumberOfSpy(plan, slot),
  everyoneSeated: (plan: unknown) => everyoneSeatedSpy(plan),
}));

vi.mock("#live-game/render/seating-screen/seating-callback-codec.ts", () => ({
  encodeSeatingCallback: (payload: unknown) => encodeSeatingCallbackSpy(payload),
}));

vi.mock("#shared/telegram/control-row.ts", () => controls.module);

const { renderSeatingKeyboard } = await import("#live-game/render/seating-screen/seating-keyboard.ts");


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const ROMA = { playerId: 12, displayName: "Roma" };

const ROSTER = [OLEG, ANYA, ROMA];

const ORDER = [OLEG.playerId, ANYA.playerId, ROMA.playerId];

const NONE_PLACED = 0;

const ONE_PLACED = 1;

const TWO_PLACED = 2;

const FIRST_SEAT = 1;

const FIRST_ROW = 0;

const SECOND_ROW = 1;

const FIRST_BUTTON = 0;

const FIRST_SLOT = 0;

const SECOND_SLOT = 1;

const LAST_ROW = -1;

const A_CONTROL_ROW = 1;

const FIRST_CALL = 0;

const ONLY_ARGUMENT = 0;

const NOTHING_TO_UNDO = false;

const SOMETHING_TO_UNDO = true;

const THE_CONTROLS = [{ text: "the control row", callback_data: "controls" }];

const encodedAs = (payload: { readonly placed: number; readonly action: { kind: string } }): string =>
  `seating(${String(payload.placed)},${payload.action.kind})`;

const rowsOf = (placed: number) => renderSeatingKeyboard(copy, { roster: ROSTER, placed });

const seatRows = (placed: number) => rowsOf(placed).slice(FIRST_ROW, LAST_ROW);

const handedOver = (placed: number) => {
  rowsOf(placed);

  return controls.controlRowSpy.mock.calls[FIRST_CALL]?.[ONLY_ARGUMENT];
};

describe("renderSeatingKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seatNumberOfSpy.mockReturnValue(null);
    everyoneSeatedSpy.mockReturnValue(false);
    encodeSeatingCallbackSpy.mockImplementation(encodedAs);
    controls.controlRowSpy.mockReturnValue(THE_CONTROLS);
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
    expect(rowsOf(NONE_PLACED)[FIRST_ROW]?.[FIRST_BUTTON]?.callback_data).toBe(
      encodedAs({ placed: NONE_PLACED, action: { kind: ActionKind.Pick } })
    );
  });

  it("should say there is nothing to undo while nobody is seated", () => {
    expect(handedOver(NONE_PLACED)?.anythingToUndo).toBe(NOTHING_TO_UNDO);
  });

  it("should say there is something to undo once a seat is taken", () => {
    expect(handedOver(ONE_PLACED)?.anythingToUndo).toBe(SOMETHING_TO_UNDO);
  });

  it("should withhold the way on while a seat is still unnumbered", () => {
    expect(handedOver(ONE_PLACED)?.commit).toBeNull();
  });

  it("should offer Play as the way on once every seat is settled", () => {
    everyoneSeatedSpy.mockReturnValue(true);

    expect(handedOver(TWO_PLACED)?.commit).toEqual({
      text: copy.buttonPlay,
      callback_data: encodedAs({ placed: TWO_PLACED, action: { kind: ActionKind.Confirm } }),
    });
  });

  it("should ask the plan whether every seat is settled rather than counting them here", () => {
    handedOver(ONE_PLACED);

    expect(everyoneSeatedSpy).toHaveBeenCalledWith({ roster: ROSTER, placed: ONE_PLACED });
  });

  it("should hand over a Back that carries the roster, so the screen survives the tap", () => {
    expect(handedOver(ONE_PLACED)?.back).toEqual({
      text: copy.buttonBack,
      callback_data: encodedAs({ placed: ONE_PLACED, action: { kind: ActionKind.Back } }),
    });
  });

  it("should hand over a Cancel that carries the roster too", () => {
    expect(handedOver(NONE_PLACED)?.cancel).toEqual({
      text: copy.buttonCancel,
      callback_data: encodedAs({ placed: NONE_PLACED, action: { kind: ActionKind.Cancel } }),
    });
  });

  it("should put the controls in the last row, below every player", () => {
    expect(rowsOf(NONE_PLACED)).toHaveLength(ROSTER.length + A_CONTROL_ROW);
  });

  it("should draw the row the shared builder returned, rather than one of its own", () => {
    expect(rowsOf(NONE_PLACED).at(LAST_ROW)).toEqual(THE_CONTROLS);
  });
});

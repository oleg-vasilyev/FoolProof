import { ActionKind } from "#live-game/domain/card-states.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";
import { ControlRowStub } from "#shared/telegram/control-row.stub.ts";


const enoughToPlaySpy = vi.fn();

const encodeLeavingCallbackSpy = vi.fn();

const controls = new ControlRowStub();

vi.mock("#live-game/domain/leaving-plan.ts", () => ({
  enoughToPlay: (plan: unknown) => enoughToPlaySpy(plan),
}));

vi.mock("#live-game/render/leaving-screen/leaving-callback-codec.ts", () => ({
  encodeLeavingCallback: (payload: unknown) => encodeLeavingCallbackSpy(payload),
}));

vi.mock("#shared/telegram/control-row.ts", () => controls.module);

const { renderLeavingKeyboard } = await import(
  "#live-game/render/leaving-screen/leaving-keyboard.ts"
);


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const ROMA = { playerId: 12, displayName: "Roma" };

const ROSTER = [OLEG, ANYA, ROMA];

const ORDER = [OLEG.playerId, ANYA.playerId, ROMA.playerId];

const NOBODY: readonly number[] = [];

const EVERYBODY = ORDER;

const FIRST_ROW = 0;

const SECOND_ROW = 1;

const FIRST_BUTTON = 0;

const FIRST_CALL = 0;

const ONLY_ARGUMENT = 0;

const SECOND_SLOT = 1;

const LAST_ROW = -1;

const A_CONTROL_ROW = 1;

const NOTHING_TO_UNDO = false;

const SOMETHING_TO_UNDO = true;

const THE_CONTROLS = [{ text: "the control row", callback_data: "controls" }];

const encodedAs = (payload: {
  readonly leaving: readonly number[];
  readonly action: { kind: string };
}): string => `leaving(${payload.leaving.join("+")},${payload.action.kind})`;

const rowsOf = (leaving: readonly number[]) =>
  renderLeavingKeyboard(copy, { roster: ROSTER, leaving });

const seatRows = (leaving: readonly number[]) => rowsOf(leaving).slice(FIRST_ROW, LAST_ROW);

const handedOver = (leaving: readonly number[]) => {
  rowsOf(leaving);

  return controls.controlRowSpy.mock.calls[FIRST_CALL]?.[ONLY_ARGUMENT];
};

describe("renderLeavingKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enoughToPlaySpy.mockReturnValue(true);
    encodeLeavingCallbackSpy.mockImplementation(encodedAs);
    controls.controlRowSpy.mockReturnValue(THE_CONTROLS);
  });

  it("should give every player a row of their own, in roster order", () => {
    expect(seatRows(NOBODY).map((row) => row.map((button) => button.text))).toEqual([
      [OLEG.displayName],
      [ANYA.displayName],
      [ROMA.displayName],
    ]);
  });

  it("should mark the player who is sitting out, and only them", () => {
    expect(seatRows([ANYA.playerId]).map((row) => row.map((button) => button.text))).toEqual([
      [OLEG.displayName],
      [`${copy.markLeaving} ${ANYA.displayName}`],
      [ROMA.displayName],
    ]);
  });

  it("should mark everybody once the whole table is sitting out", () => {
    expect(seatRows(EVERYBODY).map((row) => row.map((button) => button.text))).toEqual([
      [`${copy.markLeaving} ${OLEG.displayName}`],
      [`${copy.markLeaving} ${ANYA.displayName}`],
      [`${copy.markLeaving} ${ROMA.displayName}`],
    ]);
  });

  it("should send the whole roster, the marks and a pick back with each name", () => {
    rowsOf([ANYA.playerId]);

    expect(encodeLeavingCallbackSpy).toHaveBeenCalledWith({
      order: ORDER,
      leaving: [ANYA.playerId],
      action: { kind: ActionKind.Pick, playerId: OLEG.playerId },
    });
  });

  it("should ask for a pick of the player whose row it is, not always the first", () => {
    rowsOf(NOBODY);

    expect(encodeLeavingCallbackSpy.mock.calls[SECOND_ROW]?.[FIRST_BUTTON]).toEqual({
      order: ORDER,
      leaving: NOBODY,
      action: { kind: ActionKind.Pick, playerId: ROSTER[SECOND_SLOT]?.playerId },
    });
  });

  it("should carry the encoded payload onto the button that asked for it", () => {
    expect(rowsOf(NOBODY)[FIRST_ROW]?.[FIRST_BUTTON]?.callback_data).toBe(
      encodedAs({ leaving: NOBODY, action: { kind: ActionKind.Pick } })
    );
  });

  it("should say there is nothing to undo while nobody is marked", () => {
    expect(handedOver(NOBODY)?.anythingToUndo).toBe(NOTHING_TO_UNDO);
  });

  it("should say there is something to undo once a mark exists", () => {
    expect(handedOver([ANYA.playerId])?.anythingToUndo).toBe(SOMETHING_TO_UNDO);
  });

  it("should offer Play as the way on while a table is left to play it", () => {
    expect(handedOver([ANYA.playerId])?.wayOn).toEqual({
      text: copy.buttonPlay,
      callback_data: encodedAs({
        leaving: [ANYA.playerId],
        action: { kind: ActionKind.Confirm },
      }),
    });
  });

  it("should withhold it once too many are marked to make a game", () => {
    enoughToPlaySpy.mockReturnValue(false);

    expect(handedOver(EVERYBODY)?.wayOn).toBeNull();
  });

  it("should ask the plan whether a game is left rather than counting the marks here", () => {
    handedOver(EVERYBODY);

    expect(enoughToPlaySpy).toHaveBeenCalledWith({ roster: ROSTER, leaving: EVERYBODY });
  });

  it("should hand over a Back that carries the marks, so the screen survives the tap", () => {
    expect(handedOver([ANYA.playerId])?.back).toEqual({
      text: copy.buttonBack,
      callback_data: encodedAs({ leaving: [ANYA.playerId], action: { kind: ActionKind.Back } }),
    });
  });

  it("should hand over a Cancel that carries the marks too", () => {
    expect(handedOver(NOBODY)?.cancel).toEqual({
      text: copy.buttonCancel,
      callback_data: encodedAs({ leaving: NOBODY, action: { kind: ActionKind.Cancel } }),
    });
  });

  it("should put the controls in the last row, below every player", () => {
    expect(rowsOf(NOBODY)).toHaveLength(ROSTER.length + A_CONTROL_ROW);
  });

  it("should draw the row the shared builder returned, rather than one of its own", () => {
    expect(rowsOf(NOBODY).at(LAST_ROW)).toEqual(THE_CONTROLS);
  });
});

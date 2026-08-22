import { ActionKind } from "#live-game/domain/card-states.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";


const encodeLeavingCallbackSpy = vi.fn();

vi.mock("#live-game/render/leaving-screen/leaving-callback-codec.ts", () => ({
  encodeLeavingCallback: (payload: unknown) => encodeLeavingCallbackSpy(payload),
}));

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

const SECOND_SLOT = 1;

const LAST_ROW = -1;

const A_CONTROL_ROW = 1;

const DATA = "encoded";

const OTHER_DATA = "encoded elsewhere";

const rowsOf = (leaving: readonly number[]) =>
  renderLeavingKeyboard(copy, { roster: ROSTER, leaving });

const seatRows = (leaving: readonly number[]) => rowsOf(leaving).slice(FIRST_ROW, LAST_ROW);

const controlRow = (leaving: readonly number[]) => rowsOf(leaving).slice(LAST_ROW)[FIRST_ROW] ?? [];

describe("renderLeavingKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    encodeLeavingCallbackSpy.mockReturnValue(DATA);
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

  it("should carry each encoded payload onto the button that asked for it", () => {
    encodeLeavingCallbackSpy.mockReturnValueOnce(DATA).mockReturnValueOnce(OTHER_DATA);

    const rows = rowsOf(NOBODY);

    expect([
      rows[FIRST_ROW]?.[FIRST_BUTTON]?.callback_data,
      rows[SECOND_ROW]?.[FIRST_BUTTON]?.callback_data,
    ]).toEqual([DATA, OTHER_DATA]);
  });

  it("should offer both Play and Cancel while nobody is marked", () => {
    expect(controlRow(NOBODY).map((button) => button.text)).toEqual([
      copy.buttonPlay,
      copy.buttonCancel,
    ]);
  });

  it("should offer both Play and Cancel once the whole table is marked", () => {
    expect(controlRow(EVERYBODY).map((button) => button.text)).toEqual([
      copy.buttonPlay,
      copy.buttonCancel,
    ]);
  });

  it("should send the roster and the marks back with Play, so the tap can act on them", () => {
    controlRow([ANYA.playerId]);

    expect(encodeLeavingCallbackSpy).toHaveBeenCalledWith({
      order: ORDER,
      leaving: [ANYA.playerId],
      action: { kind: ActionKind.Confirm },
    });
  });

  it("should send the roster and the marks back with Cancel", () => {
    controlRow([ANYA.playerId]);

    expect(encodeLeavingCallbackSpy).toHaveBeenCalledWith({
      order: ORDER,
      leaving: [ANYA.playerId],
      action: { kind: ActionKind.Cancel },
    });
  });

  it("should put the controls in the last row, below every player", () => {
    expect(rowsOf(NOBODY)).toHaveLength(ROSTER.length + A_CONTROL_ROW);
  });
});

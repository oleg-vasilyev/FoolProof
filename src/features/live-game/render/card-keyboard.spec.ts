import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";
import { ActionKind, Phase } from "#live-game/domain/card-states.ts";
import type { CardState } from "#live-game/domain/card-state.ts";
import type { CallbackPayload } from "#live-game/render/callback-data-codec.ts";
import { ControlRowStub } from "#shared/telegram/control-row.stub.ts";


const nameAtSpy = vi.fn();

const finalPlacementsSpy = vi.fn();

const remainingSlotsSpy = vi.fn();

const phaseOfSpy = vi.fn();

const isReadySpy = vi.fn();

const drawAvailableSpy = vi.fn();

const encodeCallbackSpy = vi.fn();

const controls = new ControlRowStub();

vi.mock("#live-game/domain/card-state.ts", () => ({
  nameAt: (state: unknown, slot: number) => nameAtSpy(state, slot),
  finalPlacements: (state: unknown) => finalPlacementsSpy(state),
  remainingSlots: (state: unknown) => remainingSlotsSpy(state),
  phaseOf: (state: unknown) => phaseOfSpy(state),
  isReady: (state: unknown) => isReadySpy(state),
  drawAvailable: (state: unknown) => drawAvailableSpy(state),
}));

vi.mock("#live-game/render/callback-data-codec.ts", () => ({
  encodeCallback: (payload: CallbackPayload) => encodeCallbackSpy(payload),
}));

vi.mock("#shared/telegram/control-row.ts", () => controls.module);

const { renderKeyboard } = await import("#live-game/render/card-keyboard.ts");

const GAME_ID = 42;

const VERSION = 7;

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const FIRST_PLACE = 1;

const LAST_ROW = -1;

const ABOVE_THE_CONTROLS = -2;

const FIRST_CALL = 0;

const ONLY_ARGUMENT = 0;

const NOTHING_TO_UNDO = false;

const SOMETHING_TO_UNDO = true;

const THE_CONTROLS = [{ text: "the control row", callback_data: "controls" }];

const THREE_SEATS = [
  { playerId: 10, displayName: "Oleg" },
  { playerId: 11, displayName: "Anya" },
  { playerId: 12, displayName: "Roma" },
];

const stateWith = (over: Partial<CardState>): CardState =>
  ({ seats: THREE_SEATS, starterSlot: OLEG, exits: [], drawAccepted: false, ...over }) as CardState;

const encodedAs = (payload: CallbackPayload): string =>
  `cb(${payload.gameId},${payload.action},${String(payload.slot)},${payload.version})`;

const render = (state: CardState) => renderKeyboard(copy, state, GAME_ID, VERSION);

const captionsOf = (state: CardState): readonly string[] =>
  render(state)
    .slice(0, THREE_SEATS.length)
    .map((row) => row[0]?.text ?? "");

const handedOver = (state: CardState) => {
  render(state);

  return controls.controlRowSpy.mock.calls[FIRST_CALL]?.[ONLY_ARGUMENT];
};

describe("renderKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    nameAtSpy.mockImplementation((_state: unknown, slot: number) => THREE_SEATS[slot]?.displayName);
    encodeCallbackSpy.mockImplementation(encodedAs);
    finalPlacementsSpy.mockReturnValue([]);
    remainingSlotsSpy.mockReturnValue([]);
    phaseOfSpy.mockReturnValue(Phase.Recording);
    isReadySpy.mockReturnValue(false);
    drawAvailableSpy.mockReturnValue(false);
    controls.controlRowSpy.mockReturnValue(THE_CONTROLS);
  });

  describe("player rows", () => {
    it("should give every seat a row of its own", () => {
      expect(render(stateWith({}))).toHaveLength(THREE_SEATS.length + 1);
    });

    it("should keep the rows in seating order", () => {
      expect(captionsOf(stateWith({}))).toEqual(["Oleg", "Anya", "Roma"]);
    });

    it("should carry the seat's own slot in its callback", () => {
      const [firstRow] = render(stateWith({}));

      expect(firstRow?.[0]?.callback_data).toBe(
        encodedAs({ gameId: GAME_ID, action: ActionKind.Pick, slot: OLEG, version: VERSION })
      );
    });

    it("should stamp the version it was given on every button", () => {
      render(stateWith({}));

      expect(encodeCallbackSpy).toHaveBeenCalledWith(expect.objectContaining({ version: VERSION }));
    });

    it("should mark a player who is out with a tick and their position", () => {
      finalPlacementsSpy.mockReturnValue([{ slot: ANYA, position: FIRST_PLACE }]);

      expect(captionsOf(stateWith({ exits: [ANYA] }))[ANYA]).toBe("✅ 1 Anya");
    });

    it("should leave a player still in the game unmarked", () => {
      expect(captionsOf(stateWith({}))[ROMA]).toBe("Roma");
    });

    it("should mark the last one left as the fool", () => {
      isReadySpy.mockReturnValue(true);
      remainingSlotsSpy.mockReturnValue([ROMA]);

      expect(captionsOf(stateWith({ exits: [OLEG, ANYA] }))[ROMA]).toBe("💀 Roma");
    });

    it("should mark both players of a draw with the handshake instead", () => {
      isReadySpy.mockReturnValue(true);
      remainingSlotsSpy.mockReturnValue([ANYA, ROMA]);

      expect(captionsOf(stateWith({ exits: [OLEG] }))[ROMA]).toBe("🤝 Roma");
    });

    it("should not escape a caption, since Telegram renders it literally", () => {
      nameAtSpy.mockReturnValue("Аня & Оля");

      expect(captionsOf(stateWith({}))[OLEG]).toBe("Аня & Оля");
    });
  });

  describe("the draw row", () => {
    it("should give Draw a row of its own once two players remain", () => {
      drawAvailableSpy.mockReturnValue(true);

      expect(render(stateWith({})).at(ABOVE_THE_CONTROLS)).toEqual([
        { text: copy.buttonDraw, callback_data: expect.any(String) },
      ]);
    });

    it("should keep that row out of the controls, so no way off the screen moves", () => {
      drawAvailableSpy.mockReturnValue(true);

      expect(render(stateWith({})).at(LAST_ROW)).toEqual(THE_CONTROLS);
    });

    it("should draw no such row while more than two players remain", () => {
      expect(render(stateWith({})).map((row) => row[0]?.text)).not.toContain(copy.buttonDraw);
    });

    it("should send Draw as its own action", () => {
      drawAvailableSpy.mockReturnValue(true);

      expect(render(stateWith({})).at(ABOVE_THE_CONTROLS)?.[0]?.callback_data).toBe(
        encodedAs({ gameId: GAME_ID, action: ActionKind.Draw, slot: null, version: VERSION })
      );
    });
  });

  describe("the control row", () => {
    it("should put whatever the shared builder returns in the last row", () => {
      expect(render(stateWith({})).at(LAST_ROW)).toEqual(THE_CONTROLS);
    });

    it("should hand it a Cancel carrying the cancel action", () => {
      expect(handedOver(stateWith({}))?.cancel).toEqual({
        text: copy.buttonCancel,
        callback_data: encodedAs({
          gameId: GAME_ID,
          action: ActionKind.Cancel,
          slot: null,
          version: VERSION,
        }),
      });
    });

    it("should hand it a Back carrying the back action", () => {
      expect(handedOver(stateWith({}))?.back).toEqual({
        text: copy.buttonBack,
        callback_data: encodedAs({
          gameId: GAME_ID,
          action: ActionKind.Back,
          slot: null,
          version: VERSION,
        }),
      });
    });

    it("should say there is nothing to undo while the starter is unknown", () => {
      phaseOfSpy.mockReturnValue(Phase.PickStarter);

      expect(handedOver(stateWith({ starterSlot: null }))?.anythingToUndo).toBe(NOTHING_TO_UNDO);
    });

    it("should say there is something to undo once the starter is known", () => {
      expect(handedOver(stateWith({}))?.anythingToUndo).toBe(SOMETHING_TO_UNDO);
    });

    it("should say the same once every place is known, so Back survives Confirm", () => {
      phaseOfSpy.mockReturnValue(Phase.Ready);

      expect(handedOver(stateWith({}))?.anythingToUndo).toBe(SOMETHING_TO_UNDO);
    });

    it("should offer no way on while places are still being recorded", () => {
      expect(handedOver(stateWith({}))?.commit).toBeNull();
    });

    it("should offer none before the starter is picked either", () => {
      phaseOfSpy.mockReturnValue(Phase.PickStarter);

      expect(handedOver(stateWith({ starterSlot: null }))?.commit).toBeNull();
    });

    it("should offer Confirm as the way on once every place is known", () => {
      phaseOfSpy.mockReturnValue(Phase.Ready);

      expect(handedOver(stateWith({}))?.commit).toEqual({
        text: copy.buttonConfirm,
        callback_data: encodedAs({
          gameId: GAME_ID,
          action: ActionKind.Confirm,
          slot: null,
          version: VERSION,
        }),
      });
    });

    it("should ask the phase rather than reading the exits itself", () => {
      const state = stateWith({});

      render(state);

      expect(phaseOfSpy).toHaveBeenCalledWith(state);
    });
  });
});

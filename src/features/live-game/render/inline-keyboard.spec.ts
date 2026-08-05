import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionKind } from "#live-game/domain/card-states.ts";
import type { CardState } from "#live-game/domain/card-state.ts";
import type { CallbackPayload } from "#live-game/render/callback-data-codec.ts";


const nameAtSpy = vi.fn();

const finalPlacementsSpy = vi.fn();

const remainingSlotsSpy = vi.fn();

const phaseOfSpy = vi.fn();

const isReadySpy = vi.fn();

const drawAvailableSpy = vi.fn();

const cancelAvailableSpy = vi.fn();

const encodeCallbackSpy = vi.fn();

vi.mock("#live-game/domain/card-state.ts", () => ({
  nameAt: (state: unknown, slot: number) => nameAtSpy(state, slot),
  finalPlacements: (state: unknown) => finalPlacementsSpy(state),
  remainingSlots: (state: unknown) => remainingSlotsSpy(state),
  phaseOf: (state: unknown) => phaseOfSpy(state),
  isReady: (state: unknown) => isReadySpy(state),
  drawAvailable: (state: unknown) => drawAvailableSpy(state),
  cancelAvailable: (state: unknown) => cancelAvailableSpy(state),
}));

vi.mock("#live-game/render/callback-data-codec.ts", () => ({
  encodeCallback: (payload: CallbackPayload) => encodeCallbackSpy(payload),
}));

const { renderKeyboard } = await import("#live-game/render/inline-keyboard.ts");

const GAME_ID = 42;

const VERSION = 7;

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const FIRST_PLACE = 1;

const THREE_SEATS = [
  { playerId: 10, displayName: "Oleg" },
  { playerId: 11, displayName: "Anya" },
  { playerId: 12, displayName: "Roma" },
];

const stateWith = (over: Partial<CardState>): CardState =>
  ({ seats: THREE_SEATS, starterSlot: OLEG, exits: [], drawAccepted: false, ...over }) as CardState;

const encodedAs = (payload: CallbackPayload): string =>
  `cb(${payload.gameId},${payload.action},${String(payload.slot)},${payload.version})`;

const render = (state: CardState) => renderKeyboard(state, GAME_ID, VERSION);

const captionsOf = (state: CardState): readonly string[] =>
  render(state)
    .slice(0, THREE_SEATS.length)
    .map((row) => row[0]?.text ?? "");

const controlCaptions = (state: CardState): readonly string[] =>
  (render(state)[THREE_SEATS.length] ?? []).map((button) => button.text);

const controlButton = (state: CardState, index: number): string =>
  (render(state)[THREE_SEATS.length] ?? [])[index]?.callback_data ?? "";

describe("renderKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    nameAtSpy.mockImplementation((_state: unknown, slot: number) => THREE_SEATS[slot]?.displayName);
    encodeCallbackSpy.mockImplementation(encodedAs);
    finalPlacementsSpy.mockReturnValue([]);
    remainingSlotsSpy.mockReturnValue([]);
    phaseOfSpy.mockReturnValue("RECORDING");
    isReadySpy.mockReturnValue(false);
    drawAvailableSpy.mockReturnValue(false);
    cancelAvailableSpy.mockReturnValue(false);
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

  describe("the control row", () => {
    it("should offer only Cancel while the starter is unknown", () => {
      phaseOfSpy.mockReturnValue("PICK_STARTER");

      expect(controlCaptions(stateWith({ starterSlot: null }))).toEqual(["❌ Cancel"]);
    });

    it("should never offer Back before the starter is picked", () => {
      phaseOfSpy.mockReturnValue("PICK_STARTER");

      expect(controlCaptions(stateWith({ starterSlot: null }))).not.toContain("↩️ Back");
    });

    it("should offer only Back while exits are being recorded", () => {
      expect(controlCaptions(stateWith({ exits: [OLEG] }))).toEqual(["↩️ Back"]);
    });

    it("should never offer Cancel once recording has started", () => {
      expect(controlCaptions(stateWith({ exits: [OLEG] }))).not.toContain("❌ Cancel");
    });

    it("should keep Cancel beside Back while nothing has been recorded yet", () => {
      cancelAvailableSpy.mockReturnValue(true);

      expect(controlCaptions(stateWith({}))).toEqual(["↩️ Back", "❌ Cancel"]);
    });

    it("should keep Cancel last when Draw is offered too", () => {
      cancelAvailableSpy.mockReturnValue(true);
      drawAvailableSpy.mockReturnValue(true);

      expect(controlCaptions(stateWith({}))).toEqual(["↩️ Back", "🤝 Draw", "❌ Cancel"]);
    });

    it("should ignore the cancel rule entirely once every place is known", () => {
      phaseOfSpy.mockReturnValue("READY");
      cancelAvailableSpy.mockReturnValue(true);

      expect(controlCaptions(stateWith({}))).not.toContain("❌ Cancel");
    });

    it("should offer Draw beside Back once two players remain", () => {
      drawAvailableSpy.mockReturnValue(true);

      expect(controlCaptions(stateWith({ exits: [OLEG] }))).toEqual(["↩️ Back", "🤝 Draw"]);
    });

    it("should replace Draw with Confirm once every place is known", () => {
      phaseOfSpy.mockReturnValue("READY");
      drawAvailableSpy.mockReturnValue(true);

      expect(controlCaptions(stateWith({ exits: [OLEG, ANYA] }))).toEqual([
        "↩️ Back",
        "✅ Confirm",
      ]);
    });

    it("should send Cancel as its own action", () => {
      phaseOfSpy.mockReturnValue("PICK_STARTER");

      expect(controlButton(stateWith({ starterSlot: null }), 0)).toBe(
        encodedAs({ gameId: GAME_ID, action: ActionKind.Cancel, slot: null, version: VERSION })
      );
    });

    it("should send Back as its own action", () => {
      expect(controlButton(stateWith({}), 0)).toBe(
        encodedAs({ gameId: GAME_ID, action: ActionKind.Back, slot: null, version: VERSION })
      );
    });

    it("should send Confirm as its own action", () => {
      phaseOfSpy.mockReturnValue("READY");

      expect(controlButton(stateWith({}), 1)).toBe(
        encodedAs({ gameId: GAME_ID, action: ActionKind.Confirm, slot: null, version: VERSION })
      );
    });

    it("should send Draw as its own action", () => {
      drawAvailableSpy.mockReturnValue(true);

      expect(controlButton(stateWith({}), 1)).toBe(
        encodedAs({ gameId: GAME_ID, action: ActionKind.Draw, slot: null, version: VERSION })
      );
    });
  });
});

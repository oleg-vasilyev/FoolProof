import { describe, expect, it } from "vitest";
import { cardStateOf } from "../game/state.stub.ts";
import { decodeCallback } from "../../integrations/telegram/callback.ts";
import type { CardState } from "../game/state.ts";
import { renderKeyboard, type InlineKeyboardRows } from "./keyboard.ts";


const FIVE = ["Oleg", "Anya", "Roma", "Dima", "Kim"];

const THREE = ["Oleg", "Anya", "Roma"];

const TWO = ["Oleg", "Anya"];

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const DIMA = 3;

const GAME_ID = 42;

const VERSION = 7;

const CALLBACK_DATA_LIMIT_BYTES = 64;

const keyboardOf = (state: CardState): InlineKeyboardRows =>
  renderKeyboard(state, GAME_ID, VERSION);

const captionsOf = (state: CardState): readonly string[] =>
  keyboardOf(state).flatMap((row) => row.map((button) => button.text));

const controlsOf = (state: CardState): readonly string[] => {
  const rows = keyboardOf(state);

  return (rows[rows.length - 1] ?? []).map((button) => button.text);
};

describe("renderKeyboard()", () => {
  it("should give every player their own row", () => {
    const rows = keyboardOf(cardStateOf(FIVE));
    const playerRows = rows.slice(0, FIVE.length);

    expect(playerRows.every((row) => row.length === 1)).toBe(true);
  });

  it("should keep the players in seating order", () => {
    expect(captionsOf(cardStateOf(THREE)).slice(0, THREE.length)).toEqual(THREE);
  });

  it("should show bare names before anyone is out", () => {
    const state = cardStateOf(THREE, { starterSlot: OLEG });

    expect(captionsOf(state).slice(0, THREE.length)).toEqual(THREE);
  });

  it("should mark players who went out with a tick and their position", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA, ANYA] });
    const captions = captionsOf(state);

    expect(captions).toContain("✅ 1 Roma");
    expect(captions).toContain("✅ 2 Anya");
  });

  it("should mark the fool with a skull and no number", () => {
    const state = cardStateOf(THREE, { starterSlot: OLEG, exits: [ROMA, OLEG] });

    expect(captionsOf(state)).toContain("💀 Anya");
  });

  it("should mark both players of a draw with a handshake", () => {
    const state = cardStateOf(THREE, {
      starterSlot: OLEG,
      exits: [ROMA],
      drawAccepted: true,
    });
    const captions = captionsOf(state);

    expect(captions).toContain("🤝 Oleg");
    expect(captions).toContain("🤝 Anya");
  });

  it("should never escape a name in a caption", () => {
    const state = cardStateOf(["Аня & Оля", "Roma"], { starterSlot: OLEG });

    expect(captionsOf(state)).toContain("Аня & Оля");
  });

  describe("controls", () => {
    it("should offer only cancel in phase one", () => {
      expect(controlsOf(cardStateOf(FIVE))).toEqual(["❌ Cancel"]);
    });

    it("should offer only back while recording", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA] });

      expect(controlsOf(state)).toEqual(["↩️ Back"]);
    });

    it("should offer draw once two players remain", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA, ROMA] });

      expect(controlsOf(state)).toEqual(["↩️ Back", "🤝 Draw"]);
    });

    it("should offer draw immediately in a two player game", () => {
      const state = cardStateOf(TWO, { starterSlot: OLEG });

      expect(controlsOf(state)).toEqual(["↩️ Back", "🤝 Draw"]);
    });

    it("should replace draw with confirm when the card is ready", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG, exits: [ROMA, OLEG] });

      expect(controlsOf(state)).toEqual(["↩️ Back", "✅ Confirm"]);
    });

    it("should never show draw and confirm together", () => {
      const state = cardStateOf(FIVE, {
        starterSlot: OLEG,
        exits: [OLEG, ANYA, ROMA],
        drawAccepted: true,
      });
      const controls = controlsOf(state);

      expect(controls).toContain("✅ Confirm");
      expect(controls).not.toContain("🤝 Draw");
    });

    it("should never offer cancel outside phase one", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA] });

      expect(controlsOf(state)).not.toContain("❌ Cancel");
    });
  });

  describe("callback data", () => {
    it("should carry the slot on a player button", () => {
      const rows = keyboardOf(cardStateOf(THREE));
      const decoded = decodeCallback(rows[DIMA - 1]?.[0]?.callback_data ?? "");

      expect(decoded).toEqual({ gameId: GAME_ID, action: "pick", slot: ROMA, version: VERSION });
    });

    it("should stamp every button with the current version", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA] });
      const versions = keyboardOf(state)
        .flat()
        .map((button) => decodeCallback(button.callback_data)?.version);

      expect(versions.every((version) => version === VERSION)).toBe(true);
    });

    it("should stay inside Telegram's 64 byte limit", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA] });
      const sizes = keyboardOf(state)
        .flat()
        .map((button) => Buffer.byteLength(button.callback_data, "utf8"));

      expect(Math.max(...sizes)).toBeLessThanOrEqual(CALLBACK_DATA_LIMIT_BYTES);
    });

    it("should never put a name in callback data", () => {
      const state = cardStateOf(["Александра", "Владимир"], { starterSlot: OLEG });
      const data = keyboardOf(state)
        .flat()
        .map((button) => button.callback_data)
        .join(" ");

      expect(data).not.toMatch(/[а-яА-Я]/);
    });
  });
});

import { describe, expect, it } from "vitest";
import { cardStateOf } from "../../testing/factories.ts";
import { renderCard, renderResult } from "./card.ts";


const FIVE = ["Oleg", "Anya", "Roma", "Dima", "Kim"];

const THREE = ["Oleg", "Anya", "Roma"];

const TWO = ["Oleg", "Anya"];

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const DIMA = 3;

const GAME_NUMBER = 3;

describe("renderCard()", () => {
  it("should ask for the starter in phase one", () => {
    expect(renderCard(cardStateOf(FIVE), GAME_NUMBER)).toBe(
      "<b>Game 3</b>\nWho dealt first?"
    );
  });

  it("should name the starter once picked", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG });

    expect(renderCard(state, GAME_NUMBER)).toBe("<b>Game 3</b>\nDealt first: <b>Oleg</b>");
  });

  it("should not change as exits are recorded", () => {
    const early = cardStateOf(FIVE, { starterSlot: OLEG });
    const later = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA, ANYA] });

    expect(renderCard(later, GAME_NUMBER)).toBe(renderCard(early, GAME_NUMBER));
  });

  it("should not change when the card becomes READY", () => {
    const recording = cardStateOf(THREE, { starterSlot: OLEG });
    const ready = cardStateOf(THREE, { starterSlot: OLEG, exits: [ROMA, ANYA] });

    expect(renderCard(ready, GAME_NUMBER)).toBe(renderCard(recording, GAME_NUMBER));
  });

  it("should never list the standings", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA, ANYA] });

    expect(renderCard(state, GAME_NUMBER)).not.toContain("Roma");
  });

  it("should escape a starter name that contains markup", () => {
    const state = cardStateOf(["Аня & Оля", "Roma"], { starterSlot: OLEG });

    expect(renderCard(state, GAME_NUMBER)).toContain("Аня &amp; Оля");
  });
});

describe("renderResult()", () => {
  it("should list every place with the fool marked", () => {
    const state = cardStateOf(THREE, { starterSlot: OLEG, exits: [ROMA, OLEG] });

    expect(renderResult(state, GAME_NUMBER)).toBe(
      [
        "<b>Game 3</b>",
        "Dealt first: <b>Oleg</b>",
        "",
        "1 · Roma",
        "2 · Oleg",
        "3 · <b>Anya</b> — fool",
      ].join("\n")
    );
  });

  it("should label both players of a draw and name no fool", () => {
    const state = cardStateOf(THREE, {
      starterSlot: OLEG,
      exits: [ROMA],
      drawAccepted: true,
    });
    const rendered = renderResult(state, GAME_NUMBER);

    expect(rendered).toContain("2 · <b>Oleg</b> — draw");
    expect(rendered).toContain("2 · <b>Anya</b> — draw");
    expect(rendered).not.toContain("fool");
  });

  it("should mark the last of two players as the fool", () => {
    const state = cardStateOf(TWO, { starterSlot: OLEG, exits: [OLEG] });

    expect(renderResult(state, GAME_NUMBER)).toContain("2 · <b>Anya</b> — fool");
  });

  it("should keep the middle places unbolded", () => {
    const state = cardStateOf(FIVE, {
      starterSlot: OLEG,
      exits: [OLEG, ANYA, ROMA, DIMA],
    });

    expect(renderResult(state, GAME_NUMBER)).toContain("4 · Dima");
  });

  it("should escape names in the standings", () => {
    const state = cardStateOf(["<b>x</b>", "Roma"], { starterSlot: 1, exits: [1] });

    expect(renderResult(state, GAME_NUMBER)).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("should not leak raw markup from a player name", () => {
    const state = cardStateOf(["<b>x</b>", "Roma"], { starterSlot: 1, exits: [1] });

    expect(renderResult(state, GAME_NUMBER)).not.toContain("<b>x</b>");
  });
});

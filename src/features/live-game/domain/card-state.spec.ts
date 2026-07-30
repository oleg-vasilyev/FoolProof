import { describe, expect, it } from "vitest";
import { playerIdOf } from "#shared/repository/database-records.stub.ts";
import { cardStateOf } from "#live-game/domain/card-state.stub.ts";
import {
  apply,
  drawAvailable,
  finalPlacements,
  isReady,
  nameAt,
  phaseOf,
  recordedPlacements,
  remainingSlots,
  seatAt,
  starterPlayerId,
  type CardState,
} from "#live-game/domain/card-state.ts";


const FIVE = ["Oleg", "Anya", "Roma", "Dima", "Kim"];

const THREE = ["Oleg", "Anya", "Roma"];

const TWO = ["Oleg", "Anya"];

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const DIMA = 3;

const KIM = 4;

const OUT_OF_RANGE_SLOT = 99;

const updatedState = (state: CardState, ...slots: readonly number[]): CardState =>
  slots.reduce((current, slot) => {
    const transition = apply(current, { kind: "pick", slot });

    return transition.outcome === "updated" ? transition.state : current;
  }, state);

describe("phaseOf()", () => {
  it("should be PICK_STARTER while no starter is set", () => {
    expect(phaseOf(cardStateOf(FIVE))).toBe("PICK_STARTER");
  });

  it("should be RECORDING once a starter is set", () => {
    expect(phaseOf(cardStateOf(FIVE, { starterSlot: OLEG }))).toBe("RECORDING");
  });

  it("should be READY when only one player is left", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA, ROMA, DIMA] });

    expect(phaseOf(state)).toBe("READY");
  });

  it("should be READY when a draw was accepted", () => {
    const state = cardStateOf(FIVE, {
      starterSlot: OLEG,
      exits: [OLEG, ANYA, ROMA],
      drawAccepted: true,
    });

    expect(phaseOf(state)).toBe("READY");
  });

  it("should stay RECORDING with two left and no draw", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA, ROMA] });

    expect(phaseOf(state)).toBe("RECORDING");
  });
});

describe("isReady()", () => {
  it("should be false without a starter even if everyone has left", () => {
    const state = cardStateOf(TWO, { exits: [OLEG] });

    expect(isReady(state)).toBe(false);
  });
});

describe("drawAvailable()", () => {
  it("should be false in PICK_STARTER", () => {
    expect(drawAvailable(cardStateOf(TWO))).toBe(false);
  });

  it("should be true immediately in a two player game", () => {
    expect(drawAvailable(cardStateOf(TWO, { starterSlot: OLEG }))).toBe(true);
  });

  it("should be false until exactly two remain", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA] });

    expect(drawAvailable(state)).toBe(false);
  });

  it("should be true after n-2 taps", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA, ROMA] });

    expect(drawAvailable(state)).toBe(true);
  });

  it("should be false once the draw is accepted", () => {
    const state = cardStateOf(FIVE, {
      starterSlot: OLEG,
      exits: [OLEG, ANYA, ROMA],
      drawAccepted: true,
    });

    expect(drawAvailable(state)).toBe(false);
  });
});

describe("remainingSlots()", () => {
  it("should list everyone before any exit", () => {
    expect(remainingSlots(cardStateOf(THREE))).toEqual([OLEG, ANYA, ROMA]);
  });

  it("should drop players who already went out", () => {
    const state = cardStateOf(THREE, { exits: [ANYA] });

    expect(remainingSlots(state)).toEqual([OLEG, ROMA]);
  });
});

describe("recordedPlacements()", () => {
  it("should number exits from one in tap order", () => {
    const state = cardStateOf(THREE, { exits: [ROMA, OLEG] });

    expect(recordedPlacements(state)).toEqual([
      { slot: ROMA, position: 1 },
      { slot: OLEG, position: 2 },
    ]);
  });
});

describe("finalPlacements()", () => {
  it("should give the fool the last position", () => {
    const state = cardStateOf(THREE, { starterSlot: OLEG, exits: [ROMA, OLEG] });

    expect(finalPlacements(state)).toEqual([
      { slot: ROMA, position: 1 },
      { slot: OLEG, position: 2 },
      { slot: ANYA, position: 3 },
    ]);
  });

  it("should let a draw share the last position", () => {
    const state = cardStateOf(THREE, {
      starterSlot: OLEG,
      exits: [ROMA],
      drawAccepted: true,
    });

    expect(finalPlacements(state)).toEqual([
      { slot: ROMA, position: 1 },
      { slot: OLEG, position: 2 },
      { slot: ANYA, position: 2 },
    ]);
  });
});

describe("seatAt() and nameAt()", () => {
  it("should read the seat at a slot", () => {
    expect(seatAt(cardStateOf(THREE), ANYA)?.displayName).toBe("Anya");
  });

  it("should return undefined past the end", () => {
    expect(seatAt(cardStateOf(THREE), OUT_OF_RANGE_SLOT)).toBeUndefined();
  });

  it("should give an empty name for an unknown slot", () => {
    expect(nameAt(cardStateOf(THREE), OUT_OF_RANGE_SLOT)).toBe("");
  });
});

describe("starterPlayerId()", () => {
  it("should be null while no starter is set", () => {
    expect(starterPlayerId(cardStateOf(THREE))).toBeNull();
  });

  it("should resolve the starter to a player id", () => {
    const state = cardStateOf(THREE, { starterSlot: ROMA });

    expect(starterPlayerId(state)).toBe(playerIdOf(ROMA));
  });

  it("should be null when the starter slot does not exist", () => {
    const state = cardStateOf(THREE, { starterSlot: OUT_OF_RANGE_SLOT });

    expect(starterPlayerId(state)).toBeNull();
  });
});

describe("apply()", () => {
  describe("pick", () => {
    it("should set the starter in PICK_STARTER", () => {
      const transition = apply(cardStateOf(THREE), { kind: "pick", slot: ANYA });

      expect(transition).toEqual({
        outcome: "updated",
        state: expect.objectContaining({ starterSlot: ANYA }),
      });
    });

    it("should record an exit in RECORDING", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG });
      const transition = apply(state, { kind: "pick", slot: ROMA });

      expect(transition).toEqual({
        outcome: "updated",
        state: expect.objectContaining({ exits: [ROMA] }),
      });
    });

    it("should let the starter go out first", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG });

      expect(apply(state, { kind: "pick", slot: OLEG }).outcome).toBe("updated");
    });

    it("should reject a player who already went out", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ROMA] });

      expect(apply(state, { kind: "pick", slot: ROMA }).outcome).toBe("rejected");
    });

    it("should reject a tap once the card is READY", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG, exits: [OLEG, ANYA] });

      expect(apply(state, { kind: "pick", slot: ROMA }).outcome).toBe("rejected");
    });

    it("should reject a slot past the table", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG });

      expect(apply(state, { kind: "pick", slot: OUT_OF_RANGE_SLOT }).outcome).toBe("rejected");
    });

    it("should reject a negative slot", () => {
      const negativeSlot = -1;
      const state = cardStateOf(THREE, { starterSlot: OLEG });

      expect(apply(state, { kind: "pick", slot: negativeSlot }).outcome).toBe("rejected");
    });

    it("should reject a fractional slot", () => {
      const fractionalSlot = 1.5;
      const state = cardStateOf(THREE, { starterSlot: OLEG });

      expect(apply(state, { kind: "pick", slot: fractionalSlot }).outcome).toBe("rejected");
    });

    it("should reach READY when only one player is left", () => {
      const state = updatedState(cardStateOf(FIVE), OLEG, ANYA, ROMA, DIMA, KIM);

      expect(phaseOf(state)).toBe("READY");
      expect(remainingSlots(state)).toEqual([OLEG]);
    });
  });

  describe("draw", () => {
    it("should accept a draw when two remain", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA, ROMA] });
      const transition = apply(state, { kind: "draw" });

      expect(transition).toEqual({
        outcome: "updated",
        state: expect.objectContaining({ drawAccepted: true }),
      });
    });

    it("should reject a draw while three remain", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA] });

      expect(apply(state, { kind: "draw" }).outcome).toBe("rejected");
    });

    it("should reject a draw in PICK_STARTER", () => {
      expect(apply(cardStateOf(TWO), { kind: "draw" }).outcome).toBe("rejected");
    });
  });

  describe("back", () => {
    it("should be rejected in PICK_STARTER", () => {
      expect(apply(cardStateOf(THREE), { kind: "back" }).outcome).toBe("rejected");
    });

    it("should roll back an accepted draw before touching exits", () => {
      const state = cardStateOf(FIVE, {
        starterSlot: OLEG,
        exits: [OLEG, ANYA, ROMA],
        drawAccepted: true,
      });
      const transition = apply(state, { kind: "back" });

      expect(transition).toEqual({
        outcome: "updated",
        state: expect.objectContaining({ drawAccepted: false, exits: [OLEG, ANYA, ROMA] }),
      });
    });

    it("should drop the last exit", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG, ANYA] });
      const transition = apply(state, { kind: "back" });

      expect(transition).toEqual({
        outcome: "updated",
        state: expect.objectContaining({ exits: [OLEG] }),
      });
    });

    it("should clear the starter when there are no exits left", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG });
      const transition = apply(state, { kind: "back" });

      expect(transition).toEqual({
        outcome: "updated",
        state: expect.objectContaining({ starterSlot: null }),
      });
    });

    it("should walk a finished card back to PICK_STARTER one step at a time", () => {
      const finished = updatedState(cardStateOf(THREE), OLEG, ROMA, ANYA);
      const steps = [finished];

      const walked = [1, 2, 3].reduce((current) => {
        const transition = apply(current, { kind: "back" });
        const next = transition.outcome === "updated" ? transition.state : current;
        steps.push(next);

        return next;
      }, finished);

      expect(phaseOf(walked)).toBe("PICK_STARTER");
    });
  });

  describe("confirm", () => {
    it("should confirm a READY card", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG, exits: [OLEG, ANYA] });

      expect(apply(state, { kind: "confirm" }).outcome).toBe("confirmed");
    });

    it("should reject a confirm while still recording", () => {
      const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [OLEG] });

      expect(apply(state, { kind: "confirm" }).outcome).toBe("rejected");
    });

    it("should reject a confirm in PICK_STARTER", () => {
      expect(apply(cardStateOf(THREE), { kind: "confirm" }).outcome).toBe("rejected");
    });
  });

  describe("cancel", () => {
    it("should cancel in PICK_STARTER", () => {
      expect(apply(cardStateOf(THREE), { kind: "cancel" }).outcome).toBe("cancelled");
    });

    it("should reject a cancel once recording started", () => {
      const state = cardStateOf(THREE, { starterSlot: OLEG });

      expect(apply(state, { kind: "cancel" }).outcome).toBe("rejected");
    });
  });

  it("should never mutate the state it is given", () => {
    const state = cardStateOf(FIVE, { starterSlot: OLEG, exits: [ANYA] });
    const snapshot = structuredClone(state);

    apply(state, { kind: "pick", slot: ROMA });
    apply(state, { kind: "back" });
    apply(state, { kind: "draw" });

    expect(state).toEqual(snapshot);
  });
});

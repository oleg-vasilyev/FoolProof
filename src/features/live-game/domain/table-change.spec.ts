import { beforeEach, describe, expect, it, vi } from "vitest";
import { seatsOf } from "#live-game/domain/card-state.stub.ts";


const NORMALIZED_PREFIX = "normalized:";

const MOCKED_MIN_PLAYERS = 3;

const MOCKED_MOST_PLAYERS = 4;

const FOLDED_KEY = "folded";

const normalizeNameSpy = vi.fn();

vi.mock("#live-game/domain/card-state.ts", () => ({
  MIN_PLAYERS: MOCKED_MIN_PLAYERS,
  MOST_PLAYERS: MOCKED_MOST_PLAYERS,
}));

vi.mock("#live-game/domain/lineup-parsing.ts", () => ({
  normalizeName: (name: string) => normalizeNameSpy(name),
}));

const { alreadySeated, tableWith, tableWithout } = await import(
  "#live-game/domain/table-change.ts"
);

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const DIMA = 3;

beforeEach(() => {
  vi.clearAllMocks();
  normalizeNameSpy.mockImplementation((name: string) => `${NORMALIZED_PREFIX}${name}`);
});

describe("tableWith()", () => {
  it("should seat the joiners after the players already there", () => {
    const seated = seatsOf("Oleg", "Anya");
    const joining = seatsOf("Kim");

    expect(tableWith(seated, joining)).toEqual({ ok: true, seats: [...seated, ...joining] });
  });

  it("should fill the table right up to the cap", () => {
    const seated = seatsOf("Oleg", "Anya", "Roma");

    expect(tableWith(seated, seatsOf("Kim"))).toMatchObject({ ok: true });
  });

  it("should refuse one joiner past the cap", () => {
    const seated = seatsOf("Oleg", "Anya", "Roma", "Dima");

    expect(tableWith(seated, seatsOf("Kim"))).toEqual({ ok: false, problem: "too_many" });
  });

  it("should refuse a table that several joiners together overfill", () => {
    const seated = seatsOf("Oleg", "Anya");

    expect(tableWith(seated, seatsOf("Kim", "Zhenya", "Sasha"))).toEqual({
      ok: false,
      problem: "too_many",
    });
  });

  it("should not consult the name normaliser, since nobody is being matched", () => {
    tableWith(seatsOf("Oleg"), seatsOf("Kim"));

    expect(normalizeNameSpy).not.toHaveBeenCalled();
  });
});

describe("alreadySeated()", () => {
  it("should return the names that are already at the table, in the order they were given", () => {
    const seats = seatsOf("Oleg", "Anya", "Roma");

    const result = alreadySeated(seats, ["Roma", "Oleg"]);

    expect(result).toEqual(["Roma", "Oleg"]);
  });

  it("should return an empty list when nobody clashes", () => {
    const seats = seatsOf("Oleg", "Anya");

    const result = alreadySeated(seats, ["Dima"]);

    expect(result).toEqual([]);
  });

  it("should route both seat names and input names through normalizeName, reporting a name the normalizer folds onto a seated one", () => {
    normalizeNameSpy.mockImplementation((name: string) =>
      name === "Аня" || name === "АНЯ" ? FOLDED_KEY : `${NORMALIZED_PREFIX}${name}`
    );

    const seats = seatsOf("Аня", "Roma");

    const result = alreadySeated(seats, ["АНЯ"]);

    expect(result).toEqual(["АНЯ"]);
    expect(normalizeNameSpy).toHaveBeenCalledWith("Аня");
    expect(normalizeNameSpy).toHaveBeenCalledWith("Roma");
    expect(normalizeNameSpy).toHaveBeenCalledWith("АНЯ");
  });

  it("should return an empty result when the name list is empty", () => {
    const seats = seatsOf("Oleg", "Anya");

    const result = alreadySeated(seats, []);

    expect(result).toEqual([]);
  });
});

describe("tableWithout()", () => {
  it("should remove the named players and keep the rest in their original relative order", () => {
    const seats = seatsOf("Oleg", "Anya", "Roma", "Dima");

    const result = tableWithout(seats, ["Anya"]);

    expect(result).toEqual({
      ok: true,
      seats: [seats[OLEG], seats[ROMA], seats[DIMA]],
    });
  });

  it("should report unknown_names carrying exactly the unseated names, winning over the too-few check", () => {
    const seats = seatsOf("Oleg", "Anya");

    const result = tableWithout(seats, ["Oleg", "Anya", "Dima"]);

    expect(result).toEqual({ ok: false, problem: "unknown_names", names: ["Dima"] });
  });

  it("should report too_few when removing enough players leaves fewer than MIN_PLAYERS", () => {
    const seats = seatsOf("Oleg", "Anya", "Roma");

    const result = tableWithout(seats, ["Oleg"]);

    expect(result).toEqual({ ok: false, problem: "too_few" });
  });

  it("should allow leaving exactly MIN_PLAYERS seated", () => {
    const seats = seatsOf("Oleg", "Anya", "Roma", "Dima");

    const result = tableWithout(seats, ["Dima"]);

    expect(result).toEqual({ ok: true, seats: [seats[OLEG], seats[ANYA], seats[ROMA]] });
  });

  it("should return every seat unchanged when removing nobody", () => {
    const seats = seatsOf("Oleg", "Anya", "Roma");

    const result = tableWithout(seats, []);

    expect(result).toEqual({ ok: true, seats });
  });
});

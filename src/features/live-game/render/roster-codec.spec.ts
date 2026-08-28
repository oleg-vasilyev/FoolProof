import { describe, expect, it } from "vitest";
import { toBase62 } from "#live-game/render/callback-data-codec.ts";
import {
  fromBase62Row,
  marksOf,
  seatsOf,
  toBase62Row,
} from "#live-game/render/roster-codec.ts";


const OLEG = 3;

const ANYA = 7;

const ROMA = 12;

const KIM = 41;

const ORDER = [OLEG, ANYA, ROMA, KIM];

const NOBODY: readonly number[] = [];

const A_STRANGER = 99;

const WIDEST_ID = 999_999;

const BIGGEST_TABLE = 10;

const NOTHING = 0;

describe("toBase62Row()", () => {
  it("should open with the width every id is written to, so nothing needs a separator", () => {
    expect(toBase62Row([OLEG, ANYA])).toBe("137");
  });

  it("should pad a narrow id out to the widest one at the table", () => {
    expect(toBase62Row([OLEG, WIDEST_ID])).toBe(`4000${toBase62(OLEG)}${toBase62(WIDEST_ID)}`);
  });

  it("should carry an id of any size, since the width digit is written rather than assumed", () => {
    const HUGE = 62 ** 5;

    expect(fromBase62Row(toBase62Row([HUGE]))).toEqual([HUGE]);
  });

  it("should keep a full table of the widest ids inside a row of its own", () => {
    const order = Array.from({ length: BIGGEST_TABLE }, (_unused, at) => WIDEST_ID - at);

    expect(fromBase62Row(toBase62Row(order))).toEqual(order);
  });
});

describe("fromBase62Row()", () => {
  it("should read back what it wrote, in the order it was written", () => {
    expect(fromBase62Row(toBase62Row(ORDER))).toEqual(ORDER);
  });

  it("should refuse a row that does not divide by its own width", () => {
    expect(fromBase62Row("2137")).toBeNull();
  });

  it("should refuse a row of no ids at all", () => {
    expect(fromBase62Row("1")).toBeNull();
  });

  it("should refuse a row carrying anything that is not base 62", () => {
    expect(fromBase62Row("13-7")).toBeNull();
  });

  it("should refuse an empty row", () => {
    expect(fromBase62Row("")).toBeNull();
  });
});

describe("marksOf()", () => {
  it("should write a mark as the seat it sits in, not as the id it names", () => {
    expect(marksOf(ORDER, [ANYA, KIM])).toBe("13");
  });

  it("should keep the marks in the order they were made", () => {
    expect(marksOf(ORDER, [KIM, ANYA])).toBe("31");
  });

  it("should write nothing for nobody marked", () => {
    expect(marksOf(ORDER, NOBODY)).toBe("");
  });

  it("should drop somebody who is not at this table rather than write a seat nobody holds", () => {
    expect(marksOf(ORDER, [A_STRANGER, ANYA])).toBe("1");
  });
});

describe("seatsOf()", () => {
  it("should read a mark back as the player sitting in that seat", () => {
    expect(seatsOf(ORDER, "13")).toEqual([ANYA, KIM]);
  });

  it("should read the same digit as a different player over a different order", () => {
    expect(seatsOf([OLEG, ANYA], "1")).toEqual([ANYA]);
    expect(seatsOf([ANYA, OLEG], "1")).toEqual([OLEG]);
  });

  it("should read nothing marked as nobody marked", () => {
    expect(seatsOf(ORDER, "")).toEqual(NOBODY);
  });

  it("should refuse a seat nobody at the table holds", () => {
    expect(seatsOf(ORDER, "9")).toBeNull();
  });

  it("should refuse the same seat marked twice, which no screen can produce", () => {
    expect(seatsOf(ORDER, "11")).toBeNull();
  });

  it("should read every mark back, not only the first", () => {
    expect(seatsOf(ORDER, "3210")).toHaveLength(ORDER.length);
  });
});

describe("the round trip both screens depend on", () => {
  it("should give back the players that were marked, whatever order they were marked in", () => {
    const marked = [ROMA, OLEG, KIM];

    expect(seatsOf(fromBase62Row(toBase62Row(ORDER)) ?? [], marksOf(ORDER, marked))).toEqual(marked);
  });

  it("should survive a table where every id is the widest one the spec asserts", () => {
    const order = Array.from({ length: BIGGEST_TABLE }, (_unused, at) => WIDEST_ID - at);
    const marked = order.slice(NOTHING, order.length - 1);

    expect(seatsOf(fromBase62Row(toBase62Row(order)) ?? [], marksOf(order, marked))).toEqual(marked);
  });
});

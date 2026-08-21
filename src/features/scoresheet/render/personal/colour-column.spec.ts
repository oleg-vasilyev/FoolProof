import { describe, expect, it } from "vitest";
import type { PlayerColumn, SeriesChronology } from "#shared/repository/repository-contract.ts";
import { colourColumnOf } from "#scoresheet/render/personal/colour-column.ts";


const OLEG = 7;

const ANYA = 9;

const ROMA = 11;

const A_STRANGER = 13;

const NO_COLUMN = -1;

const LEFTMOST = 0;

const SECOND = 1;

const THIRD = 2;

const ROSTER: readonly PlayerColumn[] = [
  { playerId: OLEG, displayName: "Oleg" },
  { playerId: ANYA, displayName: "Anya" },
  { playerId: ROMA, displayName: "Roma" },
];

const TONIGHT: SeriesChronology = {
  startedOn: "2026-08-21",
  players: [
    { playerId: ROMA, displayName: "Roma" },
    { playerId: OLEG, displayName: "Oleg" },
  ],
  games: [],
};

describe("colour-column", () => {
  describe("colourColumnOf()", () => {
    it("should number a seated player by where they sit tonight", () => {
      expect(colourColumnOf(TONIGHT, ROSTER, OLEG)).toBe(SECOND);
    });

    it("should not number a seated player by where they stand in the roster", () => {
      expect(colourColumnOf(TONIGHT, ROSTER, OLEG)).not.toBe(LEFTMOST);
    });

    it("should count tonight's table from its left edge", () => {
      expect(colourColumnOf(TONIGHT, ROSTER, ROMA)).toBe(LEFTMOST);
    });

    it("should fall back to the roster for somebody who did not play tonight", () => {
      expect(colourColumnOf(TONIGHT, ROSTER, ANYA)).toBe(SECOND);
    });

    it("should fall back to the roster when there was no evening at all", () => {
      expect(colourColumnOf(null, ROSTER, ROMA)).toBe(THIRD);
    });

    it("should give a player neither table knows no column", () => {
      expect(colourColumnOf(TONIGHT, ROSTER, A_STRANGER)).toBe(NO_COLUMN);
    });

    it("should give a player no column when there is no evening either", () => {
      expect(colourColumnOf(null, ROSTER, A_STRANGER)).toBe(NO_COLUMN);
    });

    it("should read an empty table as nobody sitting there", () => {
      const DESERTED = { ...TONIGHT, players: [] };

      expect(colourColumnOf(DESERTED, ROSTER, OLEG)).toBe(LEFTMOST);
    });
  });
});

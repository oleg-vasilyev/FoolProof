import { describe, expect, it } from "vitest";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { factInk, isBadNews } from "#scoresheet/render/personal/fact-ink.ts";


const INK = "player-ink";

const BAD_NEWS: Readonly<Record<CareerFactName, boolean>> = {
  [CareerFactName.TheBlinder]: false,
  [CareerFactName.TheNightmare]: true,
  [CareerFactName.TheCharm]: false,
  [CareerFactName.TheJinx]: true,
  [CareerFactName.ThePatsy]: false,
  [CareerFactName.TheBogey]: true,
  [CareerFactName.BigTableCharm]: false,
  [CareerFactName.BigTableCurse]: true,
  [CareerFactName.OpenersGift]: false,
  [CareerFactName.OpenersCurse]: true,
  [CareerFactName.TheHomecoming]: false,
  [CareerFactName.NeverWentFirst]: false,
  [CareerFactName.TheHeadStart]: false,
  [CareerFactName.TheBadPatch]: true,
  [CareerFactName.TheCleanRun]: false,
  [CareerFactName.TheSurvivor]: false,
  [CareerFactName.LightningRod]: true,
  [CareerFactName.EverPresent]: false,
  [CareerFactName.FoundingMember]: false,
  [CareerFactName.TheNewcomer]: false,
};

const factOf = (name: CareerFactName): CareerFact => ({ name }) as unknown as CareerFact;

const NAMED_BAD_NEWS = CareerFactName.TheJinx;

const NAMED_GOOD_NEWS = CareerFactName.TheCharm;

describe("fact-ink", () => {
  describe("isBadNews()", () => {
    it("should judge every fact the catalogue names", () => {
      expect(Object.keys(BAD_NEWS).sort()).toEqual([...Object.values(CareerFactName)].sort());
    });

    it.each(Object.values(CareerFactName))(
      "should judge %s the way the sheet reads it",
      (name) => {
        expect(isBadNews(factOf(name))).toBe(BAD_NEWS[name]);
      }
    );

    it("should call some facts bad news and leave the rest alone", () => {
      const judged = Object.values(CareerFactName).map((name) => isBadNews(factOf(name)));

      expect(judged).toContain(true);
      expect(judged).toContain(false);
    });
  });

  describe("factInk()", () => {
    it("should paint a fact that is bad news in the fool's red", () => {
      expect(factInk(factOf(NAMED_BAD_NEWS), INK)).toBe(palette.cellFool);
    });

    it("should not paint a fact that is bad news in the player's own colour", () => {
      expect(factInk(factOf(NAMED_BAD_NEWS), INK)).not.toBe(INK);
    });

    it("should paint a fact that is not bad news in the ink it was handed", () => {
      expect(factInk(factOf(NAMED_GOOD_NEWS), INK)).toBe(INK);
    });

    it("should not paint a fact that is not bad news in the fool's red", () => {
      expect(factInk(factOf(NAMED_GOOD_NEWS), INK)).not.toBe(palette.cellFool);
    });

    it("should follow the ink it is handed rather than fixing one colour", () => {
      const ANOTHER_INK = "another-ink";

      expect(factInk(factOf(NAMED_GOOD_NEWS), ANOTHER_INK)).toBe(ANOTHER_INK);
    });

    it("should ignore the ink it is handed when the fact is bad news", () => {
      const ANOTHER_INK = "another-ink";

      expect(factInk(factOf(NAMED_BAD_NEWS), ANOTHER_INK)).toBe(palette.cellFool);
    });
  });
});

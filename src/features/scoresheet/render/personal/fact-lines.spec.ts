import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";


const gameTallySpy = vi.fn();

const eveningTallySpy = vi.fn();

const timeTallySpy = vi.fn();

const percentLabelSpy = vi.fn();

const sessionDateSpy = vi.fn();

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
  eveningTally: (table: unknown, evenings: number) => eveningTallySpy(table, evenings),
  timeTally: (table: unknown, times: number) => timeTallySpy(table, times),
}));

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

vi.mock("#scoresheet/render/session-date.ts", () => ({
  sessionDate: (table: unknown, isoDate: string) => sessionDateSpy(table, isoDate),
}));

const { factLines } = await import("#scoresheet/render/personal/fact-lines.ts");

const dated = (isoDate: string): string => `date[${isoDate}]`;

const games = (count: number): string => `games[${String(count)}]`;

const evenings = (count: number): string => `evenings[${String(count)}]`;

const times = (count: number): string => `times[${String(count)}]`;

const pct = (share: number): string => `pct[${String(share)}]`;

interface Sample {
  readonly fact: CareerFact;
  readonly dates: readonly string[];
  readonly gamesWith: readonly number[];
  readonly eveningsWith: readonly number[];
  readonly timesWith: readonly number[];
  readonly percentsWith: readonly number[];
  readonly holderShows: string;
  readonly whyShows: readonly string[];
}

const NOTHING_ASKED: Omit<Sample, "fact"> = {
  dates: [],
  gamesWith: [],
  eveningsWith: [],
  timesWith: [],
  percentsWith: [],
  holderShows: "",
  whyShows: [],
};

const sampleOf = (fact: CareerFact, expected: Partial<Sample>): Sample => ({
  fact,
  ...NOTHING_ASKED,
  ...expected,
});

const BLINDER_DATE = "2026-01-11";

const NIGHTMARE_DATE = "2026-02-12";

const HOMECOMING_DATE = "2026-03-13";

const BAD_PATCH_FROM = "2026-04-14";

const BAD_PATCH_UNTIL = "2026-05-15";

const CLEAN_RUN_FROM = "2026-06-16";

const CLEAN_RUN_UNTIL = "2026-07-17";

const FOUNDING_DATE = "2026-08-18";

const ON_RECORD = 38;

const SINCE_THE_FIRST = 37;

const CHARM_RIVAL = "Rina";

const JINX_RIVAL = "Nadia";

const PATSY_RIVAL = "Pavel";

const BOGEY_RIVAL = "Boris";

const SAMPLES: readonly Sample[] = [
  sampleOf(
    { name: CareerFactName.TheBlinder, playedOn: BLINDER_DATE, games: 11, firsts: 7 },
    {
      dates: [BLINDER_DATE],
      gamesWith: [11],
      timesWith: [7],
      holderShows: dated(BLINDER_DATE),
      whyShows: [times(7), games(11)],
    }
  ),
  sampleOf(
    { name: CareerFactName.TheNightmare, playedOn: NIGHTMARE_DATE, games: 12, burns: 9 },
    {
      dates: [NIGHTMARE_DATE],
      gamesWith: [12],
      timesWith: [9],
      holderShows: dated(NIGHTMARE_DATE),
      whyShows: [times(9), games(12)],
    }
  ),
  sampleOf(
    { name: CareerFactName.TheCharm, rival: CHARM_RIVAL, games: 13, burns: 5, usual: 0.31 },
    {
      gamesWith: [13],
      percentsWith: [0.31],
      holderShows: CHARM_RIVAL,
      whyShows: ["5", games(13), pct(0.31)],
    }
  ),
  sampleOf(
    { name: CareerFactName.TheJinx, rival: JINX_RIVAL, games: 14, burns: 6, usual: 0.32 },
    {
      gamesWith: [14],
      percentsWith: [0.32],
      holderShows: JINX_RIVAL,
      whyShows: ["6", games(14), pct(0.32)],
    }
  ),
  sampleOf(
    { name: CareerFactName.ThePatsy, rival: PATSY_RIVAL, duels: 15, won: 8 },
    { timesWith: [15], holderShows: PATSY_RIVAL, whyShows: ["8", times(15)] }
  ),
  sampleOf(
    { name: CareerFactName.TheBogey, rival: BOGEY_RIVAL, duels: 16, lost: 3 },
    { timesWith: [16], holderShows: BOGEY_RIVAL, whyShows: ["3", times(16)] }
  ),
  sampleOf(
    { name: CareerFactName.BigTableCharm, seats: 7, games: 17, burns: 4 },
    { gamesWith: [17], holderShows: copy.atTableOf(7), whyShows: ["4", games(17)] }
  ),
  sampleOf(
    { name: CareerFactName.BigTableCurse, seats: 9, games: 18, burns: 2 },
    { gamesWith: [18], holderShows: copy.atTableOf(9), whyShows: ["2", games(18)] }
  ),
  sampleOf(
    { name: CareerFactName.OpenersGift, opens: 19, firsts: 21 },
    { timesWith: [19], holderShows: times(19), whyShows: ["21"] }
  ),
  sampleOf(
    { name: CareerFactName.OpenersCurse, opens: 22, burns: 23 },
    { timesWith: [22], holderShows: times(22), whyShows: ["23"] }
  ),
  sampleOf(
    { name: CareerFactName.TheHomecoming, missed: 24, playedOn: HOMECOMING_DATE },
    {
      dates: [HOMECOMING_DATE],
      eveningsWith: [24],
      holderShows: dated(HOMECOMING_DATE),
      whyShows: [evenings(24)],
    }
  ),
  sampleOf(
    { name: CareerFactName.NeverDealt, games: 25 },
    { gamesWith: [25], holderShows: games(25), whyShows: [copy.neverDealtReason] }
  ),
  sampleOf(
    { name: CareerFactName.TheHeadStart, opens: 26, games: 27 },
    { timesWith: [26], gamesWith: [27], holderShows: times(26), whyShows: [games(27)] }
  ),
  sampleOf(
    { name: CareerFactName.TheBadPatch, games: 28, from: BAD_PATCH_FROM, until: BAD_PATCH_UNTIL },
    {
      dates: [BAD_PATCH_FROM, BAD_PATCH_UNTIL],
      gamesWith: [28],
      holderShows: games(28),
      whyShows: [dated(BAD_PATCH_FROM), dated(BAD_PATCH_UNTIL)],
    }
  ),
  sampleOf(
    { name: CareerFactName.TheCleanRun, games: 29, from: CLEAN_RUN_FROM, until: CLEAN_RUN_UNTIL },
    {
      dates: [CLEAN_RUN_FROM, CLEAN_RUN_UNTIL],
      gamesWith: [29],
      holderShows: games(29),
      whyShows: [dated(CLEAN_RUN_FROM), dated(CLEAN_RUN_UNTIL)],
    }
  ),
  sampleOf(
    { name: CareerFactName.TheSurvivor, games: 31, burns: 32, expected: 0.33 },
    {
      gamesWith: [31],
      timesWith: [32],
      percentsWith: [0.33],
      holderShows: times(32),
      whyShows: [games(31), pct(0.33)],
    }
  ),
  sampleOf(
    { name: CareerFactName.LightningRod, games: 34, burns: 35, expected: 0.36 },
    {
      gamesWith: [34],
      timesWith: [35],
      percentsWith: [0.36],
      holderShows: times(35),
      whyShows: [games(34), pct(0.36)],
    }
  ),
  sampleOf(
    { name: CareerFactName.EverPresent, evenings: 37 },
    {
      eveningsWith: [37],
      holderShows: evenings(37),
      whyShows: [copy.everPresentReason],
    }
  ),
  sampleOf(
    { name: CareerFactName.FoundingMember, playedOn: FOUNDING_DATE, evenings: ON_RECORD },
    {
      dates: [FOUNDING_DATE],
      eveningsWith: [SINCE_THE_FIRST],
      holderShows: dated(FOUNDING_DATE),
      whyShows: [evenings(SINCE_THE_FIRST)],
    }
  ),
  sampleOf(
    { name: CareerFactName.TheNewcomer, evenings: 39, games: 41 },
    {
      gamesWith: [41],
      eveningsWith: [39],
      holderShows: games(41),
      whyShows: [evenings(39)],
    }
  ),
];

const NOT_WRITTEN = "undefined";

const askedOf = (spy: ReturnType<typeof vi.fn>): readonly unknown[][] => spy.mock.calls;

const throughTheTable = (asked: readonly number[] | readonly string[]): readonly unknown[][] =>
  asked.map((argument) => [copy, argument]);

const holdersOf = (): readonly string[] => SAMPLES.map((sample) => factLines(copy, sample.fact).holder);

const reasonsOf = (): readonly string[] => SAMPLES.map((sample) => factLines(copy, sample.fact).reason);

describe("factLines()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    gameTallySpy.mockImplementation((_table: unknown, count: number) => games(count));
    eveningTallySpy.mockImplementation((_table: unknown, count: number) => evenings(count));
    timeTallySpy.mockImplementation((_table: unknown, count: number) => times(count));
    percentLabelSpy.mockImplementation((share: number) => pct(share));
    sessionDateSpy.mockImplementation((_table: unknown, isoDate: string) => dated(isoDate));
  });

  describe("the catalogue of facts it can write up", () => {
    it("should have a sample for every fact the catalogue names", () => {
      expect(SAMPLES.map((sample) => sample.fact.name).sort()).toEqual(
        [...Object.values(CareerFactName)].sort()
      );
    });

    it("should give every fact a title of its own", () => {
      const titles = SAMPLES.map((sample) => factLines(copy, sample.fact).title);

      expect(new Set(titles).size).toBe(SAMPLES.length);
    });

    it("should give every fact a holder line of its own", () => {
      expect(new Set(holdersOf()).size).toBe(SAMPLES.length);
    });

    it("should give every fact a reason of its own", () => {
      expect(new Set(reasonsOf()).size).toBe(SAMPLES.length);
    });

    it("should write all three lines for every fact", () => {
      for (const written of [...holdersOf(), ...reasonsOf()]) {
        expect(written).not.toBe("");
        expect(written).not.toContain(NOT_WRITTEN);
      }
    });
  });

  describe("the title", () => {
    it.each(SAMPLES)("should title $fact.name from the catalogue's own key", (sample) => {
      expect(factLines(copy, sample.fact).title).toBe(copy.factTitles[sample.fact.name]);
    });
  });

  describe("the phrases each fact is built out of", () => {
    it.each(SAMPLES)("should count $fact.name's games through the game tally", (sample) => {
      factLines(copy, sample.fact);

      expect(askedOf(gameTallySpy)).toEqual(throughTheTable(sample.gamesWith));
    });

    it.each(SAMPLES)("should count $fact.name's evenings through the evening tally", (sample) => {
      factLines(copy, sample.fact);

      expect(askedOf(eveningTallySpy)).toEqual(throughTheTable(sample.eveningsWith));
    });

    it.each(SAMPLES)("should count $fact.name's occasions through the time tally", (sample) => {
      factLines(copy, sample.fact);

      expect(askedOf(timeTallySpy)).toEqual(throughTheTable(sample.timesWith));
    });

    it.each(SAMPLES)("should put $fact.name's shares through the percent label", (sample) => {
      factLines(copy, sample.fact);

      expect(askedOf(percentLabelSpy)).toEqual(sample.percentsWith.map((share) => [share]));
    });

    it.each(SAMPLES)("should put $fact.name's dates through the date table", (sample) => {
      factLines(copy, sample.fact);

      expect(askedOf(sessionDateSpy)).toEqual(throughTheTable(sample.dates));
    });
  });

  describe("what each line ends up carrying", () => {
    it.each(SAMPLES)("should hold $fact.name up by what names it", (sample) => {
      expect(factLines(copy, sample.fact).holder).toContain(sample.holderShows);
    });

    it.each(SAMPLES)("should give $fact.name's reason from its own numbers", (sample) => {
      const lines = factLines(copy, sample.fact);

      for (const shown of sample.whyShows) {
        expect(lines.reason).toContain(shown);
      }
    });

    it.each(SAMPLES)("should keep $fact.name's holder out of its own reason", (sample) => {
      const lines = factLines(copy, sample.fact);

      expect(lines.reason).not.toBe(lines.holder);
    });
  });
});

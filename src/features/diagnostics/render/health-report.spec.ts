import { beforeEach, describe, expect, it, vi } from "vitest";
import { PluralRulesStub } from "#shared/locale/plural-rules.stub.ts";
import { copy } from "#diagnostics/copy.en.ts";
import { copy as russian } from "#diagnostics/copy.ru.ts";


const DURATION = "3h 12m";

const SIZE = "40 KB";

const COUNTED = "some counted thing";

const humanDurationSpy = vi.fn();

const humanSizeSpy = vi.fn();

const plural = new PluralRulesStub();

vi.mock("#diagnostics/render/human-units.ts", () => ({
  humanDuration: (ms: number, units: unknown) => humanDurationSpy(ms, units),
  humanSize: (bytes: number, units: unknown) => humanSizeSpy(bytes, units),
}));

vi.mock("#shared/locale/plural-rules.ts", () => plural.module);

const { renderHealthReport } = await import("#diagnostics/render/health-report.ts");


const UPTIME_MS = 11_520_000;

const SIZE_BYTES = 40_960;

const PLAYERS = 6;

const GAMES = 28;

const LIVE_CARDS = 1;

const NOTHING = 0;

const FIRST_START = 1;

const THIRD_START = 3;

const WARNINGS = 2;

const ERRORS = 1;

const ONE_PROBLEM = 1;

const THREE_LINES = 3;

const LAST_GAME_AT = "2026-07-31 19:42:10";

const PREVIOUS_EXIT = "exit code 1";

const snapshotOf = (over: Record<string, unknown> = {}) => ({
  storage: {
    file: "D:\\Temp\\FoolProof\\data\\foolproof.db",
    sizeBytes: SIZE_BYTES,
    players: PLAYERS,
    games: GAMES,
    liveCards: LIVE_CARDS,
    lastGameAt: LAST_GAME_AT,
  },
  uptimeMs: UPTIME_MS,
  startAttempt: FIRST_START,
  previousExit: null,
  logLevel: "info",
  warnings: NOTHING,
  errors: NOTHING,
  problems: [],
  ...over,
});

const report = (over: Record<string, unknown> = {}) =>
  renderHealthReport(copy, snapshotOf(over) as Parameters<typeof renderHealthReport>[1]);

describe("renderHealthReport()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    humanDurationSpy.mockReturnValue(DURATION);
    humanSizeSpy.mockReturnValue(SIZE);
    plural.countedSpy.mockReturnValue(COUNTED);
  });

  describe("the database", () => {
    it("should name the file, since that is what tells dev from production", () => {
      expect(report()).toContain("foolproof.db");
    });

    it("should show the file name alone, not the path around it", () => {
      expect(report()).not.toContain("Temp");
    });

    it("should cope with a path written the other way round", () => {
      expect(report({ storage: { ...snapshotOf().storage, file: "/srv/data/live.db" } })).toContain(
        "live.db"
      );
    });

    it("should keep a bare file name as it is", () => {
      expect(report({ storage: { ...snapshotOf().storage, file: "bare.db" } })).toContain("bare.db");
    });

    it("should have the size formatted rather than printed raw", () => {
      expect(report()).toContain(SIZE);
    });

    it("should hand the size to the formatter in bytes, with the labels to spell it in", () => {
      report();

      expect(humanSizeSpy).toHaveBeenCalledWith(SIZE_BYTES, copy.units);
    });

    it("should count what is recorded, so an empty database is obvious", () => {
      expect(report()).toContain(copy.contents(COUNTED, COUNTED, LIVE_CARDS));
    });

    it("should have the players counted with their own noun", () => {
      report();

      expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, PLAYERS, copy.playerForms);
    });

    it("should have the games counted with theirs", () => {
      report();

      expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, GAMES, copy.gameForms);
    });

    it("should say when the last game was", () => {
      expect(report()).toContain(LAST_GAME_AT);
    });

    it("should say so plainly when there are no games at all", () => {
      expect(report({ storage: { ...snapshotOf().storage, lastGameAt: null } })).toContain(
        copy.noGamesYet
      );
    });
  });

  describe("the run", () => {
    it("should say how long it has been up", () => {
      expect(report()).toContain(copy.uptime(DURATION));
    });

    it("should hand the uptime to the formatter in milliseconds, with the labels to spell it in", () => {
      report();

      expect(humanDurationSpy).toHaveBeenCalledWith(UPTIME_MS, copy.units);
    });

    it("should say it is the first start when nothing died before it", () => {
      expect(report()).toContain(copy.firstStart);
    });

    it("should report a restart with the exit that caused it", () => {
      expect(report({ startAttempt: THIRD_START, previousExit: PREVIOUS_EXIT })).toContain(
        copy.restarted(THIRD_START, PREVIOUS_EXIT)
      );
    });

    it("should not claim a restart on the first start, whatever the environment says", () => {
      expect(report({ startAttempt: FIRST_START, previousExit: PREVIOUS_EXIT })).toContain(
        copy.firstStart
      );
    });

    it("should not claim a restart it cannot describe, however high the count", () => {
      expect(report({ startAttempt: THIRD_START, previousExit: null })).toContain(copy.firstStart);
    });

    it("should name the log level, since it decides what the log will hold", () => {
      expect(report({ logLevel: "debug" })).toContain(copy.logLevel("debug"));
    });
  });

  describe("what went wrong", () => {
    it("should say nothing went wrong when nothing did", () => {
      expect(report()).toContain(copy.noProblems);
    });

    it("should count the warnings and errors when there were some", () => {
      expect(report({ warnings: WARNINGS, errors: ERRORS })).toContain(
        copy.problemTally(COUNTED, COUNTED)
      );
    });

    it("should report an error even with no warnings beside it", () => {
      expect(report({ warnings: NOTHING, errors: ERRORS })).toContain(
        copy.problemTally(COUNTED, COUNTED)
      );
    });

    it("should report a warning even with no errors beside it", () => {
      expect(report({ warnings: WARNINGS, errors: NOTHING })).toContain(
        copy.problemTally(COUNTED, COUNTED)
      );
    });

    it("should have the warnings counted with their own noun", () => {
      report({ warnings: WARNINGS, errors: ERRORS });

      expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, WARNINGS, copy.warningForms);
    });

    it("should have the errors counted with theirs, not with the warnings'", () => {
      report({ warnings: WARNINGS, errors: ERRORS });

      expect(plural.countedSpy).toHaveBeenCalledWith(copy.locale, ERRORS, copy.errorForms);
    });

    it("should not print an empty list of problems", () => {
      expect(report()).not.toContain(copy.recentProblems);
    });

    it("should list the problems it kept", () => {
      const problems = [
        { at: "2026-07-31T19:42:10.123Z", level: "warn", message: "polling: no" },
      ];

      expect(report({ problems })).toContain("polling: no");
    });

    it("should show the time of a problem without the date around it", () => {
      const problems = [
        { at: "2026-07-31T19:42:10.123Z", level: "warn", message: "polling: no" },
      ];

      expect(report({ problems })).toContain("19:42:10");
    });

    it("should show the level in upper case, so an error stands out", () => {
      const problems = [
        { at: "2026-07-31T19:42:10.123Z", level: "error", message: "polling: no" },
      ];

      expect(report({ problems })).toContain("ERROR");
    });
  });

  it("should lead with a title, since this arrives in a chat of card messages", () => {
    expect(report().startsWith(copy.reportTitle)).toBe(true);
  });

  it("should speak in the copy it was handed, not in the one it imported", () => {
    const russianReport = renderHealthReport(
      russian,
      snapshotOf() as Parameters<typeof renderHealthReport>[1]
    );

    expect(russianReport.startsWith(russian.reportTitle)).toBe(true);
  });

  it("should count in the language of the copy it was handed", () => {
    renderHealthReport(russian, snapshotOf() as Parameters<typeof renderHealthReport>[1]);

    expect(plural.countedSpy).toHaveBeenCalledWith(russian.locale, PLAYERS, russian.playerForms);
  });

  it("should lay the whole message out in a fixed shape", () => {
    expect(report().split("\n")).toEqual([
      copy.reportTitle,
      "",
      copy.database("foolproof.db", SIZE),
      copy.contents(COUNTED, COUNTED, LIVE_CARDS),
      copy.lastGame(LAST_GAME_AT),
      "",
      copy.uptime(DURATION),
      copy.firstStart,
      copy.logLevel("info"),
      copy.noProblems,
    ]);
  });

  it("should set the problems apart with a blank line and a heading", () => {
    const problems = [{ at: "2026-07-31T19:42:10.123Z", level: "warn", message: "polling: no" }];

    expect(report({ problems, warnings: ONE_PROBLEM }).split("\n").slice(-THREE_LINES)).toEqual([
      "",
      copy.recentProblems,
      "19:42:10 WARN polling: no",
    ]);
  });

  it("should not print the date of a problem, which is always today", () => {
    const problems = [{ at: "2026-07-31T19:42:10.123Z", level: "warn", message: "polling: no" }];

    expect(report({ problems })).not.toContain("2026-07-31T");
  });
});

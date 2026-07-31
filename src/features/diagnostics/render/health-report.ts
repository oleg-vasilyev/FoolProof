import type { Problem } from "#shared/logging/log-history.ts";
import type { StorageSummary } from "#shared/repository/repository-contract.ts";
import { counted, humanDuration, humanSize } from "#diagnostics/render/human-units.ts";
import { copy } from "#diagnostics/copy.en.ts";


const NONE = 0;

const FIRST_START = 1;

const ISO_TIME_FROM = 11;

const ISO_TIME_TO = 19;

export interface HealthSnapshot {
  readonly storage: StorageSummary;
  readonly uptimeMs: number;
  readonly startAttempt: number;
  readonly previousExit: string | null;
  readonly logLevel: string;
  readonly warnings: number;
  readonly errors: number;
  readonly problems: readonly Problem[];
}

const fileNameOf = (path: string): string => path.replace(/^.*[\\/]/, "");

const startLine = (snapshot: HealthSnapshot): string =>
  snapshot.previousExit === null || snapshot.startAttempt <= FIRST_START
    ? copy.firstStart
    : copy.restarted(snapshot.startAttempt, snapshot.previousExit);

const tallyLine = (snapshot: HealthSnapshot): string =>
  snapshot.warnings === NONE && snapshot.errors === NONE
    ? copy.noProblems
    : copy.problemTally(
        counted(snapshot.warnings, "warning", "warnings"),
        counted(snapshot.errors, "error", "errors")
      );

const problemLines = (problems: readonly Problem[]): readonly string[] =>
  problems.length === NONE
    ? []
    : [
        "",
        copy.recentProblems,
        ...problems.map(
          (problem) =>
            `${problem.at.slice(ISO_TIME_FROM, ISO_TIME_TO)} ${problem.level.toUpperCase()} ${problem.message}`
        ),
      ];

export const renderHealthReport = (snapshot: HealthSnapshot): string =>
  [
    copy.reportTitle,
    "",
    copy.database(fileNameOf(snapshot.storage.file), humanSize(snapshot.storage.sizeBytes)),
    copy.contents(
      counted(snapshot.storage.players, "player", "players"),
      counted(snapshot.storage.games, "game", "games"),
      snapshot.storage.liveCards
    ),
    snapshot.storage.lastGameAt === null
      ? copy.noGamesYet
      : copy.lastGame(snapshot.storage.lastGameAt),
    "",
    copy.uptime(humanDuration(snapshot.uptimeMs)),
    startLine(snapshot),
    copy.logLevel(snapshot.logLevel),
    tallyLine(snapshot),
    ...problemLines(snapshot.problems),
  ].join("\n");

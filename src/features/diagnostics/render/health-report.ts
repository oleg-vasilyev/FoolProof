import type { Problem } from "#shared/logging/log-history.ts";
import type { StorageSummary } from "#shared/repository/repository-contract.ts";
import { counted } from "#shared/locale/plural-rules.ts";
import { humanDuration, humanSize } from "#diagnostics/render/human-units.ts";
import type { Copy } from "#diagnostics/copy.ts";


const NONE = 0;

const FIRST_START = 1;

const ISO_TIME_FROM = 11;

const ISO_TIME_TO = 19;

export interface HealthSnapshot {
  readonly storage: StorageSummary;
  readonly version: string | null;
  readonly uptimeMs: number;
  readonly startAttempt: number;
  readonly previousExit: string | null;
  readonly logLevel: string;
  readonly warnings: number;
  readonly errors: number;
  readonly problems: readonly Problem[];
}

const fileNameOf = (path: string): string => path.replace(/^.*[\\/]/, "");

const startLine = (copy: Copy, snapshot: HealthSnapshot): string =>
  snapshot.previousExit === null || snapshot.startAttempt <= FIRST_START
    ? copy.firstStart
    : copy.restarted(snapshot.startAttempt, snapshot.previousExit);

const tallyLine = (copy: Copy, snapshot: HealthSnapshot): string =>
  snapshot.warnings === NONE && snapshot.errors === NONE
    ? copy.noProblems
    : copy.problemTally(
        counted(copy.locale, snapshot.warnings, copy.warningForms),
        counted(copy.locale, snapshot.errors, copy.errorForms)
      );

const problemLines = (copy: Copy, problems: readonly Problem[]): readonly string[] =>
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

export const renderHealthReport = (copy: Copy, snapshot: HealthSnapshot): string =>
  [
    copy.reportTitle,
    "",
    copy.database(
      fileNameOf(snapshot.storage.file),
      humanSize(snapshot.storage.sizeBytes, copy.units)
    ),
    copy.contents(
      counted(copy.locale, snapshot.storage.players, copy.playerForms),
      counted(copy.locale, snapshot.storage.games, copy.gameForms),
      snapshot.storage.liveCards
    ),
    snapshot.storage.lastGameAt === null
      ? copy.noGamesYet
      : copy.lastGame(snapshot.storage.lastGameAt),
    "",
    snapshot.version === null ? copy.versionUnknown : copy.version(snapshot.version),
    copy.uptime(humanDuration(snapshot.uptimeMs, copy.units)),
    startLine(copy, snapshot),
    copy.logLevel(snapshot.logLevel),
    tallyLine(copy, snapshot),
    ...problemLines(copy, snapshot.problems),
  ].join("\n");

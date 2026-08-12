import type { Problem } from "#shared/logging/log-history.ts";
import type { ChatSummary, StorageSummary } from "#shared/repository/repository-contract.ts";
import type { CallTally } from "#shared/telegram/api-call-tally.ts";
import { counted } from "#shared/locale/plural-rules.ts";
import { humanDuration, humanSeconds, humanSize } from "#diagnostics/render/human-units.ts";
import type { Copy } from "#diagnostics/copy.ts";


const NONE = 0;

const FIRST_START = 1;

const ISO_TIME_FROM = 11;

const ISO_TIME_TO = 19;

export interface HealthSnapshot {
  readonly storage: StorageSummary;
  readonly chats: ChatSummary;
  readonly version: string | null;
  readonly uptimeMs: number;
  readonly startAttempt: number;
  readonly previousExit: string | null;
  readonly warnings: number;
  readonly errors: number;
  readonly problems: readonly Problem[];
  readonly calls: CallTally;
  readonly slowestRenderMs: number | null;
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

const callLine = (copy: Copy, calls: CallTally): string =>
  calls.retried === NONE && calls.rateLimit === NONE && calls.refusal === NONE
    ? copy.noCallTrouble
    : copy.callTally(
        counted(copy.locale, calls.retried, copy.retryForms),
        counted(copy.locale, calls.rateLimit, copy.limitForms),
        counted(copy.locale, calls.refusal, copy.refusalForms)
      );

const posterLines = (copy: Copy, slowestRenderMs: number | null): readonly string[] =>
  slowestRenderMs === null ? [] : [copy.slowestPoster(humanSeconds(slowestRenderMs, copy.units))];

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
    copy.chats(
      snapshot.chats.chats,
      snapshot.chats.chatsPlayedInWeek,
      snapshot.chats.chatsNewInWeek
    ),
    copy.games(snapshot.chats.gamesInDay, snapshot.chats.gamesInWeek),
    copy.languages(
      snapshot.chats.choseRussian,
      snapshot.chats.choseEnglish,
      snapshot.chats.chats - snapshot.chats.choseRussian - snapshot.chats.choseEnglish
    ),
    "",
    snapshot.version === null ? copy.versionUnknown : copy.version(snapshot.version),
    copy.uptime(humanDuration(snapshot.uptimeMs, copy.units)),
    startLine(copy, snapshot),
    tallyLine(copy, snapshot),
    callLine(copy, snapshot.calls),
    ...posterLines(copy, snapshot.slowestRenderMs),
    ...problemLines(copy, snapshot.problems),
  ].join("\n");

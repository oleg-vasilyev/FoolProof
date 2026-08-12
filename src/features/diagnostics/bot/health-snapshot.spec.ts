import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LogHistoryStub } from "#shared/logging/log-history.stub.ts";
import { ApiCallTallyStub } from "#shared/telegram/api-call-tally.stub.ts";
import { SlowestRenderStub } from "#shared/timing/slowest-render.stub.ts";
import { AppVersionStub } from "#diagnostics/bot/app-version.stub.ts";


const history = new LogHistoryStub();

const calls = new ApiCallTallyStub();

const timing = new SlowestRenderStub();

const version = new AppVersionStub();

vi.mock("#shared/logging/log-history.ts", () => history.module);

vi.mock("#shared/telegram/api-call-tally.ts", () => calls.module);

vi.mock("#shared/timing/slowest-render.ts", () => timing.module);

vi.mock("#diagnostics/bot/app-version.ts", () => version.module);

const { takeHealthSnapshot } = await import("#diagnostics/bot/health-snapshot.ts");


const START_ATTEMPT = 2;

const PREVIOUS_EXIT = "exit code 1";

const WARNINGS = 3;

const ERRORS = 1;

const UPTIME_SECONDS = 90;

const UPTIME_MS = 90_000;

const STORAGE = {
  file: "/repo/data/foolproof.db",
  sizeBytes: 40_960,
  players: 6,
  games: 28,
  liveCards: 1,
  lastGameAt: "2026-07-31 19:42:10",
};

const CHATS = {
  chats: 14,
  chatsNewInWeek: 3,
  chatsPlayedInWeek: 9,
  gamesInDay: 5,
  gamesInWeek: 31,
  choseRussian: 6,
  choseEnglish: 2,
};

const CALLS = { retried: 9, rateLimit: 1, refusal: 2 };

const SLOWEST_RENDER_MS = 2400;

describe("takeHealthSnapshot()", () => {
  let repo: RepositoryStub;

  const snapshot = () =>
    takeHealthSnapshot({
      repo,
      startAttempt: START_ATTEMPT,
      previousExit: PREVIOUS_EXIT,
    });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    repo.storageSummarySpy.mockReturnValue(STORAGE);
    repo.chatSummarySpy.mockReturnValue(CHATS);
    calls.callTallySpy.mockReturnValue(CALLS);
    timing.slowestRenderMsSpy.mockReturnValue(SLOWEST_RENDER_MS);
    history.problemTallySpy.mockReturnValue({ warn: WARNINGS, error: ERRORS });
    history.problemsSeenSpy.mockReturnValue([]);
    vi.spyOn(process, "uptime").mockReturnValue(UPTIME_SECONDS);
  });

  it("should ask the repository what is in storage", () => {
    expect(snapshot().storage).toBe(STORAGE);
  });

  it("should read the uptime in milliseconds, which is what the report formats", () => {
    expect(snapshot().uptimeMs).toBe(UPTIME_MS);
  });

  it("should carry the start attempt through", () => {
    expect(snapshot().startAttempt).toBe(START_ATTEMPT);
  });

  it("should carry the previous exit through", () => {
    expect(snapshot().previousExit).toBe(PREVIOUS_EXIT);
  });

  it("should ask the repository who has been using the bot", () => {
    expect(snapshot().chats).toBe(CHATS);
  });

  it("should take what went wrong with Telegram from the call tally", () => {
    expect(snapshot().calls).toBe(CALLS);
  });

  it("should take the slowest drawing from the render clock", () => {
    expect(snapshot().slowestRenderMs).toBe(SLOWEST_RENDER_MS);
  });

  it("should pass on that nothing has been drawn yet rather than inventing a time", () => {
    timing.slowestRenderMsSpy.mockReturnValue(null);

    expect(snapshot().slowestRenderMs).toBeNull();
  });

  it("should take the warning count from the log's own tally", () => {
    expect(snapshot().warnings).toBe(WARNINGS);
  });

  it("should take the error count from the same tally", () => {
    expect(snapshot().errors).toBe(ERRORS);
  });

  it("should include the problems the log kept", () => {
    const kept = [{ at: "2026-07-31T19:42:10.123Z", level: "warn", message: "polling: no" }];
    history.problemsSeenSpy.mockReturnValue(kept);

    expect(snapshot().problems).toBe(kept);
  });

  it("should carry the running version through", () => {
    expect(snapshot().version).toBe(version.version);
  });

  it("should read the version fresh on every call, so a deploy shows up", () => {
    snapshot();
    snapshot();

    expect(version.appVersionSpy).toHaveBeenCalledTimes(2);
  });

  it("should read the tally fresh on every call, not once at build time", () => {
    snapshot();
    snapshot();

    expect(history.problemTallySpy).toHaveBeenCalledTimes(2);
  });

  it("should count the chats fresh on every call, since that is what /status is for", () => {
    snapshot();
    snapshot();

    expect(repo.chatSummarySpy).toHaveBeenCalledTimes(2);
  });
});

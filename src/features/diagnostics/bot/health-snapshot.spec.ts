import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LogHistoryStub } from "#shared/logging/log-history.stub.ts";


const history = new LogHistoryStub();

vi.mock("#shared/logging/log-history.ts", () => history.module);

const { takeHealthSnapshot } = await import("#diagnostics/bot/health-snapshot.ts");


const LOG_LEVEL = "info";

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

describe("takeHealthSnapshot()", () => {
  let repo: RepositoryStub;

  const snapshot = () =>
    takeHealthSnapshot({
      repo,
      logLevel: LOG_LEVEL,
      startAttempt: START_ATTEMPT,
      previousExit: PREVIOUS_EXIT,
    });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    repo.storageSummarySpy.mockReturnValue(STORAGE);
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

  it("should carry the log level through", () => {
    expect(snapshot().logLevel).toBe(LOG_LEVEL);
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

  it("should read the tally fresh on every call, not once at build time", () => {
    snapshot();
    snapshot();

    expect(history.problemTallySpy).toHaveBeenCalledTimes(2);
  });
});

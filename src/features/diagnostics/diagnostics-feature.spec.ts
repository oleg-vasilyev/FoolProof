import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#diagnostics/copy.en.ts";
import { CommandContextStub } from "#diagnostics/bot/grammy-context.stub.ts";


const ONCE = 1;

const LOG_LEVEL = "info";

const START_ATTEMPT = 2;

const PREVIOUS_EXIT = "exit code 1";

const OPERATOR_TG_ID = "777";

const SNAPSHOT = { marker: "the-snapshot" };

const takeHealthSnapshotSpy = vi.fn((_deps: unknown) => SNAPSHOT);

const onStatusSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

vi.mock("#diagnostics/bot/health-snapshot.ts", () => ({
  takeHealthSnapshot: (deps: unknown) => takeHealthSnapshotSpy(deps),
}));

vi.mock("#diagnostics/bot/status-handler.ts", () => ({
  onStatus: (context: unknown, ctx: unknown) => onStatusSpy(context, ctx),
}));

const { createDiagnosticsFeature } = await import("#diagnostics/diagnostics-feature.ts");


describe("createDiagnosticsFeature()", () => {
  let repo: RepositoryStub;
  let log: LoggerStub;

  const build = () =>
    createDiagnosticsFeature({
      repo,
      log,
      logLevel: LOG_LEVEL,
      startAttempt: START_ATTEMPT,
      previousExit: PREVIOUS_EXIT,
      operatorTgId: OPERATOR_TG_ID,
    });

  const statusRoute = () => build().commands[0];

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    log = new LoggerStub();
  });

  describe("what it offers", () => {
    it("should offer exactly one command", () => {
      expect(build().commands).toHaveLength(ONCE);
    });

    it("should call it status", () => {
      expect(statusRoute()?.command).toBe("status");
    });

    it("should keep it out of the menu and out of /help", () => {
      expect(statusRoute()?.hidden).toBe(true);
    });

    it("should describe itself from the copy table", () => {
      expect(statusRoute()?.menuDescription).toBe(copy.commandStatus);
    });

    it("should take its help line from the same table", () => {
      expect(statusRoute()?.help).toBe(copy.helpStatus);
    });

    it("should listen to nothing, since it only answers a command", () => {
      expect(build().listen).toBeUndefined();
    });

    it("should have nothing to stop", () => {
      expect(build().stop).toBeUndefined();
    });
  });

  describe("what the command does", () => {
    it("should hand the update to the status handler", async () => {
      const ctx = new CommandContextStub(Number(OPERATOR_TG_ID));

      await statusRoute()?.run(ctx.context);

      expect(onStatusSpy).toHaveBeenCalledWith(expect.anything(), ctx.context);
    });

    it("should tell the handler who may ask", async () => {
      await statusRoute()?.run(new CommandContextStub(Number(OPERATOR_TG_ID)).context);

      expect(onStatusSpy.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ operatorTgId: OPERATOR_TG_ID })
      );
    });

    it("should give the handler the logger, so a refusal is visible", async () => {
      await statusRoute()?.run(new CommandContextStub(Number(OPERATOR_TG_ID)).context);

      expect(onStatusSpy.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ log }));
    });

    it("should not gather anything until the command is used", () => {
      build();

      expect(takeHealthSnapshotSpy).not.toHaveBeenCalled();
    });
  });

  describe("the snapshot it will take", () => {
    const snapshotDeps = async () => {
      await statusRoute()?.run(new CommandContextStub(Number(OPERATOR_TG_ID)).context);

      const context = onStatusSpy.mock.calls[0]?.[0] as { takeSnapshot: () => unknown };
      context.takeSnapshot();

      return takeHealthSnapshotSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    };

    it("should read from the repository it was given", async () => {
      expect(await snapshotDeps()).toEqual(expect.objectContaining({ repo }));
    });

    it("should carry the log level", async () => {
      expect(await snapshotDeps()).toEqual(expect.objectContaining({ logLevel: LOG_LEVEL }));
    });

    it("should carry which start this is", async () => {
      expect(await snapshotDeps()).toEqual(
        expect.objectContaining({ startAttempt: START_ATTEMPT })
      );
    });

    it("should carry how the previous start ended", async () => {
      expect(await snapshotDeps()).toEqual(
        expect.objectContaining({ previousExit: PREVIOUS_EXIT })
      );
    });
  });
});

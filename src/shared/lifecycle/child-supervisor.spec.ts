import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StopReason } from "#shared/lifecycle/stop-reasons.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { RestartPolicyStub } from "#shared/lifecycle/restart-policy.stub.ts";
import { SpawnStub } from "#shared/lifecycle/child-process.stub.ts";


const ONCE = 1;

const TWICE = 2;

const CLEAN_EXIT = 0;

const CRASH_EXIT = 1;

const NO_DELAY = 0;

const SECOND_SPAWN = 1;

const ONE_FAILURE = { failures: 1, everRan: false };

const HISTORY_SO_FAR = { failures: 3, everRan: true };

const RESTART_DELAY_MS = 4000;

const UPTIME_MS = 90_000;

const GRACE_MS = 5000;

const ENTRY = "D:/Temp/FoolProof/src/main.ts";

const DEATH_TEXT = "exit code 1";

const spawnStub = new SpawnStub();

const policy = new RestartPolicyStub();

const delaySpy = vi.fn(async (_ms: number): Promise<void> => undefined);

vi.mock("node:child_process", () => spawnStub.module);

vi.mock("node:timers/promises", () => ({ setTimeout: (ms: number) => delaySpy(ms) }));

vi.mock("#shared/lifecycle/restart-policy.ts", () => policy.module);

const { superviseChild } = await import("#shared/lifecycle/child-supervisor.ts");


describe("superviseChild()", () => {
  let log: LoggerStub;
  let signalHandlers: Map<string, () => void>;

  const supervise = () => superviseChild({ entry: ENTRY, log });

  const restartsOnce = (history = ONE_FAILURE) => {
    policy.planRestartSpy
      .mockReturnValueOnce({ restart: true, delayMs: RESTART_DELAY_MS, history })
      .mockReturnValue({ restart: false, reason: StopReason.Stopped, delayMs: NO_DELAY, history });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    log = new LoggerStub();
    signalHandlers = new Map();

    policy.planRestartSpy.mockReturnValue({
      restart: false,
      reason: StopReason.Stopped,
      delayMs: NO_DELAY,
      history: policy.noRuns,
    });
    policy.describeDeathSpy.mockReturnValue(DEATH_TEXT);
    delaySpy.mockResolvedValue(undefined);

    vi.spyOn(process, "once").mockImplementation(((event: string, handler: () => void) => {
      signalHandlers.set(event, handler);

      return process;
    }) as typeof process.once);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("starting the bot", () => {
    it("should run it on the same Node that is supervising", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.commandGiven()).toBe(process.execPath);
    });

    it("should run the entry it was given", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.argsGiven()).toEqual([ENTRY]);
    });

    it("should let the bot keep the terminal, so its log is the one you read", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.optionsGiven()?.stdio).toBe("inherit");
    });

    it("should tell the bot which start this is, so /status can report a restart", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.optionsGiven()?.env?.BOT_START_ATTEMPT).toBe("1");
    });

    it("should not invent a previous exit on the first start", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.optionsGiven()?.env).not.toHaveProperty("BOT_PREVIOUS_EXIT");
    });

    it("should pass the whole environment on, or the bot would lose its token", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.optionsGiven()?.env?.PATH).toBe(process.env.PATH);
    });

    it("should tell the restarted bot how the one before it died", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await vi.waitFor(() => expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE));
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.optionsGiven(SECOND_SPAWN)?.env?.BOT_PREVIOUS_EXIT).toBe(DEATH_TEXT);
    });

    it("should count the restart in what it tells the new process", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await vi.waitFor(() => expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE));
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.optionsGiven(SECOND_SPAWN)?.env?.BOT_START_ATTEMPT).toBe("2");
    });

    it("should say that it started something", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(log.infoSpy.mock.calls[0]?.[0]).toContain("starting");
    });
  });

  describe("when the bot exits", () => {
    it("should ask the policy what to do", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(policy.planRestartSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should report the exit code it died with", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await supervision;

      expect(policy.deathGiven()).toEqual(expect.objectContaining({ code: CRASH_EXIT }));
    });

    it("should report the signal that killed it", async () => {
      const supervision = supervise();
      spawnStub.exitWith(null, "SIGKILL");
      await supervision;

      expect(policy.deathGiven()).toEqual(expect.objectContaining({ signal: "SIGKILL" }));
    });

    it("should report how long it had been up, which decides the backoff", async () => {
      const supervision = supervise();
      vi.advanceTimersByTime(UPTIME_MS);
      spawnStub.exitWith(CRASH_EXIT);
      await supervision;

      expect(policy.deathGiven()).toEqual(expect.objectContaining({ upMs: UPTIME_MS }));
    });

    it("should say what the exit was when it stops for good", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(log.infoSpy.mock.calls.some((call) => String(call[0]).includes(DEATH_TEXT))).toBe(true);
    });

    it("should stop when the policy says the exit was wanted", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should start it again when the policy says to", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await vi.waitFor(() => expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE));
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE);
    });

    it("should wait as long as the policy asked before starting again", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await vi.waitFor(() => expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE));
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(delaySpy).toHaveBeenCalledWith(RESTART_DELAY_MS);
    });

    it("should carry the history into the next decision", async () => {
      restartsOnce(HISTORY_SO_FAR);

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await vi.waitFor(() => expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE));
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(policy.historyGiven(ONCE)).toBe(HISTORY_SO_FAR);
    });

    it("should start from a history of no runs at all", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(policy.historyGiven()).toBe(policy.noRuns);
    });

    it("should report a bot that never got going as a failure, not a stop", async () => {
      policy.planRestartSpy.mockReturnValue({
        restart: false,
        reason: StopReason.CannotStart,
        delayMs: NO_DELAY,
        history: ONE_FAILURE,
      });

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await supervision;

      expect(log.errorSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should say what the failed start looked like, so there is something to fix", async () => {
      policy.planRestartSpy.mockReturnValue({
        restart: false,
        reason: StopReason.CannotStart,
        delayMs: NO_DELAY,
        history: ONE_FAILURE,
      });

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await supervision;

      expect(log.errorSpy.mock.calls[0]?.[0]).toContain(DEATH_TEXT);
    });

    it("should not start it again once it has given up", async () => {
      policy.planRestartSpy.mockReturnValue({
        restart: false,
        reason: StopReason.CannotStart,
        delayMs: NO_DELAY,
        history: ONE_FAILURE,
      });

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await supervision;

      expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should say why it is starting the bot again", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      await vi.waitFor(() => expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(TWICE));
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      expect(log.warnSpy.mock.calls[0]?.[0]).toContain(DEATH_TEXT);
    });
  });

  describe("when the bot cannot even start", () => {
    it("should treat a spawn failure as a death, not hang forever", async () => {
      const supervision = supervise();
      spawnStub.failWith(new Error("EMFILE"));
      await supervision;

      expect(policy.planRestartSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should report why it could not start", async () => {
      const supervision = supervise();
      spawnStub.failWith(new Error("EMFILE"));
      await supervision;

      expect(log.errorSpy.mock.calls[0]?.[0]).toContain("EMFILE");
    });

    it("should call that a failure, not an exit of nothing in particular", async () => {
      const supervision = supervise();
      spawnStub.failWith(new Error("EMFILE"));
      await supervision;

      expect(policy.deathGiven()).toEqual(expect.objectContaining({ code: CRASH_EXIT }));
    });

    it("should still measure how long the attempt took", async () => {
      const supervision = supervise();
      vi.advanceTimersByTime(UPTIME_MS);
      spawnStub.failWith(new Error("EMFILE"));
      await supervision;

      expect(policy.deathGiven()).toEqual(expect.objectContaining({ upMs: UPTIME_MS }));
    });
  });

  describe("when it is asked to stop", () => {
    it("should listen for SIGINT", () => {
      void supervise();
      spawnStub.exitWith(CLEAN_EXIT);

      expect(signalHandlers.has("SIGINT")).toBe(true);
    });

    it("should listen for SIGTERM", () => {
      void supervise();
      spawnStub.exitWith(CLEAN_EXIT);

      expect(signalHandlers.has("SIGTERM")).toBe(true);
    });

    it("should tell the policy the stop was asked for", async () => {
      const supervision = supervise();
      signalHandlers.get("SIGINT")?.();
      spawnStub.exitWith(CRASH_EXIT);
      await supervision;

      expect(policy.stoppingGiven()).toBe(true);
    });

    it("should leave the bot to shut itself down rather than kill it at once", async () => {
      const supervision = supervise();
      signalHandlers.get("SIGINT")?.();

      expect(spawnStub.killSpy).not.toHaveBeenCalled();

      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;
    });

    it("should say that it is waiting", async () => {
      const supervision = supervise();
      signalHandlers.get("SIGINT")?.();

      expect(log.infoSpy.mock.calls.some((call) => String(call[0]).includes("waiting"))).toBe(true);

      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;
    });

    it("should kill a bot that ignores the grace it was given", async () => {
      const supervision = supervise();
      signalHandlers.get("SIGINT")?.();
      vi.advanceTimersByTime(GRACE_MS);

      expect(spawnStub.killSpy).toHaveBeenCalledTimes(ONCE);

      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;
    });

    it("should not start it again when the stop arrived during the backoff", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      signalHandlers.get("SIGINT")?.();
      await supervision;

      expect(spawnStub.spawnSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should say it dropped the restart it had already decided on", async () => {
      restartsOnce();

      const supervision = supervise();
      spawnStub.exitWith(CRASH_EXIT);
      signalHandlers.get("SIGINT")?.();
      await supervision;

      expect(log.infoSpy.mock.calls.some((call) => String(call[0]).includes("not starting"))).toBe(
        true
      );
    });

    it("should not kill a bot that shut itself down inside the grace", async () => {
      const supervision = supervise();
      signalHandlers.get("SIGINT")?.();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      vi.advanceTimersByTime(GRACE_MS);

      expect(spawnStub.killSpy).not.toHaveBeenCalled();
    });

    it("should not kill a bot that had already gone", async () => {
      const supervision = supervise();
      spawnStub.exitWith(CLEAN_EXIT);
      await supervision;

      signalHandlers.get("SIGINT")?.();
      vi.advanceTimersByTime(GRACE_MS);

      expect(spawnStub.killSpy).not.toHaveBeenCalled();
    });
  });
});

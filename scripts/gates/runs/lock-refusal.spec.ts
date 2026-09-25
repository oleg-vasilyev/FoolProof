import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOCK } from "../shared/gate-names.ts";


const lockPathOfSpy = vi.fn();

vi.mock("../shared/gate-paths.ts", () => ({
  lockPathOf: (lock: string) => lockPathOfSpy(lock),
}));

const { refusalOf, WHAT_A_LOCK_GUARDS } = await import("./lock-refusal.ts");


const HOLDER_PID = 977;

const WHERE_THE_LOCK_LIVES = "somewhere/else/the-lock-file";

const RERUN = "node scripts/gates/gate-runner.ts check:push";

const HOLDER = {
  pid: HOLDER_PID,
  command: "node scripts/gates/gate-runner.ts e2e",
  startedAt: "2026-09-25T07:06:05.432Z",
  folder: "reports/runs/e2e/2026-09-25T07-06-05.432Z-p977",
};

const LOCKS = Object.values(LOCK);

describe("WHAT_A_LOCK_GUARDS", () => {
  it("should say what every lock guards", () => {
    expect(Object.keys(WHAT_A_LOCK_GUARDS).sort()).toEqual([...LOCKS].sort());
  });

  it.each(LOCKS)("should say something about %s", (lock) => {
    expect(WHAT_A_LOCK_GUARDS[lock].trim()).not.toBe("");
  });

  it("should say something different about each lock", () => {
    expect(new Set(LOCKS.map((lock) => WHAT_A_LOCK_GUARDS[lock])).size).toBe(LOCKS.length);
  });

  it("should name the ports as what the e2e worlds lock guards", () => {
    expect(WHAT_A_LOCK_GUARDS[LOCK.e2eWorlds]).toContain("the ports e2e/world-ports.ts hands out");
  });

  it("should name the Gates paragraph as what the battery lock guards", () => {
    expect(WHAT_A_LOCK_GUARDS[LOCK.battery]).toContain("the Gates paragraph a battery writes");
  });
});

describe("refusalOf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lockPathOfSpy.mockReturnValue(WHERE_THE_LOCK_LIVES);
  });

  describe("with a holder it could read", () => {
    it.each(LOCKS)("should open with what the %s lock guards", (lock) => {
      expect(refusalOf(lock, HOLDER, RERUN).startsWith(`another run holds ${WHAT_A_LOCK_GUARDS[lock]}: `)).toBe(true);
    });

    it("should name the holder's command", () => {
      expect(refusalOf(LOCK.battery, HOLDER, RERUN)).toContain(`: \`${HOLDER.command}\` (pid`);
    });

    it("should name the holder's pid and when it started", () => {
      expect(refusalOf(LOCK.battery, HOLDER, RERUN)).toContain(`(pid 977, since ${HOLDER.startedAt}`);
    });

    it("should name the folder the holder writes into", () => {
      expect(refusalOf(LOCK.battery, HOLDER, RERUN)).toContain(`, writing into ${HOLDER.folder}/);`);
    });

    it("should say nothing of a folder when the holder writes into none", () => {
      const refusal = refusalOf(LOCK.battery, { ...HOLDER, folder: null }, RERUN);

      expect(refusal).toContain(`since ${HOLDER.startedAt}); `);
      expect(refusal).not.toContain(", writing into");
    });

    it("should end with the exact command to run once the holder has finished", () => {
      expect(refusalOf(LOCK.battery, HOLDER, RERUN).endsWith(`run \`${RERUN}\` again once it has finished`)).toBe(true);
    });

    it("should read as one whole sentence", () => {
      expect(refusalOf(LOCK.e2eWorlds, HOLDER, RERUN)).toBe(
        "another run holds the e2e worlds, the ports e2e/world-ports.ts hands out one run at a time: " +
          "`node scripts/gates/gate-runner.ts e2e` " +
          "(pid 977, since 2026-09-25T07:06:05.432Z, writing into reports/runs/e2e/2026-09-25T07-06-05.432Z-p977/); " +
          "run `node scripts/gates/gate-runner.ts check:push` again once it has finished"
      );
    });
  });

  describe("with a holder it could not read", () => {
    it.each(LOCKS)("should open with what the %s lock guards", (lock) => {
      expect(refusalOf(lock, null, RERUN).startsWith(`another run holds ${WHAT_A_LOCK_GUARDS[lock]}, but its lock`)).toBe(true);
    });

    it("should name the lock file that cannot be read", () => {
      expect(refusalOf(LOCK.battery, null, RERUN)).toContain(`but its lock ${WHERE_THE_LOCK_LIVES} cannot be read`);
    });

    it("should ask for the path of the lock it was given", () => {
      refusalOf(LOCK.e2eWorlds, null, RERUN);

      expect(lockPathOfSpy).toHaveBeenCalledWith(LOCK.e2eWorlds);
    });

    it("should end with the exact command to run in a moment", () => {
      expect(refusalOf(LOCK.battery, null, RERUN).endsWith(`; run \`${RERUN}\` again in a moment`)).toBe(true);
    });
  });
});

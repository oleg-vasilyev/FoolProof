import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS,
  KEEP_A_FINISHED_RUN_FOR_MS,
  folderArgumentOf,
  leftoverRuns,
  parsedRunId,
  runIdOf,
  type RunEntry,
} from "./run-folders.ts";


const ONE_MS = 1;

const A_MINUTE_MS = 60_000;

const NEVER = 0;

const A_PID = 4321;

const ANOTHER_PID = 977;

const A_THIRD_PID = 55_018;

const STARTED_AT = new Date("2026-09-25T08:07:06.543Z");

const NOW = new Date("2026-09-25T12:00:00.000Z");

const idAged = (ageMs: number, pid: number): string => runIdOf(new Date(NOW.getTime() - ageMs), pid);

const unfinished = (id: string): RunEntry => ({ id, finished: null });

const finishedBare = (id: string): RunEntry => ({ id, finished: { named: false } });

const finishedNamed = (id: string): RunEntry => ({ id, finished: { named: true } });

describe("runIdOf", () => {
  it("should write the start time with its colons turned to dashes, then the pid", () => {
    expect(runIdOf(STARTED_AT, A_PID)).toBe("2026-09-25T08-07-06.543Z-p4321");
  });

  it("should carry no colon, which a Windows file name cannot hold", () => {
    expect(runIdOf(STARTED_AT, A_PID)).not.toContain(":");
  });

  it("should sort lexically in the order the runs started", () => {
    const earlier = runIdOf(STARTED_AT, A_THIRD_PID);
    const later = runIdOf(new Date(STARTED_AT.getTime() + ONE_MS), A_PID);
    const latest = runIdOf(new Date(STARTED_AT.getTime() + A_MINUTE_MS), ANOTHER_PID);

    expect([latest, earlier, later].sort()).toEqual([earlier, later, latest]);
  });
});

describe("parsedRunId", () => {
  it("should read back the start time and the pid a run id was made from", () => {
    expect(parsedRunId(runIdOf(STARTED_AT, A_PID))).toEqual({ startedAt: STARTED_AT, pid: A_PID });
  });

  it.each([
    ["a stray file", "verdict.json"],
    ["a hand-made folder", "latest"],
    ["an id keeping its colons", "2026-09-25T08:07:06.543Z-p4321"],
    ["an id without milliseconds", "2026-09-25T08-07-06Z-p4321"],
    ["an id without a pid", "2026-09-25T08-07-06.543Z-p"],
    ["an id with something after the pid", "2026-09-25T08-07-06.543Z-p4321-old"],
    ["an id with something before the time", "old-2026-09-25T08-07-06.543Z-p4321"],
  ])("should return null for %s", (_what, name) => {
    expect(parsedRunId(name)).toBeNull();
  });
});

describe("leftoverRuns", () => {
  const isAlive = vi.fn<(pid: number) => boolean>();

  beforeEach(() => {
    vi.clearAllMocks();
    isAlive.mockReturnValue(true);
  });

  describe("an unfinished run", () => {
    it("should keep one whose process is alive and which is exactly at the limit", () => {
      const run = unfinished(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS, A_PID));

      expect(leftoverRuns([run], NOW, isAlive)).toEqual([]);
    });

    it("should ask whether the pid parsed from its id is alive", () => {
      leftoverRuns([unfinished(idAged(A_MINUTE_MS, ANOTHER_PID))], NOW, isAlive);

      expect(isAlive).toHaveBeenCalledWith(ANOTHER_PID);
    });

    it("should remove one whose process is dead, however young", () => {
      isAlive.mockReturnValue(false);
      const run = unfinished(idAged(A_MINUTE_MS, A_PID));

      expect(leftoverRuns([run], NOW, isAlive)).toEqual([run.id]);
    });

    it("should remove one a millisecond past the limit even while its process is alive", () => {
      const run = unfinished(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS + ONE_MS, A_PID));

      expect(leftoverRuns([run], NOW, isAlive)).toEqual([run.id]);
    });
  });

  describe("a finished run", () => {
    it("should keep one exactly at the limit", () => {
      const newest = finishedBare(idAged(ONE_MS, ANOTHER_PID));
      const atTheLimit = finishedBare(idAged(KEEP_A_FINISHED_RUN_FOR_MS, A_PID));

      expect(leftoverRuns([newest, atTheLimit], NOW, isAlive)).toEqual([]);
    });

    it("should remove a bare one a millisecond past the limit when a newer bare one is finished", () => {
      const newest = finishedBare(idAged(ONE_MS, ANOTHER_PID));
      const old = finishedBare(idAged(KEEP_A_FINISHED_RUN_FOR_MS + ONE_MS, A_PID));

      expect(leftoverRuns([newest, old], NOW, isAlive)).toEqual([old.id]);
    });

    it("should remove a named one a millisecond past the limit", () => {
      const newest = finishedBare(idAged(ONE_MS, ANOTHER_PID));
      const named = finishedNamed(idAged(KEEP_A_FINISHED_RUN_FOR_MS + ONE_MS, A_PID));

      expect(leftoverRuns([newest, named], NOW, isAlive)).toEqual([named.id]);
    });

    it("should never ask whether its process is alive", () => {
      leftoverRuns([finishedBare(idAged(A_MINUTE_MS, A_PID)), finishedNamed(idAged(A_MINUTE_MS, ANOTHER_PID))], NOW, isAlive);

      expect(isAlive).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("the newest finished bare run", () => {
    it("should be kept however old, while an older bare one listed after it goes", () => {
      const newest = finishedBare(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS, ANOTHER_PID));
      const older = finishedBare(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS + A_MINUTE_MS, A_PID));

      expect(leftoverRuns([older, newest], NOW, isAlive)).toEqual([older.id]);
    });

    it("should be chosen by its id, not by where it is listed", () => {
      const newest = finishedBare(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS, ANOTHER_PID));
      const older = finishedBare(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS + A_MINUTE_MS, A_PID));

      expect(leftoverRuns([newest, older], NOW, isAlive)).toEqual([older.id]);
    });

    it("should not be displaced by a newer named run, which goes once past the limit", () => {
      const bare = finishedBare(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS, A_PID));
      const named = finishedNamed(idAged(KEEP_A_FINISHED_RUN_FOR_MS + ONE_MS, ANOTHER_PID));

      expect(leftoverRuns([named, bare], NOW, isAlive)).toEqual([named.id]);
    });

    it("should not be displaced by a finished entry whose name sorts after every run id", () => {
      const bare = finishedBare(idAged(KEEP_A_FINISHED_RUN_FOR_MS + ONE_MS, A_PID));

      expect(leftoverRuns([finishedBare("latest"), bare], NOW, isAlive)).toEqual([]);
    });

    it("should not be displaced by a newer unfinished run", () => {
      const bare = finishedBare(idAged(GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS, A_PID));
      const running = unfinished(idAged(A_MINUTE_MS, ANOTHER_PID));

      expect(leftoverRuns([running, bare], NOW, isAlive)).toEqual([]);
    });
  });

  describe("an entry whose name is not a run id", () => {
    it.each([
      ["unfinished", unfinished("notes.txt")],
      ["finished bare", finishedBare("2026-09-25T08:07:06.543Z-p4321")],
      ["finished named", finishedNamed("latest")],
    ])("should never be touched when %s", (_what, entry) => {
      isAlive.mockReturnValue(false);

      expect(leftoverRuns([entry], NOW, isAlive)).toEqual([]);
    });

    it("should never have a pid asked about", () => {
      leftoverRuns([unfinished("notes.txt")], NOW, isAlive);

      expect(isAlive).toHaveBeenCalledTimes(NEVER);
    });
  });
});

describe("folderArgumentOf", () => {
  const A_FOLDER = "reports/runs/typecheck/2026-09-25T08-07-06.543Z-p4321";

  it("should take a folder under reports/runs/ and hand back what follows it", () => {
    expect(folderArgumentOf("mutate-changed", [A_FOLDER, "src/a.ts", "src/b.ts"])).toEqual({
      ok: true,
      folder: A_FOLDER,
      rest: ["src/a.ts", "src/b.ts"],
    });
  });

  it("should refuse no argument at all, which would have written into the root of the disk", () => {
    const refused = folderArgumentOf("typecheck", []);

    expect(refused).toEqual({
      ok: false,
      notice:
        'typecheck: the first argument must be the run folder the gate runner made under reports/runs/, and "" is not one' +
        " — run the gate through node scripts/gates/gate-runner.ts <gate>",
    });
  });

  it.each([
    ["a file named where the folder belongs", "src/a.ts"],
    ["a folder beside reports/runs/ rather than inside it", "reports/runs-elsewhere/x"],
    ["the runs folder itself, with no run in it", "reports/runs"],
  ])("should refuse %s, naming what it was given", (_what, given) => {
    const refused = folderArgumentOf("mutate-changed", [given, A_FOLDER]);

    expect(refused.ok).toBe(false);
    expect(refused.ok ? "" : refused.notice).toContain(`mutate-changed: the first argument must be`);
    expect(refused.ok ? "" : refused.notice).toContain(`"${given}" is not one`);
  });
});

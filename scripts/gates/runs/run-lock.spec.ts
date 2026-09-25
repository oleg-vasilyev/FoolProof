import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const linkSyncSpy = vi.fn();

const mkdirSyncSpy = vi.fn();

const readFileSyncSpy = vi.fn();

const renameSyncSpy = vi.fn();

const rmSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

const dirnameSpy = vi.fn();

vi.mock("node:fs", () => ({
  linkSync: (from: string, to: string) => linkSyncSpy(from, to),
  mkdirSync: (path: string, options: unknown) => mkdirSyncSpy(path, options),
  readFileSync: (path: string, encoding: string) => readFileSyncSpy(path, encoding),
  renameSync: (from: string, to: string) => renameSyncSpy(from, to),
  rmSync: (path: string, options: unknown) => rmSyncSpy(path, options),
  writeFileSync: (path: string, text: string) => writeFileSyncSpy(path, text),
}));

vi.mock("node:path", () => ({
  dirname: (path: string) => dirnameSpy(path),
}));

const { holderIn, isAlive, takeLock } = await import("./run-lock.ts");


const FIRST = 0;

const ONCE = 1;

const TWICE = 2;

const NEVER = 0;

const NO_SIGNAL = 0;

const TAKER_PID = 4321;

const HOLDER_PID = 977;

const WINNER_PID = 55_018;

const LOCK_PATH = "somewhere/else/battery.lock";

const WHERE_DIRNAME_SAID = "where-dirname-said";

const DRAFT_PATH = `${LOCK_PATH}.${String(TAKER_PID)}.draft`;

const ASIDE_PATH = `${LOCK_PATH}.${String(TAKER_PID)}.stale`;

const TAKER = {
  pid: TAKER_PID,
  command: "node scripts/gates/gate-runner.ts check:quick",
  startedAt: "2026-09-25T08:07:06.543Z",
  folder: "reports/runs/lint/2026-09-25T08-07-06.543Z-p4321",
};

const HOLDER = {
  pid: HOLDER_PID,
  command: "node scripts/gates/gate-runner.ts check:push",
  startedAt: "2026-09-25T07:00:00.000Z",
  folder: null,
};

const WINNER = {
  pid: WINNER_PID,
  command: "node scripts/gates/gate-runner.ts check:phase",
  startedAt: "2026-09-25T09:00:00.000Z",
  folder: "reports/runs/test/2026-09-25T09-00-00.000Z-p55018",
};

const errorWith = (code: string): Error => Object.assign(new Error(code), { code });

const taken = (): never => {
  throw errorWith("EEXIST");
};

const linked = (): undefined => undefined;

describe("takeLock", () => {
  const alive = vi.fn<(pid: number) => boolean>();

  beforeEach(() => {
    vi.clearAllMocks();
    renameSyncSpy.mockReset();
    dirnameSpy.mockReturnValue(WHERE_DIRNAME_SAID);
    linkSyncSpy.mockImplementation(linked);
    readFileSyncSpy.mockReturnValue(JSON.stringify(HOLDER));
    alive.mockReturnValue(true);
  });

  describe("when nobody holds the lock", () => {
    it("should make the folder the lock sits in", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(dirnameSpy).toHaveBeenCalledWith(LOCK_PATH);
      expect(mkdirSyncSpy).toHaveBeenCalledWith(WHERE_DIRNAME_SAID, { recursive: true });
    });

    it("should write the holder into a draft beside the lock", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(DRAFT_PATH, JSON.stringify(TAKER));
    });

    it("should link the draft into place and then remove the draft", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(linkSyncSpy).toHaveBeenCalledWith(DRAFT_PATH, LOCK_PATH);
      expect(rmSyncSpy).toHaveBeenCalledWith(DRAFT_PATH, { force: true });
      expect(writeFileSyncSpy.mock.invocationCallOrder[0]).toBeLessThan(linkSyncSpy.mock.invocationCallOrder[0] ?? NEVER);
      expect(linkSyncSpy.mock.invocationCallOrder[0]).toBeLessThan(rmSyncSpy.mock.invocationCallOrder[0] ?? NEVER);
    });

    it("should take the lock without reading anybody else's", () => {
      const result = takeLock(LOCK_PATH, TAKER, alive);

      expect(result.ok).toBe(true);
      expect(readFileSyncSpy).toHaveBeenCalledTimes(NEVER);
      expect(rmSyncSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should remove the lock and nothing else on release", () => {
      const result = takeLock(LOCK_PATH, TAKER, alive);
      rmSyncSpy.mockClear();

      if (result.ok) {
        result.release();
      }

      expect(rmSyncSpy).toHaveBeenCalledTimes(ONCE);
      expect(rmSyncSpy).toHaveBeenCalledWith(LOCK_PATH, { force: true });
    });
  });

  describe("when linking fails for a reason other than the lock being taken", () => {
    it("should throw that failure and still remove the draft", () => {
      const refused = errorWith("EACCES");
      linkSyncSpy.mockImplementation(() => {
        throw refused;
      });

      expect(() => takeLock(LOCK_PATH, TAKER, alive)).toThrow(refused);
      expect(rmSyncSpy).toHaveBeenCalledWith(DRAFT_PATH, { force: true });
    });
  });

  describe("when a live run holds the lock", () => {
    beforeEach(() => {
      linkSyncSpy.mockImplementation(taken);
    });

    it("should refuse with that holder", () => {
      expect(takeLock(LOCK_PATH, TAKER, alive)).toEqual({ ok: false, holder: HOLDER });
    });

    it("should read the lock and ask about the pid written in it", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(readFileSyncSpy).toHaveBeenCalledWith(LOCK_PATH, "utf8");
      expect(alive).toHaveBeenCalledWith(HOLDER_PID);
    });

    it("should remove its own draft and leave the holder's lock alone", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(rmSyncSpy).toHaveBeenCalledTimes(ONCE);
      expect(rmSyncSpy).toHaveBeenCalledWith(DRAFT_PATH, { force: true });
      expect(rmSyncSpy).not.toHaveBeenCalledWith(LOCK_PATH, expect.anything());
    });
  });

  describe("when a dead run holds the lock", () => {
    beforeEach(() => {
      alive.mockReturnValue(false);
      linkSyncSpy.mockImplementationOnce(taken).mockImplementation(linked);
    });

    it("should set the dead run's lock aside under a name of its own, and take the lock again", () => {
      const result = takeLock(LOCK_PATH, TAKER, alive);

      expect(result.ok).toBe(true);
      expect(renameSyncSpy).toHaveBeenCalledWith(LOCK_PATH, ASIDE_PATH);
      expect(linkSyncSpy).toHaveBeenCalledTimes(TWICE);
      expect(renameSyncSpy.mock.invocationCallOrder[FIRST] ?? NEVER).toBeLessThan(
        linkSyncSpy.mock.invocationCallOrder[ONCE] ?? NEVER
      );
    });

    it("should read what it set aside and remove it when it is the dead lock it read", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(readFileSyncSpy.mock.calls.map(([path]) => path)).toEqual([LOCK_PATH, ASIDE_PATH]);
      expect(rmSyncSpy).toHaveBeenCalledWith(ASIDE_PATH, { force: true });
      expect(rmSyncSpy).not.toHaveBeenCalledWith(LOCK_PATH, expect.anything());
    });

    it("should hand back a release that removes the lock taken the second time", () => {
      const result = takeLock(LOCK_PATH, TAKER, alive);
      rmSyncSpy.mockClear();

      if (result.ok) {
        result.release();
      }

      expect(rmSyncSpy).toHaveBeenCalledWith(LOCK_PATH, { force: true });
    });

    it("should link straight away when another taker set the dead lock aside first", () => {
      renameSyncSpy.mockImplementation(() => {
        throw errorWith("ENOENT");
      });

      expect(takeLock(LOCK_PATH, TAKER, alive).ok).toBe(true);
      expect(readFileSyncSpy.mock.calls.map(([path]) => path)).toEqual([LOCK_PATH]);
    });

    it("should throw a failure to set the lock aside that is not the lock being gone", () => {
      renameSyncSpy.mockImplementation(() => {
        throw errorWith("EACCES");
      });

      expect(() => takeLock(LOCK_PATH, TAKER, alive)).toThrow("EACCES");
    });
  });

  describe("when what it set aside is a live lock another taker had just made", () => {
    beforeEach(() => {
      alive.mockReturnValue(false);
      linkSyncSpy.mockImplementationOnce(taken).mockImplementation(linked);
      readFileSyncSpy.mockReturnValueOnce(JSON.stringify(HOLDER)).mockReturnValueOnce(JSON.stringify(WINNER));
    });

    it("should put that lock back where it was and refuse with its holder", () => {
      expect(takeLock(LOCK_PATH, TAKER, alive)).toEqual({ ok: false, holder: WINNER });
      expect(linkSyncSpy).toHaveBeenLastCalledWith(ASIDE_PATH, LOCK_PATH);
      expect(rmSyncSpy).toHaveBeenLastCalledWith(ASIDE_PATH, { force: true });
    });

    it("should never write a lock of its own over it", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(writeFileSyncSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should still refuse when a third taker holds the place by the time it puts the lock back", () => {
      linkSyncSpy.mockReset().mockImplementation(taken);

      expect(takeLock(LOCK_PATH, TAKER, alive)).toEqual({ ok: false, holder: WINNER });
      expect(rmSyncSpy).toHaveBeenLastCalledWith(ASIDE_PATH, { force: true });
    });

    it("should throw a failure to put it back that is not the place being taken", () => {
      linkSyncSpy.mockReset().mockImplementationOnce(taken).mockImplementation(() => {
        throw errorWith("EPERM");
      });

      expect(() => takeLock(LOCK_PATH, TAKER, alive)).toThrow("EPERM");
      expect(rmSyncSpy).toHaveBeenLastCalledWith(ASIDE_PATH, { force: true });
    });
  });

  describe("when the holder cannot be read", () => {
    beforeEach(() => {
      linkSyncSpy.mockImplementationOnce(taken).mockImplementation(linked);
    });

    it("should treat a lock that cannot be opened as dead without asking about a pid", () => {
      readFileSyncSpy.mockImplementation(() => {
        throw errorWith("ENOENT");
      });

      expect(takeLock(LOCK_PATH, TAKER, alive).ok).toBe(true);
      expect(renameSyncSpy).toHaveBeenCalledWith(LOCK_PATH, ASIDE_PATH);
      expect(alive).toHaveBeenCalledTimes(NEVER);
    });

    it("should treat a lock holding no JSON as dead without asking about a pid", () => {
      readFileSyncSpy.mockReturnValue("{half a holder");

      expect(takeLock(LOCK_PATH, TAKER, alive).ok).toBe(true);
      expect(rmSyncSpy).toHaveBeenCalledWith(ASIDE_PATH, { force: true });
      expect(alive).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("when another run wins the second race", () => {
    beforeEach(() => {
      alive.mockReturnValue(false);
      linkSyncSpy.mockImplementation(taken);
    });

    it("should refuse with whoever won, not with the dead holder it cleared", () => {
      readFileSyncSpy
        .mockReturnValueOnce(JSON.stringify(HOLDER))
        .mockReturnValueOnce(JSON.stringify(HOLDER))
        .mockReturnValueOnce(JSON.stringify(WINNER));

      expect(takeLock(LOCK_PATH, TAKER, alive)).toEqual({ ok: false, holder: WINNER });
    });

    it("should refuse with nobody when the winner's lock cannot be read", () => {
      readFileSyncSpy
        .mockReturnValueOnce(JSON.stringify(HOLDER))
        .mockReturnValueOnce(JSON.stringify(HOLDER))
        .mockImplementationOnce(() => {
          throw errorWith("ENOENT");
        });

      expect(takeLock(LOCK_PATH, TAKER, alive)).toEqual({ ok: false, holder: null });
    });

    it("should remove its draft after each attempt", () => {
      takeLock(LOCK_PATH, TAKER, alive);

      expect(rmSyncSpy.mock.calls.filter(([path]) => path === DRAFT_PATH)).toHaveLength(TWICE);
    });
  });
});

describe("isAlive", () => {
  const killSpy = vi.spyOn(process, "kill");

  beforeEach(() => {
    killSpy.mockReset();
  });

  afterEach(() => {
    killSpy.mockReset();
  });

  afterAll(() => {
    killSpy.mockRestore();
  });

  it("should send the pid no signal at all", () => {
    killSpy.mockReturnValue(true);

    isAlive(HOLDER_PID);

    expect(killSpy).toHaveBeenCalledWith(HOLDER_PID, NO_SIGNAL);
  });

  it("should call a process that answers alive", () => {
    killSpy.mockReturnValue(true);

    expect(isAlive(HOLDER_PID)).toBe(true);
  });

  it("should call a process it may not signal alive", () => {
    killSpy.mockImplementation(() => {
      throw errorWith("EPERM");
    });

    expect(isAlive(HOLDER_PID)).toBe(true);
  });

  it("should call a process that is gone dead", () => {
    killSpy.mockImplementation(() => {
      throw errorWith("ESRCH");
    });

    expect(isAlive(HOLDER_PID)).toBe(false);
  });

  it("should call it dead when the failure carries no code", () => {
    killSpy.mockImplementation(() => {
      throw new Error("EPERM");
    });

    expect(isAlive(HOLDER_PID)).toBe(false);
  });

  it("should call it dead when what was thrown is not an Error", () => {
    killSpy.mockImplementation(() => {
      throw Object.assign(Object.create(null) as object, { code: "EPERM" });
    });

    expect(isAlive(HOLDER_PID)).toBe(false);
  });
});

describe("holderIn", () => {
  it("should read a holder with a numeric pid and a string command", () => {
    expect(holderIn(JSON.stringify(WINNER))).toEqual(WINNER);
  });

  it("should read a holder writing into no folder", () => {
    expect(holderIn(JSON.stringify(HOLDER))).toEqual(HOLDER);
  });

  it.each([
    ["no text at all", null],
    ["text that is not JSON", "{half a holder"],
    ["a holder without a pid", JSON.stringify({ ...HOLDER, pid: undefined })],
    ["a holder whose pid is a string", JSON.stringify({ ...HOLDER, pid: String(HOLDER_PID) })],
    ["a holder without a command", JSON.stringify({ ...HOLDER, command: undefined })],
    ["a holder whose command is a number", JSON.stringify({ ...HOLDER, command: WINNER_PID })],
    ["JSON that is not an object", JSON.stringify(null)],
  ])("should refuse %s", (_what, text) => {
    expect(holderIn(text)).toBeNull();
  });
});

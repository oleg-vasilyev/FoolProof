import { linkSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";


const STILL_THERE_BUT_NOT_OURS = "EPERM";

const ALREADY_TAKEN = "EEXIST";

const ALREADY_GONE = "ENOENT";

const NO_SIGNAL = 0;

export interface Holder {
  readonly pid: number;
  readonly command: string;
  readonly startedAt: string;
  readonly folder: string | null;
}

export type TakenLock =
  | { readonly ok: true; readonly release: () => void }
  | { readonly ok: false; readonly holder: Holder | null };

const codeOf = (error: unknown): string | undefined =>
  error instanceof Error && "code" in error ? String(error.code) : undefined;

export const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, NO_SIGNAL);

    return true;
  } catch (error) {
    return codeOf(error) === STILL_THERE_BUT_NOT_OURS;
  }
};

export const holderIn = (text: string | null): Holder | null => {
  if (text === null) {
    return null;
  }

  try {
    const holder = JSON.parse(text) as Partial<Holder>;

    return typeof holder.pid === "number" && typeof holder.command === "string" ? (holder as Holder) : null;
  } catch {
    return null;
  }
};

const textOf = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

const linked = (path: string, holder: Holder): boolean => {
  const draft = `${path}.${String(holder.pid)}.draft`;

  writeFileSync(draft, JSON.stringify(holder));

  try {
    linkSync(draft, path);

    return true;
  } catch (error) {
    if (codeOf(error) !== ALREADY_TAKEN) {
      throw error;
    }

    return false;
  } finally {
    rmSync(draft, { force: true });
  }
};

const releaseOf = (path: string) => (): void => {
  rmSync(path, { force: true });
};

const setAside = (path: string, aside: string): boolean => {
  try {
    renameSync(path, aside);

    return true;
  } catch (error) {
    if (codeOf(error) !== ALREADY_GONE) {
      throw error;
    }

    return false;
  }
};

const putBack = (aside: string, path: string): void => {
  try {
    linkSync(aside, path);
  } catch (error) {
    if (codeOf(error) !== ALREADY_TAKEN) {
      throw error;
    }
  } finally {
    rmSync(aside, { force: true });
  }
};

type Refusal = Extract<TakenLock, { readonly ok: false }>;

const clearedStale = (path: string, stale: string | null, taker: Holder): Refusal | null => {
  const aside = `${path}.${String(taker.pid)}.stale`;

  if (!setAside(path, aside)) {
    return null;
  }

  const moved = textOf(aside);

  if (moved === stale) {
    rmSync(aside, { force: true });

    return null;
  }

  putBack(aside, path);

  return { ok: false, holder: holderIn(moved) };
};

export const takeLock = (path: string, holder: Holder, alive: (pid: number) => boolean): TakenLock => {
  mkdirSync(dirname(path), { recursive: true });

  if (linked(path, holder)) {
    return { ok: true, release: releaseOf(path) };
  }

  const stale = textOf(path);
  const current = holderIn(stale);

  if (current !== null && alive(current.pid)) {
    return { ok: false, holder: current };
  }

  const refused = clearedStale(path, stale, holder);

  if (refused !== null) {
    return refused;
  }

  if (linked(path, holder)) {
    return { ok: true, release: releaseOf(path) };
  }

  return { ok: false, holder: holderIn(textOf(path)) };
};

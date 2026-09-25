import { GATE_RUNNER } from "../shared/gate-list.ts";
import { RUNS_DIR } from "../shared/gate-paths.ts";


export const KEEP_A_FINISHED_RUN_FOR_MS = 3_600_000;

export const GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS = 86_400_000;

const A_RUN_ID = /^(\d{4}-\d\d-\d\dT)(\d\d)-(\d\d)-(\d\d\.\d{3}Z)-p(\d+)$/;

const DECIMAL = 10;

export type FolderArgument =
  | { readonly ok: true; readonly folder: string; readonly rest: readonly string[] }
  | { readonly ok: false; readonly notice: string };

export const folderArgumentOf = (script: string, args: readonly string[]): FolderArgument => {
  const [folder, ...rest] = args;

  return folder?.startsWith(`${RUNS_DIR}/`) === true
    ? { ok: true, folder, rest }
    : {
        ok: false,
        notice:
          `${script}: the first argument must be the run folder the gate runner made under ${RUNS_DIR}/, ` +
          `and "${folder ?? ""}" is not one — run the gate through node ${GATE_RUNNER} <gate>`,
      };
};

export interface RunEntry {
  readonly id: string;
  readonly finished: { readonly named: boolean } | null;
}

export interface ParsedRunId {
  readonly startedAt: Date;
  readonly pid: number;
}

export const runIdOf = (startedAt: Date, pid: number): string =>
  `${startedAt.toISOString().replaceAll(":", "-")}-p${String(pid)}`;

export const parsedRunId = (id: string): ParsedRunId | null => {
  const [, day, hours, minutes, seconds, pid] = A_RUN_ID.exec(id) ?? [];

  if (day === undefined || pid === undefined) {
    return null;
  }

  return { startedAt: new Date(`${day}${hours}:${minutes}:${seconds}`), pid: Number.parseInt(pid, DECIMAL) };
};

const newestFinishedBare = (runs: readonly RunEntry[]): string | null =>
  runs
    .filter((run) => run.finished !== null && !run.finished.named && parsedRunId(run.id) !== null)
    .map((run) => run.id)
    .sort()
    .at(-1) ?? null;

const isLeftover = (
  run: RunEntry,
  parsed: ParsedRunId,
  now: Date,
  keep: string | null,
  isAlive: (pid: number) => boolean
): boolean => {
  const age = now.getTime() - parsed.startedAt.getTime();

  if (run.finished === null) {
    return age > GIVE_UP_ON_AN_UNFINISHED_RUN_AFTER_MS || !isAlive(parsed.pid);
  }

  return run.id !== keep && age > KEEP_A_FINISHED_RUN_FOR_MS;
};

export const leftoverRuns = (
  runs: readonly RunEntry[],
  now: Date,
  isAlive: (pid: number) => boolean
): readonly string[] => {
  const keep = newestFinishedBare(runs);

  return runs.flatMap((run) => {
    const parsed = parsedRunId(run.id);

    return parsed !== null && isLeftover(run, parsed, now, keep, isAlive) ? [run.id] : [];
  });
};

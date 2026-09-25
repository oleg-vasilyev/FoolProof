import { LOCK, type Lock } from "../shared/gate-names.ts";
import { lockPathOf } from "../shared/gate-paths.ts";
import type { Holder } from "./run-lock.ts";


export const WHAT_A_LOCK_GUARDS: Readonly<Record<Lock, string>> = {
  [LOCK.e2eWorlds]: "the e2e worlds, the ports e2e/world-ports.ts hands out one run at a time",
  [LOCK.battery]: "the Gates paragraph a battery writes under reports/gates/",
};

const whereItWrites = (holder: Holder): string =>
  holder.folder === null ? "" : `, writing into ${holder.folder}/`;

export const refusalOf = (lock: Lock, holder: Holder | null, rerun: string): string =>
  holder === null
    ? `another run holds ${WHAT_A_LOCK_GUARDS[lock]}, but its lock ${lockPathOf(lock)} cannot be read; ` +
      `run \`${rerun}\` again in a moment`
    : `another run holds ${WHAT_A_LOCK_GUARDS[lock]}: \`${holder.command}\` ` +
      `(pid ${String(holder.pid)}, since ${holder.startedAt}${whereItWrites(holder)}); ` +
      `run \`${rerun}\` again once it has finished`;

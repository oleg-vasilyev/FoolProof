import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import type { Logger } from "#shared/logging/logger.ts";
import {
  describeDeath,
  planRestart,
  NO_RUNS,
  type Death,
  type RestartHistory,
} from "#shared/lifecycle/restart-policy.ts";


const STOP_SIGNALS = ["SIGINT", "SIGTERM"] as const;

const GRACE_MS = 5000;

const SPAWN_FAILED = 1;

const STILL_RUNNING = null;

export interface SupervisedProcess {
  readonly entry: string;
  readonly log: Logger;
}

interface Supervision {
  child: ChildProcess | null;
  stopping: boolean;
  history: RestartHistory;
}

const startChild = (supervised: SupervisedProcess, state: Supervision): Promise<Death> =>
  new Promise<Death>((settle) => {
    const startedAt = Date.now();
    const child = spawn(process.execPath, [supervised.entry], { stdio: "inherit" });

    state.child = child;

    child.on("exit", (code, signal) => {
      state.child = null;
      settle({ code, signal, upMs: Date.now() - startedAt });
    });

    child.on("error", (error) => {
      supervised.log.error(`could not start the bot: ${String(error)}`);
      settle({ code: SPAWN_FAILED, signal: null, upMs: Date.now() - startedAt });
    });
  });

const insistOnStopping = (child: ChildProcess): void => {
  if (child.exitCode === STILL_RUNNING) {
    child.kill();
  }
};

const acceptStop = (state: Supervision, log: Logger): void => {
  state.stopping = true;

  const child = state.child;
  if (child === null) {
    return;
  }

  log.info("waiting for the bot to finish what it was doing");
  setTimeout(() => insistOnStopping(child), GRACE_MS).unref();
};

const reportGivingUp = (
  reason: "stopped" | "cannot-start",
  death: Death,
  log: Logger
): void => {
  switch (reason) {
    case "stopped":
      log.info(`the bot stopped (${describeDeath(death)})`);

      return;

    case "cannot-start":
      log.error(
        `the bot never got going (${describeDeath(death)}) — fix what the log above says and start it again`
      );

      return;
  }
};

const listenForStop = (state: Supervision, log: Logger): void => {
  for (const signal of STOP_SIGNALS) {
    process.once(signal, () => acceptStop(state, log));
  }
};

export const superviseChild = async (supervised: SupervisedProcess): Promise<void> => {
  const { log } = supervised;
  const state: Supervision = { child: null, stopping: false, history: NO_RUNS };

  listenForStop(state, log);

  for (;;) {
    log.info("starting the bot");

    const death = await startChild(supervised, state);
    const plan = planRestart(death, state.history, state.stopping);

    state.history = plan.history;

    if (!plan.restart) {
      reportGivingUp(plan.reason, death, log);

      return;
    }

    log.warn(`the bot died (${describeDeath(death)}), starting it again in ${plan.delayMs}ms`);

    await delay(plan.delayMs);

    if (state.stopping) {
      log.info("not starting it again, since a stop was asked for meanwhile");

      return;
    }
  }
};

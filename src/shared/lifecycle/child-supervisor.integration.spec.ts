import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { describeDeath } from "#shared/lifecycle/restart-policy.ts";
import { superviseChild } from "#shared/lifecycle/child-supervisor.ts";


const SUPERVISION_TIMEOUT_MS = 30_000;

const TWO_RUNS = 2;

const CRASH_EXIT = 1;

const NO_UPTIME = 0;

const FIRST_RUN = 0;

const SECOND_RUN = 1;

const A_CHILD_THAT_DIES_ONCE = `
const { appendFileSync } = require("node:fs");

appendFileSync(
  process.env.RUN_LOG,
  JSON.stringify({
    attempt: process.env.BOT_START_ATTEMPT ?? null,
    previous: process.env.BOT_PREVIOUS_EXIT ?? null,
  }) + "\\n"
);

process.exit(process.env.BOT_START_ATTEMPT === "1" ? 1 : 0);
`;

const STOP_SIGNALS = ["SIGINT", "SIGTERM"] as const;

type StopListener = NodeJS.SignalsListener;

interface ChildRun {
  readonly attempt: string | null;
  readonly previous: string | null;
}

const listeningFor = (signal: NodeJS.Signals): readonly unknown[] => process.listeners(signal);

const forgetListenersAddedSince = (
  before: ReadonlyMap<NodeJS.Signals, readonly unknown[]>
): void => {
  for (const signal of STOP_SIGNALS) {
    const known = before.get(signal) ?? [];

    for (const listener of listeningFor(signal)) {
      if (!known.includes(listener)) {
        process.removeListener(signal, listener as StopListener);
      }
    }
  }
};

const workspace = mkdtempSync(join(tmpdir(), "foolproof-supervisor-"));

const ENTRY = join(workspace, "child-that-dies-once.cjs");

const RUN_LOG = join(workspace, "runs.jsonl");

const runsRecorded = (): readonly ChildRun[] =>
  readFileSync(RUN_LOG, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as ChildRun);

describe("the supervisor against a real child process", () => {
  let runs: readonly ChildRun[];
  let listeningBefore: ReadonlyMap<NodeJS.Signals, readonly unknown[]>;

  beforeAll(async () => {
    writeFileSync(ENTRY, A_CHILD_THAT_DIES_ONCE);
    writeFileSync(RUN_LOG, "");
    process.env.RUN_LOG = RUN_LOG;
    listeningBefore = new Map(STOP_SIGNALS.map((signal) => [signal, listeningFor(signal)]));

    await superviseChild({ entry: ENTRY, log: new LoggerStub() });

    runs = runsRecorded();
  }, SUPERVISION_TIMEOUT_MS);

  afterAll(() => {
    forgetListenersAddedSince(listeningBefore);
    delete process.env.RUN_LOG;
    rmSync(workspace, { recursive: true, force: true });
  });

  it("should start the bot again after a death it did not ask for", () => {
    expect(runs).toHaveLength(TWO_RUNS);
  });

  it("should hold nothing against the bot on the first start", () => {
    expect(runs[FIRST_RUN]).toEqual({ attempt: "1", previous: null });
  });

  it("should tell the restarted bot which attempt it is and how the last one ended", () => {
    expect(runs[SECOND_RUN]).toEqual({
      attempt: "2",
      previous: describeDeath({ code: CRASH_EXIT, signal: null, upMs: NO_UPTIME }),
    });
  });
});

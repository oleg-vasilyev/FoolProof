import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";


// Where a scenario's bot output is written, so a red e2e line can point at the log of
// the scenario that failed. The path shape is repeated once on the other side of the
// e2e wall, in scripts/gates/gate-numbers.ts, which reads it back off the results file:
// scripts/ may not import e2e/ and e2e/ imports nothing from the app, so a spec on each
// side pins the same shape.
export const BOT_LOGS = "reports/e2e/bot";

const NOT_A_FILE_NAME = /[^a-z0-9]+/g;

const A_DASH_AT_AN_END = /^-|-$/g;

export const botLogPathOf = (scenario: string): string =>
  `${BOT_LOGS}/${scenario.toLowerCase().replace(NOT_A_FILE_NAME, "-").replace(A_DASH_AT_AN_END, "")}.log`;

export type KeepBotOutput = (scenario: string, output: string) => void;

// One file per scenario, rewritten whole each time the bot stops inside it — a restart
// mid-scenario appends the second bot's output after the first, and the next run of the
// same scenario replaces the file rather than growing it.
export const writeBotLog: KeepBotOutput = (scenario, output) => {
  const path = botLogPathOf(scenario);

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, output, "utf8");
};

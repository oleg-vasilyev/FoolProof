import { readFileSync } from "node:fs";

// PreToolUse hook on Bash: a gate typed by hand — `npx tsc`, `npx eslint`,
// `node node_modules/vitest/vitest.mjs`, `npm test` — bypasses the runner that leaves
// the log and the verdict under reports/gates/, and finds no config now that the
// configs live under scripts/gates/config/. docs-check holds the documents to the
// same rule; this holds the agent's own shell. The phase that moved the configs ran
// tsc and eslint by hand ten times while writing that rule for everybody else. The
// detection is a pure function with a spec in scripts/hooks/, because nothing lints,
// typechecks or tests this file. Exit code 2 with the reason on stderr blocks the call.

const SILENT = 0;

const REFUSED = 2;

const decision = async () => {
  const event = JSON.parse(readFileSync(0, "utf8"));
  const command = event?.tool_input?.command;

  if (typeof command !== "string") {
    return null;
  }

  const { gateRunByHand } = await import("../../scripts/hooks/a-gate-run-by-hand.ts");

  return gateRunByHand(command);
};

// A hook may never break a session, so a failure here is silent to the model — but
// it says so on stderr, or a hook that cannot read its input is indistinguishable
// from one with nothing to refuse.
const refusal = await decision().catch((failure) => {
  process.stderr.write(`refuse-a-gate-run-by-hand: ${failure?.message ?? failure}\n`);

  return null;
});

if (refusal !== null) {
  process.stderr.write(`${refusal}\n`);
}

// Never process.exit() here: it abandons a pending stderr write, and on Windows a
// pipe write is asynchronous, so the reason would be dropped intermittently.
process.exitCode = refusal === null ? SILENT : REFUSED;

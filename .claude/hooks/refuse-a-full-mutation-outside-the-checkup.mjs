import { readFileSync } from "node:fs";

// PreToolUse hook on Bash and PowerShell: the full mutation run is the deep-checkup
// agent's, and until this hook that was one sentence in the agent's own file — which
// the main session never reads, and which did not stop it starting the 26-minute run
// in a phase that had agreed not to. Claude Code puts `agent_type` on the event only
// when a subagent makes the call, so the checkup passes and the main session and every
// other agent do not. PowerShell is matched too, because a checkup once ran it detached
// through Start-Process, and the Bash-only hooks never see that shell. The detection
// is a pure function with a spec in scripts/hooks/, because nothing lints, typechecks
// or tests this file. Exit code 2 with the reason on stderr blocks the call.

const SILENT = 0;

const REFUSED = 2;

const decision = async () => {
  const event = JSON.parse(readFileSync(0, "utf8"));
  const command = event?.tool_input?.command;

  if (typeof command !== "string") {
    return null;
  }

  const { fullMutationOutsideTheCheckup } = await import(
    "../../scripts/hooks/a-full-mutation-outside-the-checkup.ts"
  );

  return fullMutationOutsideTheCheckup(command, event?.agent_type);
};

// A hook may never break a session, so a failure here is silent to the model — but
// it says so on stderr, or a hook that cannot read its input is indistinguishable
// from one with nothing to refuse.
const refusal = await decision().catch((failure) => {
  process.stderr.write(`refuse-a-full-mutation-outside-the-checkup: ${failure?.message ?? failure}\n`);

  return null;
});

if (refusal !== null) {
  process.stderr.write(`${refusal}\n`);
}

// Never process.exit() here: it abandons a pending stderr write, and on Windows a
// pipe write is asynchronous, so the reason would be dropped intermittently.
process.exitCode = refusal === null ? SILENT : REFUSED;

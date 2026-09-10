import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// PreToolUse hook on every tool that names a path or runs a shell, installed by the
// benchmark runner into a clone's settings.local.json and nowhere else. The clone is
// the whole world for a benchmarked run: the hidden acceptance, the reference diff and
// the owner's memory all live outside it, and an agent running without permission
// prompts has nothing else between it and them. The fence root comes as the first
// argument; every refusal is appended to reports/benchmark-fence.log inside the clone,
// which the runner reads back into the run's record as `fence hits` — a refusal is a
// measurement about the model, not a wall that quietly held. The detection is a pure
// function with a spec in scripts/hooks/, because nothing lints, typechecks or tests
// this file. Exit code 2 with the reason on stderr blocks the call.

const SILENT = 0;

const REFUSED = 2;

const AFTER_NODE_AND_SCRIPT = 2;

// The first root is the clone; any further root is somewhere the agent may also
// write, such as the scratchpad Claude Code gives every session under the temp folder.
const FENCES = process.argv.slice(AFTER_NODE_AND_SCRIPT).filter((root) => root !== "");

const [FENCE] = FENCES;

const FENCE_LOG = "reports/benchmark-fence.log";

const decision = async () => {
  if (FENCE === undefined) {
    throw new Error("no fence root was given on the command line");
  }

  const event = JSON.parse(readFileSync(0, "utf8"));
  const { stepOutsideTheFence } = await import("../../scripts/hooks/a-step-outside-the-fence.ts");

  return stepOutsideTheFence(FENCES, event?.cwd ?? FENCE, {
    tool: event?.tool_name ?? "",
    input: event?.tool_input ?? {},
  });
};

const remember = (refusal) => {
  try {
    const log = join(FENCE, FENCE_LOG);

    mkdirSync(dirname(log), { recursive: true });
    appendFileSync(log, `${new Date().toISOString()} ${refusal}\n`, "utf8");
  } catch (failure) {
    process.stderr.write(`refuse-a-step-outside-the-fence: could not log: ${failure?.message ?? failure}\n`);
  }
};

// A hook may never break a session, so a failure here is silent to the model — but
// it says so on stderr, or a hook that cannot read its input is indistinguishable
// from one with nothing to refuse.
const refusal = await decision().catch((failure) => {
  process.stderr.write(`refuse-a-step-outside-the-fence: ${failure?.message ?? failure}\n`);

  return null;
});

if (refusal !== null) {
  remember(refusal);
  process.stderr.write(`${refusal}\n`);
}

// Never process.exit() here: it abandons a pending stderr write, and on Windows a
// pipe write is asynchronous, so the reason would be dropped intermittently.
process.exitCode = refusal === null ? SILENT : REFUSED;

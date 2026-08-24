import { readFileSync } from "node:fs";

// Stop hook: a turn that ends by announcing work rather than doing it has left
// this project half-finished before. Everything that reasons — what the last thing
// said was, and whether it was a promise — is a pure function with a spec in
// scripts/hooks/, because nothing lints, typechecks or tests this file. It must
// stay synchronous: an async Stop hook's output is never read, so it cannot block.

const SILENT = 0;

const decision = async () => {
  const event = JSON.parse(readFileSync(0, "utf8"));

  if (event?.stop_hook_active === true) {
    return null;
  }

  const { lastAssistantTextOf } = await import("../../scripts/hooks/the-last-thing-said.ts");
  const { endsOnAPromise, THE_REFUSAL } = await import(
    "../../scripts/hooks/a-turn-ending-on-a-promise.ts"
  );

  const said = lastAssistantTextOf(readFileSync(event?.transcript_path ?? "", "utf8"));

  return endsOnAPromise(said) ? THE_REFUSAL : null;
};

// A hook may never break a session, so a failure here is silent to the model — but
// it says so on stderr, or a hook that cannot read its transcript is
// indistinguishable from one with nothing to report.
const refusal = await decision().catch((failure) => {
  process.stderr.write(`refuse-a-turn-ending-on-a-promise: ${failure?.message ?? failure}\n`);

  return null;
});

if (refusal !== null) {
  process.stdout.write(JSON.stringify({ decision: "block", reason: refusal }));
}

// Never process.exit() here: it abandons a pending stdout write, and on Windows a
// pipe write is asynchronous, so the block would be dropped intermittently.
process.exitCode = SILENT;

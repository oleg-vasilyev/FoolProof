import { readFileSync } from "node:fs";

// PreToolUse hook on Bash: an unquoted heredoc, a `node -e` or a `python -c` whose
// payload carries a backslash or a non-ASCII character is rewritten by the shell on
// the way in. Phases kept breaking on it while the rule lived in prose, so the rule
// lives here. The detection is a pure function with a spec in scripts/hooks/,
// because nothing lints, typechecks or tests this file. Exit code 2 with the reason
// on stderr is what blocks the call.

const SILENT = 0;

const REFUSED = 2;

const decision = async () => {
  const event = JSON.parse(readFileSync(0, "utf8"));
  const command = event?.tool_input?.command;

  if (typeof command !== "string") {
    return null;
  }

  const { shellPayloadThatBreaks } = await import(
    "../../scripts/hooks/a-shell-payload-that-breaks.ts"
  );

  return shellPayloadThatBreaks(command);
};

// A hook may never break a session, so a failure here is silent to the model — but
// it says so on stderr, or a hook that cannot read its input is indistinguishable
// from one with nothing to refuse.
const refusal = await decision().catch((failure) => {
  process.stderr.write(`refuse-a-shell-payload-that-breaks: ${failure?.message ?? failure}\n`);

  return null;
});

if (refusal !== null) {
  process.stderr.write(`${refusal}\n`);
}

// Never process.exit() here: it abandons a pending stderr write, and on Windows a
// pipe write is asynchronous, so the reason would be dropped intermittently.
process.exitCode = refusal === null ? SILENT : REFUSED;

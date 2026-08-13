import { readFileSync } from "node:fs";
import { basename } from "node:path";

// PostToolUse hook: DEVELOPMENT-FLOW.md is the owner's map of how this product
// gets built, not a working note. Editing it quietly changes a process he reads
// as his own, so the obligation is stated at the moment of the edit rather than
// remembered at the end of a long phase. This one only speaks; the commit-msg
// hook in .githooks/ is what actually refuses.

const SILENT = 0;

const GUARDED_FILE = "DEVELOPMENT-FLOW.md";

const editedFile = () => {
  try {
    const event = JSON.parse(readFileSync(0, "utf8"));

    return event?.tool_input?.file_path ?? "";
  } catch {
    return "";
  }
};

if (basename(editedFile()) !== GUARDED_FILE) {
  process.exit(SILENT);
}

const reminder = [
  `You edited ${GUARDED_FILE}, which draws the owner's development process.`,
  "Two obligations follow, and neither is a request for permission:",
  "the commit that carries this edit needs a `Flow:` paragraph saying what moved",
  "and the counts that forced it — the commit-msg hook refuses the commit without",
  "one — and your closing message to the owner has to report the change in the",
  "same terms. See the `retrospective` skill, 'The flow this gate audits is drawn'.",
].join(" ");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: reminder },
  }),
);

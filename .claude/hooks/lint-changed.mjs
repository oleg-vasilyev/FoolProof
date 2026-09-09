import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

// PostToolUse hook: lint the single file that was just written, so a violation
// of the conventions surfaces at the edit rather than at the end of the turn.
// Exit code 2 hands the message back to Claude; anything else stays silent.

const LINT_FAILED = 2;

const NO_FILE = 0;

const changedFile = () => {
  try {
    const event = JSON.parse(readFileSync(0, "utf8"));

    return event?.tool_input?.file_path ?? "";
  } catch {
    return "";
  }
};

// The folders the lint gate covers (LINTED_FOLDERS in scripts/gates/gate-list.ts). A file the hook skips is one whose
// violation waits until the end of the turn instead of surfacing at the edit.
const LINTED_FOLDERS = ["src", "scripts", "e2e"];

const file = changedFile();
const inSource =
  file.endsWith(".ts") &&
  LINTED_FOLDERS.some((folder) => !relative(resolve(folder), file).startsWith(".."));

if (!inSource) {
  process.exit(NO_FILE);
}

// Run ESLint's own entry point rather than `npx`, so the hook needs no shell
// and stays silent when the file is clean. The config lives under scripts/gates/,
// so it is named: ESLint resolves its globs against the cwd whenever --config is
// given, and this hook assumes the project root is that cwd. From any other
// folder every file falls outside every block and ESLint exits 2 — loud, which
// is the right way for that assumption to fail.
const eslint = resolve("node_modules", "eslint", "bin", "eslint.js");

const config = "scripts/gates/config/eslint.config.js";

try {
  execFileSync(process.execPath, [eslint, "--config", config, "--quiet", file], { stdio: "pipe" });
} catch (failure) {
  process.stderr.write(String(failure.stdout ?? failure.message));
  process.exit(LINT_FAILED);
}

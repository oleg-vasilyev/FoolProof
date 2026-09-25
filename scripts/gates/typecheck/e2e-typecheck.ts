import { TYPECHECK_FINDINGS, inRun } from "../shared/gate-paths.ts";
import { say } from "../shared/say.ts";
import { folderArgumentOf } from "../runs/run-folders.ts";
import { runTypecheck } from "./typecheck-run.ts";


const THE_E2E_PROJECTS = ["e2e", "e2e/pages"];

const AFTER_NODE_AND_SCRIPT = 2;

const FAILED = 1;

if (import.meta.main) {
  const argument = folderArgumentOf("e2e-typecheck", process.argv.slice(AFTER_NODE_AND_SCRIPT));

  if (!argument.ok) {
    say(argument.notice);
    process.exit(FAILED);
  }

  process.exit(runTypecheck(THE_E2E_PROJECTS, inRun(argument.folder, TYPECHECK_FINDINGS)));
}

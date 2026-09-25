import { say } from "../shared/say.ts";
import { folderArgumentOf } from "../runs/run-folders.ts";
import { FAMILIES } from "./mutation-families.ts";
import { runStryker, worstOf } from "./stryker-run.ts";


const AFTER_NODE_AND_SCRIPT = 2;

const FAILED = 1;

export const mutateEverything = (folder: string): number =>
  worstOf(FAMILIES.map((family) => runStryker(family, folder, [])));

if (import.meta.main) {
  const argument = folderArgumentOf("mutate-everything", process.argv.slice(AFTER_NODE_AND_SCRIPT));

  if (!argument.ok) {
    say(argument.notice);
    process.exit(FAILED);
  }

  process.exit(mutateEverything(argument.folder));
}

import { homedir, tmpdir } from "node:os";
import { rootDir } from "#shared/config/env.ts";
import { benchmarkConfigOf, realFiles } from "./benchmark-config.ts";
import { realShell, runBenchmark } from "./benchmark-run.ts";


const AFTER_NODE_AND_SCRIPT = 2;

const TASK_TO_RUN = 0;

const MODEL_TO_RUN = 1;

const EFFORT_TO_RUN = 2;

const args = process.argv.slice(AFTER_NODE_AND_SCRIPT);
const config = benchmarkConfigOf(rootDir);

runBenchmark({
  root: rootDir,
  home: homedir(),
  tmp: tmpdir(),
  taskName: args[TASK_TO_RUN] ?? config.checkupTask,
  model: args[MODEL_TO_RUN] ?? config.checkupModel,
  effort: args[EFFORT_TO_RUN] ?? config.checkupEffort,
  shell: realShell,
  files: realFiles,
  say: (line) => {
    console.log(line);
  },
  now: () => new Date(),
});

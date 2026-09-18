import { TYPECHECK_FINDINGS } from "../shared/gate-paths.ts";
import { runTypecheck } from "./typecheck-run.ts";


const THE_ROOT_PROJECT = ".";

if (import.meta.main) {
  process.exit(runTypecheck([THE_ROOT_PROJECT], TYPECHECK_FINDINGS));
}

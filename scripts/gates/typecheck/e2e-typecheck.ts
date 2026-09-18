import { E2E_TYPECHECK_FINDINGS } from "../shared/gate-paths.ts";
import { runTypecheck } from "./typecheck-run.ts";


const THE_E2E_PROJECTS = ["e2e", "e2e/pages"];

if (import.meta.main) {
  process.exit(runTypecheck(THE_E2E_PROJECTS, E2E_TYPECHECK_FINDINGS));
}

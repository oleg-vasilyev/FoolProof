import { forgetScratchDatabases } from "../scratch-database.ts";
import { debounceFitsQuiet } from "./settling.ts";


export const setup = (): (() => void) => {
  debounceFitsQuiet();

  return () => {
    forgetScratchDatabases();
  };
};

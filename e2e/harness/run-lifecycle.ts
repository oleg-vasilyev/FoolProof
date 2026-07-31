import { forgetScratchDatabases } from "../scratch-database.ts";


export const setup = (): (() => void) => () => {
  forgetScratchDatabases();
};

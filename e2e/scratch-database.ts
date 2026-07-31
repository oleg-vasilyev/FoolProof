import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";


const projectRoot = resolve(import.meta.dirname, "..");

const SIDECARS = ["", "-wal", "-shm"];

const SCRATCH_FILES = /^foolproof\.e2e-.*\.db(-wal|-shm)?$/;

export const resetDatabase = (dbPath: string): void => {
  for (const sidecar of SIDECARS) {
    rmSync(resolve(projectRoot, `${dbPath}${sidecar}`), { force: true });
  }
};

export const forgetScratchDatabases = (): void => {
  const dataDir = resolve(projectRoot, "data");

  for (const file of readdirSync(dataDir)) {
    if (SCRATCH_FILES.test(file)) {
      rmSync(resolve(dataDir, file), { force: true });
    }
  }
};

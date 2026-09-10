import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";


export const BENCHMARK_DIR = "benchmark";

export const BENCHMARK_CONFIG = `${BENCHMARK_DIR}/benchmark.json`;

export const TASKS_DIR = `${BENCHMARK_DIR}/tasks`;

export const RUNS_DIR = `${BENCHMARK_DIR}/runs`;

export const RUNS_LOG = `${BENCHMARK_DIR}/RUNS.md`;

export interface BenchmarkConfig {
  readonly checkupModel: string;
  readonly checkupEffort: string | null;
  readonly checkupTask: string;
  readonly maxTurns: number;
  readonly maxBudgetUsd: number;
}

export interface Files {
  read(file: string): string | null;
  write(file: string, text: string): void;
  remove(path: string): void;
  mkdir(path: string): void;
}

export const realFiles: Files = {
  read: (file) => (existsSync(file) ? readFileSync(file, "utf8") : null),
  write: (file, text) => {
    writeFileSync(file, text, "utf8");
  },
  remove: (path) => {
    rmSync(path, { recursive: true, force: true });
  },
  mkdir: (path) => {
    mkdirSync(path, { recursive: true });
  },
};

export const mustRead = (files: Files, file: string): string => {
  const text = files.read(file);

  if (text === null) {
    throw new Error(`${file} is missing`);
  }

  return text;
};

export const benchmarkConfigOf = (root: string, files: Files = realFiles): BenchmarkConfig =>
  JSON.parse(mustRead(files, join(root, BENCHMARK_CONFIG))) as BenchmarkConfig;

import { execFileSync, spawnSync } from "node:child_process";


const BASELINE = process.env.MUTATE_AGAINST ?? "origin/main";

const NOTHING = 0;

const MUTABLE = /^src\/.*\.ts$/;

const NOT_MUTABLE = /\.(spec|stub)\.ts$|sqlite-connection\.ts$|repository-(instance|contract)\.ts$/;

const gitLines = (...args: readonly string[]): readonly string[] =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > NOTHING);

const changedFiles = (): readonly string[] => [
  ...gitLines("diff", "--name-only", BASELINE),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
];

const mutableChanges = (): readonly string[] => [
  ...new Set(changedFiles().filter((file) => MUTABLE.test(file) && !NOT_MUTABLE.test(file))),
];

const run = (): number => {
  const files = mutableChanges();

  if (files.length === NOTHING) {
    console.log(`no mutable source changed against ${BASELINE} — nothing to mutate`);

    return NOTHING;
  }

  console.log(`mutating ${String(files.length)} changed file(s):`);
  for (const file of files) {
    console.log(`  ${file}`);
  }

  const stryker = spawnSync("npx", ["stryker", "run", "--mutate", files.join(",")], {
    stdio: "inherit",
    shell: true,
  });

  return stryker.status ?? NOTHING;
};

process.exit(run());

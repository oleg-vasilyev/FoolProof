import { describe, expect, it } from "vitest";
import {
  ALL_GATES,
  BATTERIES,
  THE_CHECK_GATES,
  THE_FULL_MUTATION,
  THE_PHASE_GATES,
  THE_PUSH_GATES,
  THE_RELEASE_GATES,
  THE_SINGLE_GATES,
  COMMANDS,
  describeStep,
  isBattery,
  isGate,
  rerunCommandFor,
  stepsFor,
} from "./gate-list.ts";
import { BATTERY, GATE, LOCK } from "./gate-names.ts";


const A_RUN = "reports/runs/x/a-run";

const ANOTHER_RUN = "reports/runs/y/another-run";

const VITEST_BIN = "node_modules/vitest/vitest.mjs";

const VITEST_CONFIG = "scripts/gates/test/vitest.config.ts";

const RESULTS_INTO_A_RUN = "--outputFile.json=reports/runs/x/a-run/results.json";

const FIRST = 0;

const NONE = 0;

describe("the four batteries", () => {
  it("should make check the everyday gate: lint, types, documents, the suite under coverage", () => {
    expect(THE_CHECK_GATES).toEqual([GATE.lint, GATE.typecheck, GATE.checkDocs, GATE.coverage]);
  });

  it("should make check:push what CI holds every push to: both typechecks, the harness units, documents", () => {
    expect(THE_PUSH_GATES).toEqual([GATE.lint, GATE.typecheck, GATE.e2eTypecheck, GATE.harness, GATE.checkDocs]);
  });

  it("should be the five phase gates, in the order the chain ran them", () => {
    expect(THE_PHASE_GATES).toEqual([
      GATE.lint,
      GATE.typecheck,
      GATE.coverage,
      GATE.mutationChanged,
      GATE.e2eChanged,
    ]);
  });

  it("should make the release the push gates, then coverage, mutation over the diff, every scenario", () => {
    expect(THE_RELEASE_GATES).toEqual([
      ...THE_PUSH_GATES,
      GATE.coverage,
      GATE.mutationChanged,
      GATE.e2e,
    ]);
  });

  it("should never run the full mutation in any battery, since that is the checkup's", () => {
    for (const gates of Object.values(BATTERIES)) {
      expect(gates).not.toContain(THE_FULL_MUTATION);
    }
    expect(THE_FULL_MUTATION).toBe(GATE.mutation);
  });

  it("should name each battery after the npm script that runs it", () => {
    expect(Object.keys(BATTERIES)).toEqual([BATTERY.quick, BATTERY.push, BATTERY.phase, BATTERY.release]);
    expect(BATTERIES[BATTERY.phase]).toBe(THE_PHASE_GATES);
  });
});

describe("ALL_GATES, isGate() and isBattery()", () => {
  it("should know every gate of every battery and the full mutation, each once", () => {
    const expected = new Set([...Object.values(BATTERIES).flat(), ...THE_SINGLE_GATES, THE_FULL_MUTATION]);

    expect([...ALL_GATES].sort()).toEqual([...expected].sort());
    expect(new Set(ALL_GATES).size).toBe(ALL_GATES.length);
  });

  it("should accept a gate by name and refuse anything else, an absent name included", () => {
    expect(isGate(GATE.mutation)).toBe(true);
    expect(isGate(GATE.e2e)).toBe(true);
    expect(isGate("nonsense")).toBe(false);
    expect(isGate(undefined)).toBe(false);
  });

  it("should accept a battery by its script name and refuse a gate, a prototype key or nothing", () => {
    expect(isBattery(BATTERY.release)).toBe(true);
    expect(isBattery(GATE.lint)).toBe(false);
    expect(isBattery("toString")).toBe(false);
    expect(isBattery(undefined)).toBe(false);
  });
});

describe("COMMANDS", () => {
  it("should run every tool by its entry file under node_modules, never by a name PATH has to find", () => {
    for (const command of Object.values(COMMANDS)) {
      for (const step of command.steps(A_RUN)) {
        expect(step.bin).toMatch(/^(node_modules\/|scripts\/).*\.(js|mjs|ts)$|^node_modules\/typescript\/bin\/tsc$/);
      }
    }
  });

  it("should spell the run's folder into the steps, so two runs of one gate write apart", () => {
    for (const command of Object.values(COMMANDS)) {
      expect(command.steps(A_RUN)).not.toEqual(command.steps(ANOTHER_RUN));
    }
  });

  it("should lint the three linted roots quietly, through the moved config, into the run's findings file", () => {
    expect(COMMANDS[GATE.lint].steps(A_RUN)).toEqual([
      {
        bin: "node_modules/eslint/bin/eslint.js",
        args: [
          "--config",
          "scripts/gates/lint/eslint.config.js",
          "--quiet",
          "--format",
          "json",
          "--output-file",
          "reports/runs/x/a-run/lint-findings.json",
          "src",
          "scripts",
          "e2e",
        ],
      },
    ]);
  });

  it("should run the suite through the moved vitest config, its results written into the run", () => {
    expect(COMMANDS[GATE.test].steps(A_RUN)).toEqual([
      { bin: VITEST_BIN, args: ["run", "--config", VITEST_CONFIG, RESULTS_INTO_A_RUN] },
    ]);
  });

  it("should add coverage only for the coverage gate, its report folder inside the run", () => {
    expect(COMMANDS[GATE.coverage].steps(A_RUN)).toEqual([
      {
        bin: VITEST_BIN,
        args: [
          "run",
          "--config",
          VITEST_CONFIG,
          RESULTS_INTO_A_RUN,
          "--coverage",
          "--coverage.reportsDirectory=reports/runs/x/a-run/coverage",
        ],
      },
    ]);
  });

  it("should run both e2e configurations from the gate that owns them, each writing results into the run", () => {
    expect(COMMANDS[GATE.e2e].steps(A_RUN)).toEqual([
      { bin: VITEST_BIN, args: ["run", "--config", "scripts/gates/e2e/vitest.e2e.config.ts", RESULTS_INTO_A_RUN] },
    ]);
    expect(COMMANDS[GATE.harness].steps(A_RUN)).toEqual([
      {
        bin: VITEST_BIN,
        args: ["run", "--config", "scripts/gates/e2e/vitest.harness.config.ts", RESULTS_INTO_A_RUN],
      },
    ]);
  });

  it("should hand our own scripts the run's folder as their only argument", () => {
    const ours = [
      [GATE.typecheck, "scripts/gates/typecheck/typecheck.ts"],
      [GATE.e2eTypecheck, "scripts/gates/typecheck/e2e-typecheck.ts"],
      [GATE.checkDocs, "scripts/gates/check-docs/check-docs.ts"],
      [GATE.e2eChanged, "scripts/gates/e2e/e2e-changed.ts"],
      [GATE.mutationChanged, "scripts/gates/mutation/mutate-changed.ts"],
      [GATE.mutation, "scripts/gates/mutation/mutate-everything.ts"],
    ] as const;

    for (const [gate, bin] of ours) {
      expect(COMMANDS[gate].steps(A_RUN)).toEqual([{ bin, args: [A_RUN] }]);
    }
  });

  it("should let only test and test:mutation-changed take files", () => {
    const taking = Object.entries(COMMANDS)
      .filter(([, command]) => command.takesFiles)
      .map(([gate]) => gate);

    expect(taking).toEqual([GATE.test, GATE.mutationChanged]);
  });

  it("should make only the two e2e gates hold the e2e worlds' lock, so a second e2e run refuses", () => {
    const holding = Object.entries(COMMANDS)
      .filter(([, command]) => command.holds === LOCK.e2eWorlds)
      .map(([gate]) => gate);

    expect(holding).toEqual([GATE.e2e, GATE.e2eChanged]);
  });

  it("should let every other gate hold no lock at all, the battery's lock included", () => {
    const others = Object.entries(COMMANDS).filter(([, command]) => command.holds !== LOCK.e2eWorlds);

    expect(others.length).toBeGreaterThan(NONE);
    for (const [, command] of others) {
      expect(command.holds).toBeNull();
    }
  });
});

describe("stepsFor()", () => {
  it("should hand back the gate's own steps for a folder when no file is named", () => {
    const steps = stepsFor(GATE.lint, []);

    expect(steps.ok).toBe(true);
    expect(steps.ok ? steps.steps(A_RUN) : []).toEqual(COMMANDS[GATE.lint].steps(A_RUN));
  });

  it("should append the files after the folder's arguments for a gate that takes them", () => {
    const steps = stepsFor(GATE.test, ["src/a.spec.ts", "src/b.spec.ts"]);

    expect(steps.ok ? steps.steps(A_RUN) : []).toEqual([
      {
        bin: VITEST_BIN,
        args: ["run", "--config", VITEST_CONFIG, RESULTS_INTO_A_RUN, "src/a.spec.ts", "src/b.spec.ts"],
      },
    ]);
  });

  it("should hand the mutation over named files the folder first and the files after it", () => {
    const steps = stepsFor(GATE.mutationChanged, ["src/a.ts"]);

    expect(steps.ok ? steps.steps(A_RUN)[FIRST]?.args : []).toEqual([A_RUN, "src/a.ts"]);
  });

  it("should refuse files for a gate that takes none, naming the gates that do", () => {
    const refused = stepsFor(GATE.lint, ["src/a.ts"]);

    expect(refused.ok).toBe(false);
    expect(refused.ok ? "" : refused.notice).toContain("lint takes no files");
    expect(refused.ok ? "" : refused.notice).toContain("test and test:mutation-changed");
  });
});

describe("describeStep() and rerunCommandFor()", () => {
  it("should spell a step the way a reader would type it", () => {
    expect(describeStep({ bin: "node_modules/typescript/bin/tsc", args: ["--noEmit"] })).toBe(
      "node node_modules/typescript/bin/tsc --noEmit"
    );
  });

  it("should re-run one gate through the gate runner, never through an npm battery", () => {
    expect(rerunCommandFor(GATE.e2eChanged)).toBe("node scripts/gates/gate-runner.ts e2e:changed");
  });

  it("should spell the files a named run was given, so the re-run covers the same ones", () => {
    expect(rerunCommandFor(GATE.test, ["src/a.spec.ts", "src/b.spec.ts"])).toBe(
      "node scripts/gates/gate-runner.ts test src/a.spec.ts src/b.spec.ts"
    );
  });
});

describe("the single gates", () => {
  it("should offer test as a gate the runner knows and no battery walks", () => {
    expect(THE_SINGLE_GATES).toEqual([GATE.test]);
    expect(isGate(GATE.test)).toBe(true);

    for (const gates of Object.values(BATTERIES)) {
      expect(gates).not.toContain(GATE.test);
    }
  });
});

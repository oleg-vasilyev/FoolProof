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


describe("the four batteries", () => {
  it("should make check the everyday gate: lint, types, documents, the suite under coverage", () => {
    expect(THE_CHECK_GATES).toEqual(["lint", "typecheck", "docs-check", "test:coverage"]);
  });

  it("should make check:push what CI holds every push to: both typechecks, the harness units, documents", () => {
    expect(THE_PUSH_GATES).toEqual(["lint", "typecheck", "e2e:typecheck", "test:e2e-harness", "docs-check"]);
  });

  it("should be the five phase gates, in the order the chain ran them", () => {
    expect(THE_PHASE_GATES).toEqual([
      "lint",
      "typecheck",
      "test:coverage",
      "test:mutation:changed",
      "e2e:changed",
    ]);
  });

  it("should make the release the push gates, then coverage, mutation over the diff, every scenario", () => {
    expect(THE_RELEASE_GATES).toEqual([
      ...THE_PUSH_GATES,
      "test:coverage",
      "test:mutation:changed",
      "e2e",
    ]);
  });

  it("should never run the full mutation in any battery, since that is the checkup's", () => {
    for (const gates of Object.values(BATTERIES)) {
      expect(gates).not.toContain(THE_FULL_MUTATION);
    }
    expect(THE_FULL_MUTATION).toBe("test:mutation");
  });

  it("should name each battery after the npm script that runs it", () => {
    expect(Object.keys(BATTERIES)).toEqual(["check:quick", "check:push", "check:phase", "check:release"]);
    expect(BATTERIES["check:phase"]).toBe(THE_PHASE_GATES);
  });
});

describe("ALL_GATES, isGate() and isBattery()", () => {
  it("should know every gate of every battery and the full mutation, each once", () => {
    const expected = new Set([...Object.values(BATTERIES).flat(), ...THE_SINGLE_GATES, THE_FULL_MUTATION]);

    expect([...ALL_GATES].sort()).toEqual([...expected].sort());
    expect(new Set(ALL_GATES).size).toBe(ALL_GATES.length);
  });

  it("should accept a gate by name and refuse anything else, an absent name included", () => {
    expect(isGate("test:mutation")).toBe(true);
    expect(isGate("e2e")).toBe(true);
    expect(isGate("nonsense")).toBe(false);
    expect(isGate(undefined)).toBe(false);
  });

  it("should accept a battery by its script name and refuse a gate, a prototype key or nothing", () => {
    expect(isBattery("check:release")).toBe(true);
    expect(isBattery("lint")).toBe(false);
    expect(isBattery("toString")).toBe(false);
    expect(isBattery(undefined)).toBe(false);
  });
});

describe("COMMANDS", () => {
  it("should run every tool by its entry file under node_modules, never by a name PATH has to find", () => {
    for (const command of Object.values(COMMANDS)) {
      for (const step of command.steps) {
        expect(step.bin).toMatch(/^(node_modules\/|scripts\/).*\.(js|mjs|ts)$|^node_modules\/typescript\/bin\/tsc$/);
      }
    }
  });

  it("should lint the three linted roots quietly, through the config under scripts/gates/config/", () => {
    expect(COMMANDS.lint.steps).toEqual([
      {
        bin: "node_modules/eslint/bin/eslint.js",
        args: ["--config", "scripts/gates/config/eslint.config.js", "--quiet", "src", "scripts", "e2e"],
      },
    ]);
  });

  it("should run the suite through the moved vitest config, with coverage only for the coverage gate", () => {
    expect(COMMANDS.test.steps).toEqual([
      { bin: "node_modules/vitest/vitest.mjs", args: ["run", "--config", "scripts/gates/config/vitest.config.ts"] },
    ]);
    expect(COMMANDS["test:coverage"].steps[0]?.args).toEqual([
      "run",
      "--config",
      "scripts/gates/config/vitest.config.ts",
      "--coverage",
    ]);
  });

  it("should leave the e2e configs in e2e/, which is its own world", () => {
    expect(COMMANDS.e2e.steps[0]?.args).toContain("e2e/vitest.e2e.config.ts");
    expect(COMMANDS["test:e2e-harness"].steps[0]?.args).toContain("e2e/vitest.harness.config.ts");
  });

  it("should make e2e:typecheck two tsc steps, the harness then its pages, and the full mutation one Stryker step per family", () => {
    expect(COMMANDS["e2e:typecheck"].steps.map((step) => step.args)).toEqual([
      ["-p", "e2e", "--noEmit"],
      ["-p", "e2e/pages", "--noEmit"],
    ]);
    expect(COMMANDS["test:mutation"].steps.map((step) => step.args)).toEqual([
      ["run", "scripts/gates/config/stryker.config.json"],
      ["run", "scripts/gates/config/stryker.scripts.json"],
    ]);
  });

  it("should let only test and test:mutation:changed take files", () => {
    const taking = Object.entries(COMMANDS)
      .filter(([, command]) => command.takesFiles)
      .map(([gate]) => gate);

    expect(taking).toEqual(["test", "test:mutation:changed"]);
  });
});

describe("stepsFor()", () => {
  it("should hand back the gate's own steps when no file is named", () => {
    expect(stepsFor("lint", [])).toEqual({ ok: true, steps: COMMANDS.lint.steps });
  });

  it("should append the files to the step of a gate that takes them", () => {
    expect(stepsFor("test", ["src/a.spec.ts", "src/b.spec.ts"])).toEqual({
      ok: true,
      steps: [
        {
          bin: "node_modules/vitest/vitest.mjs",
          args: ["run", "--config", "scripts/gates/config/vitest.config.ts", "src/a.spec.ts", "src/b.spec.ts"],
        },
      ],
    });
  });

  it("should refuse files for a gate that takes none, naming the gates that do", () => {
    const refused = stepsFor("lint", ["src/a.ts"]);

    expect(refused.ok).toBe(false);
    expect(refused.ok ? "" : refused.notice).toContain("lint takes no files");
    expect(refused.ok ? "" : refused.notice).toContain("test and test:mutation:changed");
  });
});

describe("describeStep() and rerunCommandFor()", () => {
  it("should spell a step the way a reader would type it", () => {
    expect(describeStep({ bin: "node_modules/typescript/bin/tsc", args: ["--noEmit"] })).toBe(
      "node node_modules/typescript/bin/tsc --noEmit"
    );
  });

  it("should re-run one gate through the gate runner, never through an npm battery", () => {
    expect(rerunCommandFor("e2e:changed")).toBe("node scripts/gates/gate-runner.ts e2e:changed");
  });
});

describe("the single gates", () => {
  it("should offer test as a gate the runner knows and no battery walks", () => {
    expect(THE_SINGLE_GATES).toEqual(["test"]);
    expect(isGate("test")).toBe(true);

    for (const gates of Object.values(BATTERIES)) {
      expect(gates).not.toContain("test");
    }
  });
});

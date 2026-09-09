import { describe, expect, it } from "vitest";
import {
  ALL_GATES,
  BATTERIES,
  THE_CHECK_GATES,
  THE_FULL_MUTATION,
  THE_PHASE_GATES,
  THE_PUSH_GATES,
  THE_RELEASE_GATES,
  commandFor,
  isBattery,
  isGate,
  rerunCommandFor,
} from "./gate-list.ts";


describe("the four batteries", () => {
  it("should make check the everyday gate: lint, types, documents, the suite under coverage", () => {
    expect(THE_CHECK_GATES).toEqual(["lint", "typecheck", "docs:check", "test:coverage"]);
  });

  it("should make check:push what CI holds every push to: both typechecks, the harness units, documents", () => {
    expect(THE_PUSH_GATES).toEqual(["lint", "typecheck", "e2e:typecheck", "test:e2e-harness", "docs:check"]);
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
    expect(Object.keys(BATTERIES)).toEqual(["check", "check:push", "check:phase", "check:release"]);
    expect(BATTERIES["check:phase"]).toBe(THE_PHASE_GATES);
  });
});

describe("ALL_GATES, isGate() and isBattery()", () => {
  it("should know every gate of every battery and the full mutation, each once", () => {
    const expected = new Set([...Object.values(BATTERIES).flat(), THE_FULL_MUTATION]);

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

describe("commandFor() and rerunCommandFor()", () => {
  it("should name the npm script that runs one gate", () => {
    expect(commandFor("test:coverage")).toBe("npm run test:coverage");
  });

  it("should re-run one gate through the gate runner, never through an npm battery", () => {
    expect(rerunCommandFor("e2e:changed")).toBe("node scripts/gate-runner.ts e2e:changed");
  });
});

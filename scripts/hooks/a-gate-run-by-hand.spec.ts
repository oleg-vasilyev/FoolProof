import { describe, expect, it } from "vitest";
import { GATE_RUNNER, gateRunByHand, toolsRunByHandIn } from "./a-gate-run-by-hand.ts";


describe("toolsRunByHandIn()", () => {
  it("should find a tool run through npx, with or without --no-install", () => {
    expect(toolsRunByHandIn("cd x && npx eslint src")).toEqual(["npx eslint"]);
    expect(toolsRunByHandIn("npx --no-install vitest run a.spec.ts")).toEqual(["npx --no-install vitest"]);
  });

  it("should find a tool run from node_modules/.bin or by its entry file", () => {
    expect(toolsRunByHandIn("node_modules/.bin/tsc --noEmit")).toEqual(["node_modules/.bin/tsc"]);
    expect(toolsRunByHandIn("node node_modules/typescript/bin/tsc --noEmit")).toEqual([
      "node_modules/typescript/bin/tsc",
    ]);
    expect(toolsRunByHandIn("node node_modules/@stryker-mutator/core/bin/stryker.js run")).toEqual([
      "node_modules/@stryker-mutator/core/bin/stryker.js",
    ]);
  });

  it("should find npm test but not npm test:coverage, which is no script either way", () => {
    expect(toolsRunByHandIn("npm test")).toEqual(["npm test"]);
    expect(toolsRunByHandIn("npm test:coverage")).toEqual([]);
  });

  it("should read the command through any run of spaces, and only at a word's start", () => {
    expect(toolsRunByHandIn("npm   test")).toEqual(["npm   test"]);
    expect(toolsRunByHandIn("cd x;  npx  --no-install  eslint src")).toEqual(["npx  --no-install  eslint"]);
    expect(toolsRunByHandIn("xnpm test; snpx tsc")).toEqual([]);
    expect(toolsRunByHandIn("npm testing")).toEqual([]);
  });

  it("should leave a tool's name in prose and a different package alone", () => {
    expect(toolsRunByHandIn('echo "eslint and vitest are the tools"; npx tsc-files a.ts')).toEqual([]);
    expect(toolsRunByHandIn("node node_modules/eslint/lib/api.js")).toEqual([]);
  });
});

describe("gateRunByHand()", () => {
  it("should say nothing for a command that runs no tool by hand", () => {
    expect(gateRunByHand("git status && node scripts/tools/tools.ts gallery")).toBeNull();
  });

  it("should let a command through the runner pass whatever it mentions, since the runner owns the tools", () => {
    expect(gateRunByHand(`node ${GATE_RUNNER} lint && echo node_modules/.bin/eslint`)).toBeNull();
  });

  it("should refuse a tool run by hand, naming it and every gate the runner offers instead", () => {
    const refusal = gateRunByHand("npx tsc --noEmit && node node_modules/vitest/vitest.mjs run");

    expect(refusal?.split("\n")).toEqual([
      "Refused: npx tsc, node_modules/vitest/vitest.mjs runs a gate by hand.",
      `Every gate runs through node ${GATE_RUNNER} <gate> — lint, typecheck, e2e:typecheck,`,
      "docs-check, test [files], test:coverage, test:mutation:changed [files], test:mutation,",
      "e2e, e2e:changed, test:e2e-harness — which leaves the log and the verdict under",
      "reports/gates/ and names the config, now that the configs live in scripts/gates/config/",
      "and the tool's bare name finds none.",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { VITEST_CONFIG } from "../shared/gate-paths.ts";
import { FAMILIES, FAMILY_NAMES } from "./mutation-families.ts";


describe("FAMILIES", () => {
  it("should know the two families, source first, each with its config and the report its run writes into its folder", () => {
    expect(FAMILIES).toEqual([
      {
        family: "source",
        config: "scripts/gates/mutation/stryker.config.json",
        report: "mutation-source.json",
      },
      {
        family: "tooling",
        config: "scripts/gates/mutation/stryker.scripts.json",
        report: "mutation-tooling.json",
      },
    ]);
  });

  it("should give each family a report of its own, both being written into the one run folder", () => {
    const reports = FAMILIES.map((family) => family.report);

    expect(new Set(reports).size).toBe(reports.length);
  });

  it("should list the names in the same order", () => {
    expect(FAMILY_NAMES).toEqual(["source", "tooling"]);
  });
});

describe.each(FAMILIES)("the $family family's Stryker config", ({ config }) => {
  const parsed = JSON.parse(readFileSync(config, "utf8")) as { vitest?: { configFile?: string } };

  it("should name the vitest config the test gate runs, so the dry run never reaches a spec outside its include list", () => {
    expect(parsed.vitest?.configFile).toBe(VITEST_CONFIG);
  });

  it("should name a vitest config that exists", () => {
    expect(existsSync(parsed.vitest?.configFile ?? "")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { VITEST_CONFIG } from "../shared/gate-paths.ts";
import { FAMILIES, FAMILY_NAMES, familyReports } from "./mutation-families.ts";


describe("FAMILIES", () => {
  it("should know the two families, source first, each with its config and the report that config writes", () => {
    expect(FAMILIES).toEqual([
      {
        family: "source",
        config: "scripts/gates/mutation/stryker.config.json",
        report: "reports/mutation/mutation.json",
      },
      {
        family: "tooling",
        config: "scripts/gates/mutation/stryker.scripts.json",
        report: "reports/mutation-scripts/mutation.json",
      },
    ]);
  });

  it("should list the names in the same order", () => {
    expect(FAMILY_NAMES).toEqual(["source", "tooling"]);
  });
});

describe("familyReports", () => {
  it("should name every family's report, so the runner forgets each before a run", () => {
    expect(familyReports()).toEqual(FAMILIES.map((family) => family.report));
  });

  it("should hand back at least one, which is what lets a gate declare a file at all", () => {
    const [first] = familyReports();

    expect(typeof first).toBe("string");
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

import { describe, expect, it } from "vitest";
import { FAMILIES, FAMILY_NAMES } from "./mutation-families.ts";


describe("FAMILIES", () => {
  it("should know the two families, source first, each with its config and the report that config writes", () => {
    expect(FAMILIES).toEqual([
      { family: "source", config: "stryker.config.json", report: "reports/mutation/mutation.json" },
      {
        family: "tooling",
        config: "stryker.scripts.json",
        report: "reports/mutation-scripts/mutation.json",
      },
    ]);
  });

  it("should list the names in the same order", () => {
    expect(FAMILY_NAMES).toEqual(["source", "tooling"]);
  });
});

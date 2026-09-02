import { describe, expect, it } from "vitest";
import { namedIn, ownedOrRefuse, strayIn } from "./tidy-reports.ts";


const A_CONFIG = 'reportsDirectory: "reports/coverage",';

const TWO_CONFIGS = '"reports/mutation/mutation.json" and "reports/.stryker-tmp"';

const A_PROSE_MENTION = "Every artefact a check produces goes under reports/, which is gitignored.";

describe("namedIn()", () => {
  it("should read the entry a config writes into", () => {
    expect(namedIn(A_CONFIG)).toEqual(["coverage"]);
  });

  it("should read every entry a file names, not only the first", () => {
    expect(namedIn(TWO_CONFIGS)).toEqual(["mutation", ".stryker-tmp"]);
  });

  it("should take the entry alone, leaving the file path under it out", () => {
    expect(namedIn('"reports/mutation-scripts/index.html"')).toEqual(["mutation-scripts"]);
  });

  it("should ignore the folder named with nothing under it, which owns no entry", () => {
    expect(namedIn(A_PROSE_MENTION)).toEqual([]);
  });
});

describe("ownedOrRefuse()", () => {
  it("should hand back what the file names", () => {
    expect(ownedOrRefuse("stryker.config.json", ["mutation"])).toEqual(["mutation"]);
  });

  it("should refuse a file that has stopped naming any entry, rather than owning none", () => {
    expect(() => ownedOrRefuse("vitest.config.ts", [])).toThrow("vitest.config.ts");
  });
});

describe("strayIn()", () => {
  it("should keep an entry a file names", () => {
    expect(strayIn(["coverage"], ["coverage"])).toEqual([]);
  });

  it("should sweep an entry nothing names", () => {
    expect(strayIn(["phase-run.log"], ["coverage"])).toEqual(["phase-run.log"]);
  });

  it("should keep a hidden entry a config names, because a run may be inside it", () => {
    expect(strayIn([".stryker-tmp"], [".stryker-tmp"])).toEqual([]);
  });

  it("should sweep a hidden entry nothing names, which no run can be inside", () => {
    expect(strayIn([".leftover"], [".stryker-tmp"])).toEqual([".leftover"]);
  });

  it("should judge each entry on its own rather than stopping at the first stray", () => {
    expect(strayIn(["coverage", "design", "gallery", "final-check.log"], ["coverage", "gallery"]))
      .toEqual(["design", "final-check.log"]);
  });

  it("should sweep everything when nothing is owned", () => {
    expect(strayIn(["coverage", "gallery"], [])).toEqual(["coverage", "gallery"]);
  });
});

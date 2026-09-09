import { describe, expect, it } from "vitest";
import { BATTERY_PATH, GATES_DIR, PARAGRAPH_PATH, fileStemOf, logPathOf, verdictPathOf } from "./gate-paths.ts";


describe("the folder", () => {
  it("should be reports/gates, which tidy-reports reads off this very file", () => {
    expect(GATES_DIR).toBe("reports/gates");
  });

  it("should hold the paragraph and the battery name beside the verdicts", () => {
    expect(PARAGRAPH_PATH).toBe("reports/gates/gates-paragraph.txt");
    expect(BATTERY_PATH).toBe("reports/gates/battery.txt");
  });
});

describe("fileStemOf()", () => {
  it("should turn the colons a file name may not carry into dashes", () => {
    expect(fileStemOf("test:mutation:changed")).toBe("test-mutation-changed");
  });
});

describe("a gate's own files", () => {
  it("should put a gate's log and verdict side by side, named after it", () => {
    expect(logPathOf("e2e:changed")).toBe("reports/gates/e2e-changed.log");
    expect(verdictPathOf("e2e:changed")).toBe("reports/gates/e2e-changed.json");
  });
});


describe("a named run's own files", () => {
  it("should sit beside the bare gate's, marked named, so neither overwrites the other", () => {
    expect(fileStemOf("test", true)).toBe("test.named");
    expect(logPathOf("test:mutation:changed", true)).toBe("reports/gates/test-mutation-changed.named.log");
    expect(verdictPathOf("test", true)).toBe("reports/gates/test.named.json");
  });
});

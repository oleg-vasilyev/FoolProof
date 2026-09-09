import { describe, expect, it } from "vitest";
import { GATE } from "./gate-names.ts";
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
    expect(fileStemOf(GATE.mutationChanged)).toBe("test-mutation-changed");
  });
});

describe("a gate's own files", () => {
  it("should put a gate's log and verdict side by side, named after it", () => {
    expect(logPathOf(GATE.e2eChanged)).toBe("reports/gates/e2e-changed.log");
    expect(verdictPathOf(GATE.e2eChanged)).toBe("reports/gates/e2e-changed.json");
  });
});


describe("a named run's own files", () => {
  it("should sit beside the bare gate's, marked named, so neither overwrites the other", () => {
    expect(fileStemOf(GATE.test, true)).toBe("test.named");
    expect(logPathOf(GATE.mutationChanged, true)).toBe("reports/gates/test-mutation-changed.named.log");
    expect(verdictPathOf(GATE.test, true)).toBe("reports/gates/test.named.json");
  });
});

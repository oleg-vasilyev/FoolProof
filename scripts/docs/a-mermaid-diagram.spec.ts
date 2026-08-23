import { describe, expect, it } from "vitest";
import { depthsWalking, lanesUsedIn } from "./a-mermaid-diagram.ts";


const ONE_DEEP = 1;

const TWO_DEEP = 2;

const NONE = 0;

const BELOW_THE_PAGE = -1;

describe("lanesUsedIn", () => {
  it("should name both ends of an arrow", () => {
    expect(lanesUsedIn("  C->>G: push the branch")).toEqual(["C", "G"]);
  });

  it("should name both ends of an activating arrow", () => {
    expect(lanesUsedIn("  C->>+R: review")).toEqual(["C", "R"]);
  });

  it("should name every lane a note is written over", () => {
    expect(lanesUsedIn("  note over C, R: Stage 5. The review")).toEqual(["C", "R"]);
  });

  it("should name the lane a note sits beside", () => {
    expect(lanesUsedIn("  note right of V: the timer pulls")).toEqual(["V"]);
  });

  it("should find no lane in a line that draws none", () => {
    expect(lanesUsedIn("  end")).toEqual([]);
  });
});

describe("depthsWalking", () => {
  it("should go down into a block and back out of it", () => {
    expect(depthsWalking(["  rect rgb(1,2,3)", "  C->>G: push", "  end"])).toEqual([
      ONE_DEEP,
      NONE,
    ]);
  });

  it("should count a block inside a block", () => {
    expect(depthsWalking(["  rect rgb(1,2,3)", "  opt when it fails", "  end", "  end"])).toEqual([
      ONE_DEEP,
      TWO_DEEP,
      ONE_DEEP,
      NONE,
    ]);
  });

  it("should go below the page when an end closes a block nobody opened", () => {
    expect(depthsWalking(["  end", "  rect rgb(1,2,3)", "  end"])).toEqual([
      BELOW_THE_PAGE,
      NONE,
      BELOW_THE_PAGE,
    ]);
  });

  it("should stay level through lines that open and close nothing", () => {
    expect(depthsWalking(["  C->>G: push", "  note over C: a note"])).toEqual([]);
  });
});

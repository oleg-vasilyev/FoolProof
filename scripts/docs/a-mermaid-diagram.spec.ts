import { describe, expect, it } from "vitest";
import {
  depthsWalking,
  drawingsIn,
  lanesUsedIn,
  renderComplaints,
  separatorComplaints,
} from "./a-mermaid-diagram.ts";


const ONE_DEEP = 1;

const TWO_DEEP = 2;

const NONE = 0;

const BELOW_THE_PAGE = -1;

const ONE_COMPLAINT = 1;

const FIRST = 0;

const FLOW = "DEVELOPMENT-FLOW.md";

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

describe("drawingsIn", () => {
  it("should take the mermaid fences and leave the prose around them", () => {
    const document = "# Flow\n\nprose\n\n```mermaid\nA->>B: one\n```\n\nmore prose\n";

    expect(drawingsIn(document)).toBe("A->>B: one\n");
  });

  it("should join two diagrams so one document is read as one drawing", () => {
    const document = "```mermaid\nfirst\n```\ntext\n```mermaid\nsecond\n```";

    expect(drawingsIn(document)).toBe("first\nsecond\n");
  });

  it("should find nothing in a document that draws nothing", () => {
    expect(drawingsIn("# Just prose\n\n```js\nnot mermaid\n```\n")).toBe("");
  });
});

describe("renderComplaints", () => {
  it("should pass a drawing whose lanes are declared and whose blocks balance", () => {
    const drawing = [
      "participant A as One",
      "participant B as Two",
      "rect rgb(1,2,3)",
      "note over A: Stage 1.",
      "A->>B: asks",
      "end",
    ].join("\n");

    expect(renderComplaints(FLOW, drawing)).toEqual([]);
  });

  it("should name a lane an arrow uses that no participant declares", () => {
    const drawing = "participant A as One\nA->>Ghost: asks";
    const complaints = renderComplaints(FLOW, drawing);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"Ghost"');
    expect(complaints[FIRST]).toContain("mermaid invents one silently");
  });

  it("should name a lane only a note uses, because a note draws a lane too", () => {
    const complaints = renderComplaints(FLOW, "participant A as One\nnote over A, Ghost: hi");

    expect(complaints[FIRST]).toContain('"Ghost"');
  });

  it("should count an unclosed block, which prints a parse error instead of the drawing", () => {
    const complaints = renderComplaints(FLOW, "participant A as One\nrect rgb(1,2,3)\nnote over A: Stage 1.");

    expect(complaints.some((said) => said.includes("blocks opened and"))).toBe(true);
  });

  it("should catch a band that no stage note goes with, even when the ends balance", () => {
    const drawing = "participant A as One\nrect rgb(1,2,3)\nA->>A: works\nend";
    const complaints = renderComplaints(FLOW, drawing);

    expect(complaints.some((said) => said.includes("coloured bands and"))).toBe(true);
  });

  it("should catch an end that closes what was never opened, though the counts balance", () => {
    const drawing = [
      "participant A as One",
      "end",
      "rect rgb(1,2,3)",
      "note over A: Stage 1.",
    ].join("\n");
    const complaints = renderComplaints(FLOW, drawing);

    expect(complaints.some((said) => said.includes("never opened"))).toBe(true);
  });
});

describe("separatorComplaints", () => {
  it("should name the line carrying a semicolon and quote it back", () => {
    const complaints = separatorComplaints(FLOW, "A->>B: asks; and waits\nA->>B: fine");

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("A->>B: asks; and waits");
    expect(complaints[FIRST]).toContain("end of a statement");
  });

  it("should say nothing about a drawing whose punctuation is punctuation", () => {
    expect(separatorComplaints(FLOW, "A->>B: asks, then waits")).toEqual([]);
  });
});

describe("a line is read only where mermaid reads it", () => {
  it("should not take a participant declared halfway through a sentence", () => {
    const drawing = "participant A as One\nthe participant B as Two is prose\nA->>B: asks";

    expect(renderComplaints(FLOW, drawing)[FIRST]).toContain('"B"');
  });

  it("should not read an arrow that a sentence merely mentions", () => {
    expect(lanesUsedIn("prose about A->>Ghost: asks")).toEqual([]);
  });

  it("should not read a note that a sentence merely mentions", () => {
    expect(lanesUsedIn("see note over Ghost: for details")).toEqual([]);
  });

  it("should need whitespace between participant and its name", () => {
    const drawing = "participantA as One\nA->>A: asks";

    expect(renderComplaints(FLOW, drawing)[FIRST]).toContain('"A"');
  });

  it("should not read the word end inside a sentence as closing a block", () => {
    expect(depthsWalking(["rect rgb(1,2,3)", "at the end of it", "end"])).toEqual([
      ONE_DEEP,
      NONE,
    ]);
  });

  it("should not read a rect named in prose as opening a coloured band", () => {
    expect(depthsWalking(["the rect is coloured"])).toEqual([]);
  });

  it("should count a stage note only where the stage carries a number", () => {
    const drawing = "participant A as One\nrect rgb(1,2,3)\nnote over A: Stage one.\nend";

    expect(renderComplaints(FLOW, drawing).some((said) => said.includes("coloured bands"))).toBe(
      true
    );
  });

  it("should read a stage number of more than one digit", () => {
    const drawing = "participant A as One\nrect rgb(1,2,3)\nnote over A: Stage 12.\nend";

    expect(renderComplaints(FLOW, drawing)).toEqual([]);
  });
});

describe("every complaint carries the reason it exists for", () => {
  it("should say what an undeclared lane does to the drawing", () => {
    const said = renderComplaints(FLOW, "participant A as One\nA->>Ghost: asks")[FIRST] ?? "";

    expect(said).toContain("draws it at the right-hand edge");
    expect(said).toContain("renders a drawing nobody wrote");
  });

  it("should say what an unbalanced block prints instead of the drawing", () => {
    const drawing = "participant A as One\nrect rgb(1,2,3)\nnote over A: Stage 1.";
    const said = renderComplaints(FLOW, drawing).join("\n");

    expect(said).toContain("prints a parse error where the drawing");
    expect(said).toContain("nothing else here reads the diagram as a diagram");
  });

  it("should say why bands are counted and not only the ends", () => {
    const said = renderComplaints(FLOW, "participant A as One\nrect rgb(1,2,3)\nA->>A: x\nend").join(
      "\n"
    );

    expect(said).toContain("keeps the \"end\" count balanced");
    expect(said).toContain("splits one stage across two");
  });

  it("should say why an early close matters when the counts still balance", () => {
    const drawing = "participant A as One\nend\nrect rgb(1,2,3)\nnote over A: Stage 1.";
    const said = renderComplaints(FLOW, drawing).join("\n");

    expect(said).toContain("closed early and another late");
    expect(said).toContain("render a structure nobody wrote");
  });

  it("should say what a semicolon costs a sequence diagram", () => {
    const said = separatorComplaints(FLOW, "A->>B: asks; waits")[FIRST] ?? "";

    expect(said).toContain("leaves");
    expect(said).toContain("half a sentence where an arrow should be");
    expect(said).toContain("prints a parse error");
  });
});

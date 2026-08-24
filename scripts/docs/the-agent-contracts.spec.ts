import { describe, expect, it } from "vitest";
import { agentFile, contractComplaints } from "./the-agent-contracts.ts";


const NOTHING = 0;

const ONE_COMPLAINT = 1;

const BOTH_COMPLAINTS = 2;

const FIRST = 0;

const SECOND = 1;

const A_BRIEF = "## What the brief must carry\n\nthe base ref, the paths\n\n";

const A_HANDBACK = "## What comes back\n\n```\nVerdict: <n> read — <m> findings.\n```\n";

describe("agentFile", () => {
  it("should name the file an agent is defined in, so a complaint is clickable", () => {
    expect(agentFile("phase-reviewer")).toContain("phase-reviewer.md");
  });
});

describe("contractComplaints", () => {
  it("should pass an agent carrying both sections in order, with a verdict line", () => {
    expect(contractComplaints("reader", `${A_BRIEF}${A_HANDBACK}`)).toEqual([]);
  });

  it("should say a briefless agent cannot refuse a thin brief, not merely that a heading is absent", () => {
    const complaints = contractComplaints("reader", A_HANDBACK);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("What the brief must carry");
    expect(complaints[FIRST]).toContain("cannot refuse a thin one");
    expect(complaints[FIRST]).toContain("reader.md");
  });

  it("should say a missing handback leaves the caller comparing against what they hoped for", () => {
    const complaints = contractComplaints("reader", A_BRIEF);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("What comes back");
    expect(complaints[FIRST]).toContain("hoped for");
  });

  it("should name the missing brief alone, rather than every rule that needs one", () => {
    expect(contractComplaints("reader", "nothing at all")).toHaveLength(ONE_COMPLAINT);
  });

  it("should say a swapped contract is read out of the order the errand runs", () => {
    const complaints = contractComplaints("reader", `${A_HANDBACK}${A_BRIEF}`);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("comes before");
    expect(complaints[FIRST]).toContain("the order the errand runs");
  });

  it("should say a verdictless handback cannot tell a pass that found nothing from one that read nothing", () => {
    const complaints = contractComplaints("reader", `${A_BRIEF}## What comes back\n\nthe findings\n`);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("Verdict:");
    expect(complaints[FIRST]).toContain("looked at nothing");
  });

  it("should not accept a verdict line that sits above the handback section", () => {
    const above = `${A_BRIEF}Verdict: <n> read.\n\n## What comes back\n\nthe findings\n`;

    expect(contractComplaints("reader", above)).toHaveLength(ONE_COMPLAINT);
  });

  it("should not accept a verdict line that drifted into a section below the handback", () => {
    const below = `${A_BRIEF}## What comes back\n\nthe findings\n\n## Calibrating\n\nVerdict: <n> read.\n`;

    expect(contractComplaints("reader", below)).toHaveLength(ONE_COMPLAINT);
  });

  it("should not read a verdict named in the middle of a sentence as the line itself", () => {
    const mentioned = `${A_BRIEF}## What comes back\n\nopen with the Verdict: line described above\n`;

    expect(contractComplaints("reader", mentioned)).toHaveLength(ONE_COMPLAINT);
  });

  it("should accept a verdict line indented inside a fence, which is still the line", () => {
    const indented = `${A_BRIEF}## What comes back\n\n\`\`\`\n    Verdict: <n> read.\n\`\`\`\n`;

    expect(contractComplaints("reader", indented)).toHaveLength(NOTHING);
  });

  it("should report the order and the missing verdict together, each carrying its own reason", () => {
    const swapped = "## What comes back\n\nthe findings\n\n## What the brief must carry\n\nthe paths\n";
    const complaints = contractComplaints("reader", swapped);

    expect(complaints).toHaveLength(BOTH_COMPLAINTS);
    expect(complaints[FIRST]).toContain("the order the errand runs");
    expect(complaints[SECOND]).toContain("coverage beside the findings");
  });
});

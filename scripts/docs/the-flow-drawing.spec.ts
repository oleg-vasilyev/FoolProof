import { describe, expect, it } from "vitest";
import { afterFlowLine } from "./the-flow-drawing.ts";


const THE_OWNER = "U";

const NOBODY = "";

const NOTHING_ASKED = { asked: NOBODY, complaints: [] };

const FIRST = 0;

const ONE_COMPLAINT = 1;

describe("afterFlowLine", () => {
  it("should remember who the errand went to", () => {
    expect(afterFlowLine(NOTHING_ASKED, "  C->>R: review the whole diff", THE_OWNER).asked).toBe("R");
  });

  it("should say nothing when the one asked is the one who answers", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review the whole diff", THE_OWNER);

    expect(afterFlowLine(asked, "  R-->>C: eight findings", THE_OWNER).complaints).toEqual([]);
  });

  it("should complain when somebody else hands the work back", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review the whole diff", THE_OWNER);
    const answered = afterFlowLine(asked, "  S-->>C: eight findings", THE_OWNER);

    expect(answered.complaints).toHaveLength(ONE_COMPLAINT);
    expect(answered.complaints[FIRST]).toContain("the errand went to R and S answered it");
  });

  it("should forget the errand once it has complained, so one slip is not counted twice", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review", THE_OWNER);
    const answered = afterFlowLine(asked, "  S-->>C: findings", THE_OWNER);

    expect(afterFlowLine(answered, "  K-->>C: more findings", THE_OWNER).complaints).toHaveLength(
      ONE_COMPLAINT
    );
  });

  it("should let the owner answer anything, because a person is not an errand", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review", THE_OWNER);

    expect(afterFlowLine(asked, "  U-->>C: looks right to me", THE_OWNER).complaints).toEqual([]);
  });

  it("should ignore a note Claude makes to itself rather than reading it as an errand", () => {
    expect(afterFlowLine(NOTHING_ASKED, "  C->>C: writes the copy table", THE_OWNER).asked).toBe(
      NOBODY
    );
  });

  it("should say nothing about an answer that follows no errand at all", () => {
    expect(afterFlowLine(NOTHING_ASKED, "  R-->>C: findings", THE_OWNER).complaints).toEqual([]);
  });

  it("should read a solid arrow back as an answer, the same as a dashed one", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review", THE_OWNER);

    expect(afterFlowLine(asked, "  S->>C: findings", THE_OWNER).complaints).toHaveLength(
      ONE_COMPLAINT
    );
  });
});

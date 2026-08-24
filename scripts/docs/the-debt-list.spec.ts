import { describe, expect, it } from "vitest";
import { debtComplaints, entriesIn, lastParagraphOf, namesATrigger } from "./the-debt-list.ts";


const ONE_ENTRY = 1;

const NO_ENTRIES = 0;

const FIRST = 0;

const A_DOCUMENT = "TECH-DEBT.md";

describe("entriesIn", () => {
  it("should split a debt list into its entries, dropping the preamble above the first", () => {
    const list = "# Tech debt\n\nWhat is deliberately unfinished.\n\n## One thing\n\nits body\n\n## Another\n\nanother body\n";

    expect(entriesIn(list)).toEqual([
      { title: "One thing", body: "\n\nits body\n\n" },
      { title: "Another", body: "\n\nanother body\n" },
    ]);
  });

  it("should find nothing in a list that has no entries yet", () => {
    expect(entriesIn("# Tech debt\n\nNothing owed.\n")).toEqual([]);
  });
});

describe("lastParagraphOf", () => {
  it("should take the closing paragraph, which is where a trigger is written", () => {
    expect(lastParagraphOf("why it is owed\n\nwhat it would cost\n\n**Worth doing when it hurts.**")).toBe(
      "**Worth doing when it hurts.**"
    );
  });

  it("should look past a horizontal rule between entries rather than reading it as the ending", () => {
    expect(lastParagraphOf("the reason\n\n**Once the bot has two chats.**\n\n---\n")).toBe(
      "**Once the bot has two chats.**"
    );
  });

  it("should say nothing for an entry with no body at all", () => {
    expect(lastParagraphOf("")).toBe("");
  });
});

describe("namesATrigger", () => {
  const NAMED = [
    "**Worth doing when a second feature draws a poster.**",
    "**Once the evening outgrows one sheet, this is the fix.**",
    "**If a player ever asks for it twice.**",
    "**Until then it stays as it is.**",
    "**As soon as the server has a second bot on it.**",
    "**The day somebody merges by hand for the third time.**",
    "**The next time a phase touches this file.**",
    "**The first time a chat runs past ten players.**",
    "**With the next phase that adds a command.**",
    "**The phase that adds a second language pays for it.**",
  ];

  for (const closing of NAMED) {
    it(`should accept a closing sentence phrased "${closing.slice(2, 24)}…"`, () => {
      expect(namesATrigger(`the reason it is owed\n\n${closing}`)).toBe(true);
    });
  }

  it("should accept a table whose own column carries the condition", () => {
    expect(namesATrigger("the reason\n\n| Do it | when the timer stops firing |")).toBe(true);
  });

  it("should refuse an entry that only says it would be nice", () => {
    expect(namesATrigger("the reason\n\n**This would be worth tidying up.**")).toBe(false);
  });

  it("should refuse a condition that is not stated as the entry's own closing claim", () => {
    expect(namesATrigger("worth doing when somebody asks\n\nand then some more prose")).toBe(false);
  });

  it("should not be fooled by a word that merely contains a condition", () => {
    expect(namesATrigger("the reason\n\n**This is a whenever-you-like sort of cleanup.**")).toBe(
      false
    );
  });
});

describe("debtComplaints", () => {
  it("should name the entry that ends without a trigger, quoting its title and the reason", () => {
    const list = "# Debt\n\npreamble\n\n## Wished for\n\nreason\n\nand nothing else\n";

    const said = debtComplaints(list);

    expect(said).toHaveLength(ONE_ENTRY);
    expect(said[FIRST]).toContain(`${A_DOCUMENT}: "Wished for" ends without a trigger`);
    expect(said[FIRST]).toContain("wish that will still be here in a year");
    expect(said[FIRST]).toContain("widen A_CONDITION rather than rewording the entry");
  });

  it("should say nothing when every entry closes on a trigger", () => {
    const list = "# Debt\n\npreamble\n\n## Owed\n\nreason\n\n**Once it happens twice.**\n";

    expect(debtComplaints(list)).toHaveLength(NO_ENTRIES);
  });

  it("should leave the entry marked as not debt, deliberately, even though it names no trigger", () => {
    const list = "# Debt\n\npreamble\n\n## Not debt, deliberately\n\njust a note with no trigger at all\n";

    expect(debtComplaints(list)).toHaveLength(NO_ENTRIES);
  });

  it("should not spare an entry whose title only resembles the exempt one", () => {
    const list = "# Debt\n\npreamble\n\n## Not debt, deliberately, mostly\n\nno trigger here\n";

    const said = debtComplaints(list);

    expect(said).toHaveLength(ONE_ENTRY);
    expect(said[FIRST]).toContain('"Not debt, deliberately, mostly" ends without a trigger');
  });

  it("should say nothing about a document with no entries at all", () => {
    expect(debtComplaints("# Debt\n\nNothing owed.\n")).toHaveLength(NO_ENTRIES);
  });
});

describe("the two of them together", () => {
  it("should name the entry that ends without a trigger and leave the one that does", () => {
    const list = "# Debt\n\npreamble\n\n## Owed\n\nreason\n\n**Once it happens twice.**\n\n## Wished for\n\nreason\n\nand nothing else\n";

    const untriggered = entriesIn(list).filter((entry) => !namesATrigger(entry.body));

    expect(untriggered).toHaveLength(ONE_ENTRY);
    expect(untriggered[FIRST]?.title).toBe("Wished for");
  });
});

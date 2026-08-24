import { describe, expect, it } from "vitest";
import { countedWordsIn, formsBakedInto, isACopyTable } from "./the-copy-tables.ts";


const A_TABLE = "src/features/scoresheet/copy.ru.ts";

const NONE = 0;

const FIRST = 0;

const ONE_COMPLAINT = 1;

const A_COUNTED_WORD = '  gameForms: { one: "партия", few: "партии", many: "партий" },';

describe("countedWordsIn", () => {
  it("should collect every form a counted word is declared in", () => {
    expect([...countedWordsIn(A_COUNTED_WORD)]).toEqual(["партия", "партии", "партий"]);
  });

  it("should collect nothing from a table that counts nothing", () => {
    expect([...countedWordsIn('  greeting: "Привет",')]).toEqual([]);
  });
});

describe("formsBakedInto", () => {
  it("should catch a counted word written straight after a number", () => {
    const table = `${A_COUNTED_WORD}\n  played: (games: number) => \`Сыграно \${String(games)} партий\`,`;

    const said = formsBakedInto(A_TABLE, table);

    expect(said).toHaveLength(FIRST + 1);
    expect(said[FIRST]).toContain(`${A_TABLE}:2:`);
    expect(said[FIRST]).toContain('puts "партий" straight after a number');
  });

  it("should leave a line that interpolates a tally somebody else already worded", () => {
    const table = `${A_COUNTED_WORD}\n  played: (tally: string) => \`Сыграно \${tally}\`,`;

    expect(formsBakedInto(A_TABLE, table)).toHaveLength(NONE);
  });

  it("should leave a word the table never declared forms for", () => {
    const table = `${A_COUNTED_WORD}\n  scored: (points: number) => \`\${String(points)} очков\`,`;

    expect(formsBakedInto(A_TABLE, table)).toHaveLength(NONE);
  });

  it("should catch the word across a non-breaking space, which is what a poster line uses", () => {
    const table = `${A_COUNTED_WORD}\n  played: (games: number) => \`\${String(games)} партии\`,`;

    expect(formsBakedInto(A_TABLE, table)).toHaveLength(FIRST + 1);
  });
});

describe("isACopyTable", () => {
  it("should know a copy table by its two-letter language", () => {
    expect(isACopyTable("copy.en.ts")).toBe(true);
    expect(isACopyTable("copy.ru.ts")).toBe(true);
  });

  it("should not take the module that switches between them for a table", () => {
    expect(isACopyTable("copy.ts")).toBe(false);
  });

  it("should refuse a one-letter language, which no locale here uses", () => {
    expect(isACopyTable("copy.e.ts")).toBe(false);
  });

  it("should refuse a name that only ends in one, so a sibling is not swept in", () => {
    expect(isACopyTable("old-copy.en.ts")).toBe(false);
  });

  it("should refuse a name that carries something after the extension", () => {
    expect(isACopyTable("copy.en.ts.bak")).toBe(false);
  });

  it("should refuse a language written in capitals, which no file here is", () => {
    expect(isACopyTable("copy.EN.ts")).toBe(false);
  });

  it("should refuse a spec sitting beside the table", () => {
    expect(isACopyTable("copy.en.spec.ts")).toBe(false);
  });
});

describe("what a baked form complaint says", () => {
  it("should read a word however much space follows the interpolation", () => {
    const table = 'gameForms: { one: "партия", few: "партии", many: "партий" },\nsay: `${n}  партии`,';

    expect(formsBakedInto(A_TABLE, table)).toHaveLength(ONE_COMPLAINT);
  });

  it("should not read a form declared halfway through a line as a declaration", () => {
    const table = 'x: gameForms: { one: "партия", few: "партии", many: "партий" },\nsay: `${n} партии`,';

    expect(formsBakedInto(A_TABLE, table)).toEqual([]);
  });

  it("should say why deciding a word form inside the table cannot be caught by a spec", () => {
    const table = 'gameForms: { one: "партия", few: "партии", many: "партий" },\nsay: `${n} партии`,';
    const said = formsBakedInto(A_TABLE, table)[FIRST] ?? "";

    expect(said).toContain("decides a word form instead of printing one");
    expect(said).toContain("caller passes a finished tally");
    expect(said).toContain("compared against");
    expect(said).toContain("itself by every spec that reads this table");
  });
});

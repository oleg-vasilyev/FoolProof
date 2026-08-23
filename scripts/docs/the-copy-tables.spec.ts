import { describe, expect, it } from "vitest";
import { countedWordsIn, formsBakedInto } from "./the-copy-tables.ts";


const A_TABLE = "src/features/scoresheet/copy.ru.ts";

const NONE = 0;

const FIRST = 0;

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

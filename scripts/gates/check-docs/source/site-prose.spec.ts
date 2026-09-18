import { describe, expect, it } from "vitest";
import { blocksOnPage } from "./site-text.ts";
import {
  proseCandidates,
  proseComplaints,
  sentencesOf,
  stemOf,
  wordsInTree,
  wordsOf,
  type TreeWordRules,
} from "./site-prose.ts";


const RUSSIAN_PAGE = "docs/ru/index.html";

const ENGLISH_PAGE = "docs/index.html";

const NONE = 0;

const ONE = 1;

const TWO = 2;

const held = (avoid: Record<string, readonly string[]> = {}): TreeWordRules => ({ listsWords: true, avoid });

const blocks = (html: string) => blocksOnPage(html).blocks;

describe("wordsInTree", () => {
  it("should read the stems a language avoids from the tree's intro", () => {
    const words = wordsInTree("# Page\n\navoid-ru: пятниц, бумажк\navoid-en: friday\n\n## header\n");

    expect(words.avoid).toEqual({ ru: ["пятниц", "бумажк"], en: ["friday"] });
  });

  it("should hold a tree that lists any avoid field", () => {
    expect(wordsInTree("avoid-en: friday\n\n## a\n").listsWords).toBe(true);
  });

  it("should not hold a tree that lists no words", () => {
    expect(wordsInTree("# Page\n\n## a\n\n### x\n- A.\n").listsWords).toBe(false);
  });

  it("should ignore an avoid field written after the first section", () => {
    expect(wordsInTree("## a\n\navoid-en: friday\n").listsWords).toBe(false);
  });

  it("should keep reading the intro past a heading of prose, which names no section", () => {
    expect(wordsInTree("# Page\n\n## The page's job\n\nA line.\n\navoid-en: friday\n\n## a\n").listsWords).toBe(true);
  });

  it("should not take a section marker inside a line for the first section", () => {
    expect(wordsInTree("see ## later\navoid-en: friday\n\n## a\n").listsWords).toBe(true);
  });

  it("should ignore a line that only mentions an avoid field", () => {
    expect(wordsInTree("not avoid-en: friday\n\n## a\n").listsWords).toBe(false);
  });

  it("should split a list at a comma with no space after it", () => {
    expect(wordsInTree("avoid-en: friday,monday\n\n## a\n").avoid).toEqual({ en: ["friday", "monday"] });
  });

  it("should lower-case a stem and fold ё into е", () => {
    expect(wordsInTree("avoid-ru: Ёлка\n\n## a\n").avoid).toEqual({ ru: ["елка"] });
  });

  it("should read an empty avoid list as no stems", () => {
    expect(wordsInTree("avoid-ru:   \n\n## a\n").avoid).toEqual({ ru: [] });
  });
});

describe("stemOf", () => {
  it("should cut a word of six letters or more to five", () => {
    expect(stemOf("постеры")).toBe("посте");
  });

  it("should leave a word of five letters whole", () => {
    expect(stemOf("после")).toBe("после");
  });
});

describe("sentencesOf", () => {
  it("should split at a full stop, a question mark, an exclamation mark and an ellipsis", () => {
    expect(sentencesOf("One. Two? Three! Four… Five")).toHaveLength(TWO + TWO + ONE);
  });

  it("should swallow every space after a full stop", () => {
    expect(sentencesOf("One.  Two")).toEqual(["One.", "Two"]);
  });

  it("should not split at a colon", () => {
    expect(sentencesOf("Вести счёт легко: всё в одном сообщении.")).toHaveLength(ONE);
  });

  it("should drop the empty tail after a final full stop", () => {
    expect(sentencesOf("One. ")).toEqual(["One."]);
  });
});

describe("wordsOf", () => {
  it("should lower-case the words and fold ё", () => {
    expect(wordsOf("Ёлка Постер", "ru")).toEqual(["елка", "постер"]);
  });

  it("should drop a word shorter than three letters", () => {
    expect(wordsOf("он и постер", "ru")).toEqual(["постер"]);
  });

  it("should drop a stop word of the language", () => {
    expect(wordsOf("что это постер", "ru")).toEqual(["постер"]);
    expect(wordsOf("the poster and the card", "en")).toEqual(["poster", "card"]);
  });

  it("should keep «кто», which the owner counts as a repeat", () => {
    expect(wordsOf("кто ходил и кто вышел", "ru")).toEqual(["кто", "ходил", "кто", "вышел"]);
  });

  it("should keep a hyphenated word whole", () => {
    expect(wordsOf("кто-то подсел", "ru")).toEqual(["кто-то", "подсел"]);
  });

  it("should read an unknown language with no stop words", () => {
    expect(wordsOf("und der", "de")).toEqual(["und", "der"]);
  });
});

describe("proseCandidates", () => {
  it("should list a word said twice in one sentence", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Сначала нажмите, потом нажмите.</p>'));

    expect(found).toEqual([{ block: "a.b", words: "нажмите", shape: "twice in one sentence" }]);
  });

  it("should list two forms of one word in one sentence as one candidate", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Партию отмечают между партиями.</p>'));

    expect(found.map((candidate) => candidate.words)).toEqual(["партию/партиями"]);
  });

  it("should not take a five-letter word for the stem of a longer one", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Уже после «Записать» откроет последнюю.</p>'));

    expect(found).toEqual([]);
  });

  it("should list a word carried into the next sentence", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">На постере их девять. Открывать постеры удобно.</p>'));

    expect(found).toEqual([{ block: "a.b", words: "постере", shape: "in two sentences in a row" }]);
  });

  it("should take two long forms of one stem across two sentences", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Отмечают партию. Между партиями.</p>'));

    expect(found.map((candidate) => candidate.words)).toEqual(["партию"]);
  });

  it("should not take a five-letter word for the stem of a longer one across two sentences", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Уже после. Откроет последнюю.</p>'));

    expect(found).toEqual([]);
  });

  it("should not list a word two sentences apart", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Постер один. Ничего. Постер два.</p>'));

    expect(found).toEqual([]);
  });

  it("should list a word a title shares with the lead under it", () => {
    const found = proseCandidates(
      RUSSIAN_PAGE,
      blocks('<h2 data-block="cta.title">Узнайте, кто лучший</h2><p data-block="cta.lead">Кто лучший игрок.</p>')
    );

    expect(found.map((candidate) => [candidate.block, candidate.words])).toEqual([
      ["cta.title + cta.lead", "кто"],
      ["cta.title + cta.lead", "лучший"],
    ]);
  });

  it("should not pair a title with a block that is not its lead or body", () => {
    const found = proseCandidates(
      RUSSIAN_PAGE,
      blocks('<h2 data-block="a.title">Постеры</h2><p data-block="a.command">Постеры</p>')
    );

    expect(found).toEqual([]);
  });

  it("should pair a bare title with a bare lead", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<h2 data-block="title">Постеры</h2><p data-block="lead">Постеры</p>'));

    expect(found).toHaveLength(ONE);
  });

  it("should not pair a title with a block whose id only starts with lead", () => {
    const found = proseCandidates(
      RUSSIAN_PAGE,
      blocks('<h2 data-block="a.title">Постеры</h2><p data-block="a.lead-note">Постеры</p>')
    );

    expect(found).toEqual([]);
  });

  it("should not take a block whose id only starts with title for a title", () => {
    const found = proseCandidates(
      RUSSIAN_PAGE,
      blocks('<h2 data-block="a.title-note">Постеры</h2><p data-block="a.lead">Постеры</p>')
    );

    expect(found).toEqual([]);
  });

  it("should list a word in the last sentence of a block once, not once per following block", () => {
    const found = proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Постер.</p><p data-block="a.c">Постер.</p>'));

    expect(found).toEqual([]);
  });

  it("should not pair a body with the block after it", () => {
    const found = proseCandidates(
      RUSSIAN_PAGE,
      blocks('<p data-block="a.body">Постеры</p><p data-block="a.lead">Постеры</p>')
    );

    expect(found).toEqual([]);
  });

  it("should read the language from the page's path", () => {
    const found = proseCandidates(ENGLISH_PAGE, blocks('<p data-block="a.b">Tap who went, then tap Confirm.</p>'));

    expect(found).toEqual([{ block: "a.b", words: "tap", shape: "twice in one sentence" }]);
  });

  it("should list nothing on a clean page", () => {
    expect(proseCandidates(RUSSIAN_PAGE, blocks('<p data-block="a.b">Вы играете. Счёт ведёт FoolProof.</p>'))).toEqual([]);
  });
});

describe("proseComplaints", () => {
  it("should say nothing about a page whose tree holds no words", () => {
    const page = blocks('<h2 data-block="why.title">Почему он такой</h2>');

    expect(proseComplaints(RUSSIAN_PAGE, page, { listsWords: false, avoid: {} })).toEqual([]);
  });

  it("should refuse a pronoun in a Russian heading", () => {
    const [complaint] = proseComplaints(RUSSIAN_PAGE, blocks('<h2 data-block="why.title">Почему он такой</h2>'), held());

    expect(complaint).toContain('heading "why.title" says "он"');
  });

  it("should refuse a pronoun in an eyebrow", () => {
    const found = proseComplaints(RUSSIAN_PAGE, blocks('<p data-block="why.eyebrow">Чат он не читает</p>'), held());

    expect(found).toHaveLength(ONE);
  });

  it("should refuse a pronoun in a bare heading id", () => {
    const found = proseComplaints(RUSSIAN_PAGE, blocks('<h2 data-block="eyebrow">Почему он такой</h2>'), held());

    expect(found).toHaveLength(ONE);
  });

  it("should not take a block whose id only starts with title for a heading", () => {
    const found = proseComplaints(RUSSIAN_PAGE, blocks('<p data-block="why.title-note">Он такой</p>'), held());

    expect(found).toEqual([]);
  });

  it("should refuse every pronoun of the Russian list", () => {
    const page = blocks('<h2 data-block="a.title">его него ему нем ним она ее неё ей ней оно они их них им ими</h2>');

    expect(proseComplaints(RUSSIAN_PAGE, page, held())).toHaveLength(TWO * TWO * TWO * TWO);
  });

  it("should let a pronoun stand in a body", () => {
    const found = proseComplaints(RUSSIAN_PAGE, blocks('<p data-block="why.body">Он не читает чат.</p>'), held());

    expect(found).toEqual([]);
  });

  it("should refuse a pronoun in a FAQ question, which is a heading set in a dt", () => {
    const [complaint] = proseComplaints(RUSSIAN_PAGE, blocks('<dt data-block="faq.chat-q">Он читает чат?</dt>'), held());

    expect(complaint).toContain('heading "faq.chat-q" says "он"');
  });

  it("should let a pronoun stand in a FAQ answer", () => {
    const found = proseComplaints(RUSSIAN_PAGE, blocks('<dd data-block="faq.chat-a">Нет, он его не читает.</dd>'), held());

    expect(found).toEqual([]);
  });

  it("should not refuse an English heading for a pronoun", () => {
    const found = proseComplaints(ENGLISH_PAGE, blocks('<h2 data-block="why.title">Why it is shaped so</h2>'), held());

    expect(found).toEqual([]);
  });

  it("should refuse a word that starts with an avoided stem", () => {
    const [complaint] = proseComplaints(
      RUSSIAN_PAGE,
      blocks('<p data-block="cta.title">Сыграйте в пятницу</p>'),
      held({ ru: ["пятниц"] })
    );

    expect(complaint).toContain('says "пятницу" — the tree lists "пятниц" under "avoid-ru:"');
  });

  it("should apply only the stems of the page's own language", () => {
    const found = proseComplaints(ENGLISH_PAGE, blocks('<p data-block="a.b">Play on Friday</p>'), held({ ru: ["friday"] }));

    expect(found).toEqual([]);
  });

  it("should refuse an avoided stem whatever its case", () => {
    const found = proseComplaints(ENGLISH_PAGE, blocks('<p data-block="a.b">Two Fridays</p>'), held({ en: ["friday"] }));

    expect(found).toHaveLength(ONE);
  });

  it("should pass a clean page", () => {
    const page = blocks('<h2 data-block="why.title">Сделан под живую игру</h2><p data-block="why.body">Игра.</p>');

    expect(proseComplaints(RUSSIAN_PAGE, page, held({ ru: ["пятниц"] }))).toHaveLength(NONE);
  });
});

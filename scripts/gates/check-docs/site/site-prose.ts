import { existsSync } from "node:fs";
import { read } from "../shared/document-files.ts";
import { A_LINE, SECOND_GROUP } from "../shared/markdown-text.ts";
import { blocksOnPage, languageOf, type PageBlock } from "../../../site/page-blocks.ts";
import { SITE_TEXT_TREES, namesASection } from "./site-text.ts";


export type TreeWordRules = {
  readonly listsWords: boolean;
  readonly avoid: Readonly<Record<string, readonly string[]>>;
};

export type ProseCandidate = {
  readonly block: string;
  readonly words: string;
  readonly shape: "twice in one sentence" | "in two sentences in a row" | "in a heading and the line under it";
};

const NOTHING = 0;

const ONE = 1;

const THIRD_GROUP = 3;

const A_WORDS_FIELD = /^(avoid)-([a-z]{2}): (.*)$/;

const BETWEEN_LISTED = /\s*,\s*/;

const BETWEEN_SENTENCES = /(?<=[.!?…])\s+/;

const A_WORD = /[a-zа-яё][a-zа-яё-]*/gi;

const YO = /ё/g;

const SHORTEST_WORD_READ = 3;

const STEM_FROM = 6;

const STEM_LENGTH = 5;

const A_HEADING_BLOCK = /(?:^|[.-])(?:title|eyebrow|q)$/;

const A_TITLE_BLOCK = /(?:^|[.-])title$/;

const A_BODY_BLOCK = /(?:^|[.-])(?:lead|body)$/;

const wordSet = (words: string): ReadonlySet<string> => new Set(words.split(" "));

const STOP_WORDS: Readonly<Record<string, ReadonlySet<string>>> = {
  ru: wordSet(
    "или что чтобы как так это про через между уже еще вот для при без под над вы вас вам " +
      "мы нас нам из-за все всё весь вся всю всех всем если когда где чем том тем тех того " +
      "тот той то есть"
  ),
  en: wordSet(
    "the and but for with from that this these those not you your our they their them there " +
      "here into over out about after before when where while does did has have had can may " +
      "will just also only are was were been its than then what which any all own"
  ),
};

const PRONOUNS: Readonly<Record<string, ReadonlySet<string>>> = {
  ru: wordSet("он его него ему нем ним она ее нее ей ней оно они их них им ими"),
};

const listed = (value: string): readonly string[] =>
  value.trim().length === NOTHING ? [] : value.trim().split(BETWEEN_LISTED);

const normalised = (word: string): string => word.toLowerCase().replaceAll(YO, "е");

export const wordsInTree = (markdown: string): TreeWordRules => {
  const avoid: Record<string, readonly string[]> = {};
  let listsWords = false;

  for (const line of markdown.split(A_LINE)) {
    if (namesASection(line)) {
      break;
    }

    const field = A_WORDS_FIELD.exec(line);

    if (field !== null) {
      listsWords = true;
      avoid[field[SECOND_GROUP] ?? ""] = listed(field[THIRD_GROUP] ?? "").map(normalised);
    }
  }

  return { listsWords, avoid };
};

export const stemOf = (word: string): string =>
  word.length >= STEM_FROM ? word.slice(NOTHING, STEM_LENGTH) : word;

const sameStem = (left: string, right: string): boolean =>
  left === right || (left.length >= STEM_FROM && right.length >= STEM_FROM && stemOf(left) === stemOf(right));

export const sentencesOf = (text: string): readonly string[] =>
  text.split(BETWEEN_SENTENCES).filter((sentence) => sentence.trim().length > NOTHING);

const tokensOf = (text: string): readonly string[] => (text.match(A_WORD) ?? []).map(normalised);

export const wordsOf = (sentence: string, language: string): readonly string[] =>
  tokensOf(sentence).filter(
    (word) => word.length >= SHORTEST_WORD_READ && !(STOP_WORDS[language]?.has(word) ?? false)
  );

const forms = (words: readonly string[]): string => [...new Set(words)].join("/");

const repeatedWithin = (words: readonly string[]): readonly string[] => {
  const groups: string[][] = [];

  for (const word of words) {
    const group = groups.find((candidates) => sameStem(candidates[NOTHING] ?? "", word));

    if (group === undefined) {
      groups.push([word]);
    } else {
      group.push(word);
    }
  }

  return groups.filter((group) => group.length > ONE).map(forms);
};

const sharedBetween = (left: readonly string[], right: readonly string[]): readonly string[] =>
  [...new Set(left.filter((word) => right.some((other) => sameStem(word, other))))];

export const proseCandidates = (page: string, blocks: readonly PageBlock[]): readonly ProseCandidate[] => {
  const language = languageOf(page);

  return blocks.flatMap((block, at) => {
    const sentences = sentencesOf(block.text).map((sentence) => wordsOf(sentence, language));
    const next = blocks[at + ONE];

    return [
      ...sentences.flatMap((words) =>
        repeatedWithin(words).map((repeated) => ({ block: block.id, words: repeated, shape: "twice in one sentence" as const }))
      ),
      ...sentences.flatMap((words, index) => {
        const following = sentences[index + ONE];

        return following === undefined
          ? []
          : sharedBetween(words, following).map((word) => ({
              block: block.id,
              words: word,
              shape: "in two sentences in a row" as const,
            }));
      }),
      ...(next !== undefined && A_TITLE_BLOCK.test(block.id) && A_BODY_BLOCK.test(next.id)
        ? sharedBetween(wordsOf(block.text, language), wordsOf(next.text, language)).map((word) => ({
            block: `${block.id} + ${next.id}`,
            words: word,
            shape: "in a heading and the line under it" as const,
          }))
        : []),
    ];
  });
};

const pronounsInHeading = (page: string, block: PageBlock, language: string): readonly string[] =>
  A_HEADING_BLOCK.test(block.id)
    ? tokensOf(block.text)
        .filter((word) => PRONOUNS[language]?.has(word) ?? false)
        .map(
          (pronoun) =>
            `${page}: heading "${block.id}" says "${pronoun}" — a heading has no earlier sentence ` +
              `to point back to, so name the thing or drop the pronoun`
        )
    : [];

const avoidedWords = (page: string, block: PageBlock, language: string, avoid: readonly string[]): readonly string[] =>
  wordsOf(block.text, language).flatMap((word) =>
    avoid
      .filter((stem) => word.startsWith(stem))
      .map(
        (stem) =>
          `${page}: block "${block.id}" says "${word}" — the tree lists "${stem}" under ` +
            `"avoid-${language}:", so the page does not say it`
      )
  );

export const proseComplaints = (page: string, blocks: readonly PageBlock[], words: TreeWordRules): readonly string[] => {
  const language = languageOf(page);

  return words.listsWords
    ? blocks.flatMap((block) => [
        ...pronounsInHeading(page, block, language),
        ...avoidedWords(page, block, language, words.avoid[language] ?? []),
      ])
    : [];
};

export const wordsThePagesMayNotSay = (): readonly string[] =>
  SITE_TEXT_TREES.flatMap(({ tree, pages }) =>
    existsSync(tree)
      ? pages.flatMap((page) => proseComplaints(page, blocksOnPage(read(page)).blocks, wordsInTree(read(tree))))
      : []
  );

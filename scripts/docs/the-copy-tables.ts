import { readdirSync } from "node:fs";
import { join } from "node:path";
import { A_LINE, FIRST_GROUP, read } from "./the-documents.ts";
import { FEATURE_FOLDERS, featureFolders } from "./the-repository.ts";


const A_COUNTED_FORM = /^\s*\w*Forms: \{ one: "([^"]+)", few: "([^"]+)", many: "([^"]+)" \},$/gm;

const AN_INTERPOLATION_BEFORE_A_WORD = /\$\{[^}]+\}[\u0020\u00A0\u202F]+([\p{L}]+)/gu;

const A_COPY_TABLE = /^copy\.[a-z]{2}\.ts$/;

const copyTablesIn = (): readonly string[] =>
  featureFolders().flatMap((feature) =>
    readdirSync(join(FEATURE_FOLDERS, feature))
      .filter((name) => A_COPY_TABLE.test(name))
      .map((name) => join(FEATURE_FOLDERS, feature, name))
  );

export const countedWordsIn = (table: string): ReadonlySet<string> =>
  new Set([...table.matchAll(A_COUNTED_FORM)].flatMap((found) => found.slice(FIRST_GROUP)));

export const formsBakedInto = (file: string, table: string): readonly string[] => {
  const counted = countedWordsIn(table);

  return table
    .split(A_LINE)
    .flatMap((line, at) =>
      [...line.matchAll(AN_INTERPOLATION_BEFORE_A_WORD)]
        .filter((found) => counted.has(found[FIRST_GROUP] ?? ""))
        .map(
          (found) =>
            `${file}:${String(at + FIRST_GROUP)}: puts "${found[FIRST_GROUP] ?? ""}" straight ` +
            `after a number, so the copy table decides a word form instead of printing one — ` +
            `the caller passes a finished tally, and a decision taken here is compared against ` +
            `itself by every spec that reads this table`
        )
    );
};

export const formsBakedIntoCopy = (): readonly string[] =>
  copyTablesIn().flatMap((file) => formsBakedInto(file, read(file)));

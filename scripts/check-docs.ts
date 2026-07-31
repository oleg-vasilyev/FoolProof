import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";


const DOCUMENTS = [
  "README.md",
  "PLAN.md",
  "CLAUDE.md",
  "TECH-DEBT.md",
  "e2e/README.md",
];

const SESSION_DOCUMENT = "CLAUDE.md";

const SESSION_LINE_BUDGET = 380;

const TREE_DOCUMENT = "README.md";

const FEATURE_FOLDERS = "src/features";

const NOTHING = 0;

const FIRST_GROUP = 1;

const read = (file: string): string => readFileSync(file, "utf8");

const headingsOf = (text: string): readonly string[] =>
  (text.match(/^#+ .+$/gm) ?? []).map((heading) => heading.replace(/^#+ /, ""));

const anchorOf = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/ +/g, "-");

const withoutFencedBlocks = (text: string): string => text.replace(/```[\s\S]*?```/g, "");

const backtickedWordsOf = (text: string): ReadonlySet<string> =>
  new Set(
    [...withoutFencedBlocks(text).matchAll(/`([^`]+)`/g)].flatMap((match) =>
      (match[FIRST_GROUP] ?? "").split(/[\s/]+/)
    )
  );

const anchorsByDocument = (): Record<string, ReadonlySet<string>> =>
  Object.fromEntries(
    DOCUMENTS.map((file) => [file, new Set(headingsOf(read(file)).map(anchorOf))])
  );

const brokenLinks = (): readonly string[] => {
  const anchors = anchorsByDocument();

  return DOCUMENTS.flatMap((file) =>
    [...read(file).matchAll(/\]\(([^)]+)\)/g)].flatMap((match) => {
      const link = match[FIRST_GROUP] ?? "";

      if (link.startsWith("http") || link.startsWith("#")) {
        return [];
      }

      const [path = "", anchor] = link.split("#");
      const target = normalize(join(dirname(file), path)).split("\\").join("/");

      if (!existsSync(target)) {
        return [`${file}: links to ${link}, which does not exist`];
      }

      const known = anchors[target];

      if (anchor !== undefined && known !== undefined && !known.has(anchor)) {
        return [`${file}: links to ${link}, but that heading is not in ${target}`];
      }

      return [];
    })
  );
};

const featuresMissingFromTheTree = (): readonly string[] => {
  const tree = read(TREE_DOCUMENT);

  return readdirSync(FEATURE_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !tree.includes(`${entry.name}/`))
    .map((entry) => `${TREE_DOCUMENT}: does not mention ${FEATURE_FOLDERS}/${entry.name}/`);
};

const scriptsOutOfStep = (): readonly string[] => {
  const scripts = Object.keys(
    (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts
  );
  const documented = backtickedWordsOf(read(TREE_DOCUMENT));

  return scripts
    .filter((name) => !documented.has(name))
    .map((name) => `${TREE_DOCUMENT}: does not list the "${name}" script`);
};

const overBudget = (): readonly string[] => {
  const lines = read(SESSION_DOCUMENT).split("\n").length;

  if (lines <= SESSION_LINE_BUDGET) {
    return [];
  }

  return [
    `${SESSION_DOCUMENT}: ${String(lines)} lines, budget is ${String(SESSION_LINE_BUDGET)} — move a paragraph into a skill rather than raising the number`,
  ];
};

const complaints = [
  ...brokenLinks(),
  ...featuresMissingFromTheTree(),
  ...scriptsOutOfStep(),
  ...overBudget(),
];

for (const complaint of complaints) {
  console.error(complaint);
}

console.log(
  complaints.length === NOTHING
    ? `documents agree: ${String(DOCUMENTS.length)} files, links and anchors resolve`
    : `${String(complaints.length)} problem(s) in the documents`
);

process.exit(complaints.length === NOTHING ? NOTHING : FIRST_GROUP);

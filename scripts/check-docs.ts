import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { MOCKUP_DIR, posters } from "./mockups.ts";


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

const ONE_COMMAND = 1;

const ROOMY_ENOUGH = 9;

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

const sourceFilesIn = (folder: string): readonly string[] =>
  readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".ts"))
    .filter((name) => !name.endsWith(".spec.ts") && !name.endsWith(".stub.ts"));

const commandsDeclaredBy = (feature: string): number =>
  readdirSync(join(FEATURE_FOLDERS, feature))
    .filter((name) => name.endsWith("-feature.ts"))
    .flatMap((name) => read(join(FEATURE_FOLDERS, feature, name)).match(/command: "/g) ?? []).length;

const crowdedLayers = (): readonly string[] =>
  readdirSync(FEATURE_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => commandsDeclaredBy(entry.name) > ONE_COMMAND)
    .flatMap((feature) =>
      readdirSync(join(FEATURE_FOLDERS, feature.name), { withFileTypes: true })
        .filter((layer) => layer.isDirectory())
        .flatMap((layer) => {
          const folder = join(FEATURE_FOLDERS, feature.name, layer.name);
          const files = sourceFilesIn(folder).length;

          return files <= ROOMY_ENOUGH
            ? []
            : [
                `${folder}: ${String(files)} files at one level in a feature that gives the player more than one thing — name the sub-features as folders rather than raising the number`,
              ];
        })
    );

const SCHEMA_DOCUMENT = "PLAN.md";

const SCHEMA_SOURCE = "src/shared/repository/sqlite-connection.ts";

const A_SCHEMA_STATEMENT = /^CREATE (TABLE|INDEX|UNIQUE INDEX)/;

const schemaStatementsIn = (sql: string): ReadonlyMap<string, string> =>
  new Map(
    sql
      .split(";")
      .map((statement) => statement.replaceAll("IF NOT EXISTS ", "").replace(/\s+/g, " ").trim())
      .filter((statement) => A_SCHEMA_STATEMENT.test(statement))
      .map((statement) => {
        const [name = statement] = statement.split("(");

        return [name.trim(), statement];
      })
  );

const documentedSchema = (): string =>
  /## Data model\n+```sql\n([\s\S]*?)```/.exec(read(SCHEMA_DOCUMENT))?.[FIRST_GROUP] ?? "";

const createdSchema = (): string =>
  [...read(SCHEMA_SOURCE).matchAll(/db\.exec\(`([\s\S]*?)`\)/g)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .join(";");

const schemaOutOfStep = (): readonly string[] => {
  const documented = schemaStatementsIn(documentedSchema());
  const created = schemaStatementsIn(createdSchema());
  const names = new Set([...documented.keys(), ...created.keys()]);

  return [...names].flatMap((name) => {
    const inDocument = documented.get(name);
    const inSource = created.get(name);

    if (inDocument === undefined) {
      return [`${SCHEMA_DOCUMENT}: does not describe "${name}" from ${SCHEMA_SOURCE}`];
    }

    if (inSource === undefined) {
      return [`${SCHEMA_DOCUMENT}: describes "${name}", which ${SCHEMA_SOURCE} does not create`];
    }

    if (inDocument !== inSource) {
      return [
        `${SCHEMA_DOCUMENT}: "${name}" differs from ${SCHEMA_SOURCE} — the document must quote the running schema`,
      ];
    }

    return [];
  });
};

const mockupsOutOfStep = (): readonly string[] =>
  Object.entries(posters()).flatMap(([name, svg]) => {
    const committed = `${MOCKUP_DIR}/${name}.svg`;

    if (!existsSync(committed)) {
      return [`${committed}: never drawn — run "node scripts/tools.ts mockups"`];
    }

    return read(committed) === svg
      ? []
      : [
          `${committed}: the renderer draws something else now — the ` +
            `"sync-the-mockups" skill redraws this and the Claude Design page it belongs to`,
        ];
  });

const complaints = [
  ...brokenLinks(),
  ...featuresMissingFromTheTree(),
  ...scriptsOutOfStep(),
  ...crowdedLayers(),
  ...schemaOutOfStep(),
  ...mockupsOutOfStep(),
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

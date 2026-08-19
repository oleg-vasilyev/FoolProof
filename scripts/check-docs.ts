import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { MOCKUP_DIR, posters } from "./mockups.ts";
import { SITE_CSS, SITE_PAGES } from "./site-css.ts";
import { SITE_POSTER_DIR, sitePosters } from "./site-posters.ts";


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

const read = (file: string): string => readFileSync(file, "utf8").replaceAll("\r\n", "\n");

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

const ENTRY_POINT = "src/main.ts";

const DEPLOY_SCRIPT = "deploy/configure-server.sh";

const A_REQUIRED_KEY = /requireEnv\([^,]+,\s*"([A-Z_]+)"\)/g;

const THE_GUARDED_KEYS = /^REQUIRED_KEYS="([^"]*)"/m;

const requiredKeysOutOfStep = (): readonly string[] => {
  const guarded = new Set(
    (THE_GUARDED_KEYS.exec(read(DEPLOY_SCRIPT))?.[FIRST_GROUP] ?? "").split(" ")
  );

  return [...read(ENTRY_POINT).matchAll(A_REQUIRED_KEY)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .filter((key) => !guarded.has(key))
    .map(
      (key) =>
        `${DEPLOY_SCRIPT}: would ship a config with no ${key}, which ${ENTRY_POINT} refuses to start without`
    );
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

const drawingsOutOfStep = (
  folder: string,
  drawings: Readonly<Record<string, string>>,
  tool: string
): readonly string[] =>
  Object.entries(drawings).flatMap(([name, svg]) => {
    const committed = `${folder}/${name}.svg`;

    if (!existsSync(committed)) {
      return [`${committed}: never drawn — run "node scripts/tools.ts ${tool}"`];
    }

    return read(committed) === svg
      ? []
      : [
          `${committed}: the renderer draws something else now — the ` +
            `"refresh-the-pictures" skill redraws this, and the Claude Design ` +
            `page then follows via "update-the-design-page"`,
        ];
  });

const GALLERY_ENTRY = "gallery.ts";

const A_GALLERY_SOURCE = /^gallery(-[a-z-]+)?\.ts$/;

const A_SPEC = /\.spec\.ts$/;

const ASSEMBLES_A_POSTER = "svgOf(";

const RENDER_LAYER = "render";

const SCRIPTS_FOLDER = "scripts";

const PAST_THE_FEATURES_FOLDER = 2;

const filesIn = (folder: string): readonly string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesIn(join(folder, entry.name)) : [join(folder, entry.name)]
  );

const everyPoster = (): readonly string[] =>
  readdirSync(FEATURE_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((feature) => join(FEATURE_FOLDERS, feature.name, RENDER_LAYER))
    .filter((layer) => existsSync(layer))
    .flatMap(filesIn)
    .filter((file) => !A_SPEC.test(file))
    .filter((file) => read(file).includes(ASSEMBLES_A_POSTER));

const aliasFor = (poster: string): string =>
  `#${normalize(poster).split(/[\\/]/).slice(PAST_THE_FEATURES_FOLDER).join("/")}`;

const gallerySources = (): readonly string[] =>
  readdirSync(SCRIPTS_FOLDER).filter((name) => A_GALLERY_SOURCE.test(name));

const galleryText = (): string =>
  gallerySources()
    .map((name) => read(join(SCRIPTS_FOLDER, name)))
    .join("");

const postersOutOfTheGallery = (): readonly string[] => {
  const drawn = galleryText();
  const entry = read(join(SCRIPTS_FOLDER, GALLERY_ENTRY));

  return [
    ...everyPoster()
      .filter((poster) => !drawn.includes(aliasFor(poster)))
      .map(
        (poster) =>
          `${poster}: assembles a poster the gallery draws no case through, so the ` +
          `poster gate has nothing to say about it — give it cases in ${SCRIPTS_FOLDER}/`
      ),
    ...gallerySources()
      .filter((name) => name !== GALLERY_ENTRY)
      .filter((name) => !entry.includes(`./${name}`))
      .map(
        (name) =>
          `${SCRIPTS_FOLDER}/${name}: holds gallery cases that ${GALLERY_ENTRY} never ` +
          `gathers, so nothing draws them — the cases and the rule that counts them ` +
          `would both stay green`
      ),
  ];
};

const mockupsOutOfStep = (): readonly string[] =>
  drawingsOutOfStep(MOCKUP_DIR, posters(), "mockups");

const sitePostersOutOfStep = (): readonly string[] =>
  drawingsOutOfStep(SITE_POSTER_DIR, sitePosters(), "site-posters");

const A_CLASS_ATTRIBUTE = /class="([^"]+)"/g;

const ESCAPED_IN_A_SELECTOR = /[.:[\]/]/g;

const classesUsedIn = (html: string): ReadonlySet<string> =>
  new Set(
    [...html.matchAll(A_CLASS_ATTRIBUTE)]
      .flatMap((match) => (match[FIRST_GROUP] ?? "").split(/\s+/))
      .filter((token) => token.length > NOTHING)
  );

const selectorFor = (token: string): string =>
  `.${token.replaceAll(ESCAPED_IN_A_SELECTOR, (character) => `\\${character}`)}`;

const siteCssOutOfStep = (): readonly string[] => {
  if (!existsSync(SITE_CSS)) {
    return [`${SITE_CSS}: never built — run "node scripts/tools.ts site-css"`];
  }

  const css = read(SITE_CSS);

  return SITE_PAGES.flatMap((page) =>
    [...classesUsedIn(read(page))]
      .filter((token) => !css.includes(selectorFor(token)))
      .map(
        (token) =>
          `${SITE_CSS}: carries no rule for "${token}", which ${page} uses — ` +
          `run "node scripts/tools.ts site-css"`
      )
  );
};

const FLOW_DOCUMENT = "DEVELOPMENT-FLOW.md";

const SKILLS_FOLDER = ".claude/skills";

const A_NAMED_SKILL = /the ([a-z][a-z0-9-]*[a-z0-9]) skill/g;

const A_NAMED_COMMAND = /npm run ([a-z][a-z:-]*[a-z])/g;

const namesIn = (text: string, pattern: RegExp): readonly string[] =>
  [...text.matchAll(pattern)].map((match) => match[FIRST_GROUP] ?? "");

const A_STAGE = /^\s*note over [^:]+: Stage (\d+)\./gm;

const A_DECLARED_STAGE = /^> \*\*Stages? ([^*]+)\*\*/m;

const A_NUMBER = /\d+/g;

const NEXT_MARK = 1;

const skillFile = (skill: string): string => join(SKILLS_FOLDER, skill, "SKILL.md");

const skillsByStage = (drawing: string): readonly (readonly [string, number])[] => {
  const marks = [...drawing.matchAll(A_STAGE)];

  return marks.flatMap((mark, index) => {
    const opens = mark.index ?? NOTHING;
    const closes = marks[index + NEXT_MARK]?.index ?? drawing.length;

    return namesIn(drawing.slice(opens, closes), A_NAMED_SKILL).map(
      (skill) => [skill, Number(mark[FIRST_GROUP])] as const
    );
  });
};

const stagesClaimedBy = (skill: string): readonly number[] => {
  if (!existsSync(skillFile(skill))) {
    return [];
  }

  const declared = A_DECLARED_STAGE.exec(withoutFencedBlocks(read(skillFile(skill))));

  return (declared?.[FIRST_GROUP]?.match(A_NUMBER) ?? []).map(Number);
};

const stagesOutOfStep = (): readonly string[] => {
  const reached = skillsByStage(read(FLOW_DOCUMENT));

  const reaches = (skill: string, stage: number): boolean =>
    reached.some(([named, drawn]) => named === skill && drawn === stage);

  return [
    ...reached
      .filter(([skill, stage]) => !stagesClaimedBy(skill).includes(stage))
      .map(
        ([skill, stage]) =>
          `${skillFile(skill)}: ${FLOW_DOCUMENT} reaches for this skill in stage ` +
          `${String(stage)}, and the skill claims no such stage — say "> **Stage ` +
          `${String(stage)}**" under its title`
      ),
    ...readdirSync(SKILLS_FOLDER).flatMap((skill) =>
      stagesClaimedBy(skill)
        .filter((stage) => !reaches(skill, stage))
        .map(
          (stage) =>
            `${skillFile(skill)}: claims stage ${String(stage)}, which ${FLOW_DOCUMENT} ` +
            `does not reach for it in — a claim nobody draws is a number that drifts`
        )
    ),
  ];
};

const flowOutOfStep = (): readonly string[] => {
  const drawing = read(FLOW_DOCUMENT);
  const installed = new Set(readdirSync(SKILLS_FOLDER));
  const scripts = new Set(Object.keys(JSON.parse(read("package.json")).scripts));

  return [
    ...namesIn(drawing, A_NAMED_SKILL)
      .filter((skill) => !installed.has(skill))
      .map(
        (skill) =>
          `${FLOW_DOCUMENT}: draws a step reaching for the "${skill}" skill, ` +
          `which is not in ${SKILLS_FOLDER}`
      ),
    ...namesIn(drawing, A_NAMED_COMMAND)
      .filter((command) => !scripts.has(command))
      .map(
        (command) =>
          `${FLOW_DOCUMENT}: draws "npm run ${command}", which package.json does not have`
      ),
  ];
};

const AGENTS_FOLDER = ".claude/agents";

const A_MARKDOWN_FILE = /\.md$/;

const unreachableHelp = (): readonly string[] => {
  const session = read(SESSION_DOCUMENT);
  const skills = readdirSync(SKILLS_FOLDER);
  const agents = readdirSync(AGENTS_FOLDER).map((file) => file.replace(A_MARKDOWN_FILE, ""));

  return [
    ...skills
      .filter((skill) => !session.includes(skill))
      .map(
        (skill) =>
          `${SESSION_DOCUMENT}: names no route to the "${skill}" skill — a skill ` +
          `nothing points at is one nobody loads`
      ),
    ...agents
      .filter((agent) => !session.includes(agent))
      .map(
        (agent) =>
          `${SESSION_DOCUMENT}: names no route to the "${agent}" agent — an agent ` +
          `nothing points at never runs`
      ),
  ];
};

const complaints = [
  ...brokenLinks(),
  ...flowOutOfStep(),
  ...stagesOutOfStep(),
  ...unreachableHelp(),
  ...featuresMissingFromTheTree(),
  ...scriptsOutOfStep(),
  ...crowdedLayers(),
  ...schemaOutOfStep(),
  ...postersOutOfTheGallery(),
  ...mockupsOutOfStep(),
  ...sitePostersOutOfStep(),
  ...siteCssOutOfStep(),
  ...requiredKeysOutOfStep(),
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

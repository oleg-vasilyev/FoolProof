import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { DESIGN_PAGE_SYNC, fingerprintOf } from "./design-page.ts";
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

const AN_APPROVED_CASE_LIST = /^(gallery(-[a-z-]+)?)\.cases\.txt$/;

const A_CASE_NAME = /^([a-z][a-z0-9-]*) — \S/;

const A_LINE = /\r?\n/;

const A_TS_FILE = /\.ts$/;

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

const approvedListsIn = (): readonly string[] =>
  readdirSync(MOCKUP_DIR).filter((name) => AN_APPROVED_CASE_LIST.test(name));

const scriptBehind = (list: string): string =>
  `${AN_APPROVED_CASE_LIST.exec(list)?.[FIRST_GROUP] ?? ""}.ts`;

const casesApprovedIn = (list: string): readonly string[] =>
  read(join(MOCKUP_DIR, list))
    .split(A_LINE)
    .map((line) => A_CASE_NAME.exec(line))
    .filter((named) => named !== null)
    .map((named) => named[FIRST_GROUP] ?? "");

const casesMissingFrom = (list: string): readonly string[] => {
  const script = scriptBehind(list);

  if (!gallerySources().includes(script)) {
    return [
      `${MOCKUP_DIR}/${list}: names ${SCRIPTS_FOLDER}/${script}, which does not exist ` +
        `— an approved list of edges that nothing was ever written to draw`,
    ];
  }

  const drawn = read(join(SCRIPTS_FOLDER, script));

  return casesApprovedIn(list)
    .filter((approved) => !drawn.includes(`name: "${approved}"`))
    .map(
      (approved) =>
        `${MOCKUP_DIR}/${list}: "${approved}" was approved on a contact sheet and ` +
          `${SCRIPTS_FOLDER}/${script} draws no case by that name — an edge the owner ` +
          `looked at is now drawn by nobody`
    );
};

const casesOutOfStep = (): readonly string[] => {
  const lists = approvedListsIn();

  return [
    ...gallerySources()
      .filter((script) => !lists.some((list) => scriptBehind(list) === script))
      .map(
        (script) =>
          `${SCRIPTS_FOLDER}/${script}: draws cases no approved list holds — put the ` +
            `edges the owner signed off into ` +
            `${MOCKUP_DIR}/${script.replace(A_TS_FILE, "")}.cases.txt, or the gallery ` +
            `is judged against nothing`
      ),
    ...lists.flatMap(casesMissingFrom),
  ];
};

const mockupsOutOfStep = (): readonly string[] =>
  drawingsOutOfStep(MOCKUP_DIR, posters(), "mockups");

const A_SYNCED_FINGERPRINT = /^mockups: ([0-9a-f]{64})$/m;

const designPageOutOfStep = (): readonly string[] => {
  const behind =
    `${DESIGN_PAGE_SYNC}: the Claude Design page was last synced from different ` +
    `drawings than the code now produces — the "update-the-design-page" skill carries ` +
    `them back, and rewrites this file with the fingerprint it pushed`;

  if (!existsSync(DESIGN_PAGE_SYNC)) {
    return [behind];
  }

  return A_SYNCED_FINGERPRINT.exec(read(DESIGN_PAGE_SYNC))?.[FIRST_GROUP] === fingerprintOf(posters())
    ? []
    : [behind];
};

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

const A_DRAWN_IMAGE = /<img\s[^>]*>/g;

const AN_ATTRIBUTE = (name: string): RegExp => new RegExp(`\\s${name}="([^"]*)"`);

const KILOBYTE = 1024;

const A_ROUNDING = 0.005;

const A_PAGE_BUDGET = 220 * KILOBYTE;

const PNG_WIDTH_AT = 16;

const PNG_HEIGHT_AT = 20;

const WEBP_FOURCC_AT = 12;

const WEBP_VP8_WIDTH_AT = 26;

const FOURTEEN_BITS = 0x3fff;

const NEXT_TWO_BYTES = 2;

const A_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const FOURCC_LENGTH = 4;

const SHORTEST_HEADER = 30;

const sizeOfDrawing = (bytes: Buffer): readonly [number, number] | null => {
  if (bytes.length < SHORTEST_HEADER) {
    return null;
  }

  if (bytes.subarray(NOTHING, A_PNG.length).equals(A_PNG)) {
    return [bytes.readUInt32BE(PNG_WIDTH_AT), bytes.readUInt32BE(PNG_HEIGHT_AT)];
  }

  if (bytes.toString("ascii", WEBP_FOURCC_AT, WEBP_FOURCC_AT + FOURCC_LENGTH) === "VP8 ") {
    return [
      bytes.readUInt16LE(WEBP_VP8_WIDTH_AT) & FOURTEEN_BITS,
      bytes.readUInt16LE(WEBP_VP8_WIDTH_AT + NEXT_TWO_BYTES) & FOURTEEN_BITS,
    ];
  }

  return null;
};

const imagesOutOfStep = (): readonly string[] =>
  SITE_PAGES.flatMap((page) => {
    const folder = dirname(page);
    let served = NOTHING;

    const complaints = (read(page).match(A_DRAWN_IMAGE) ?? []).flatMap((tag) => {
      const source = AN_ATTRIBUTE("src").exec(tag)?.[FIRST_GROUP];
      const width = AN_ATTRIBUTE("width").exec(tag)?.[FIRST_GROUP];
      const height = AN_ATTRIBUTE("height").exec(tag)?.[FIRST_GROUP];

      if (source === undefined || width === undefined || height === undefined) {
        return [
          `${page}: draws ${tag} without a src, a width and a height between them — an ` +
            `image this check cannot read is one it cannot weigh either, and it would ` +
            `pass in silence`,
        ];
      }

      const file = join(folder, source);

      if (!existsSync(file)) {
        return [`${page}: draws ${source}, which is not there — the page would show a gap`];
      }

      const bytes = readFileSync(file);

      served += bytes.length;

      const size = sizeOfDrawing(bytes);

      if (size === null) {
        return [
          `${page}: draws ${source}, which is neither a PNG nor the plain WebP this check ` +
            `can measure — teach it that shape rather than trusting the page's own numbers`,
        ];
      }

      const [wide, tall] = size;
      const declared = Number(width) / Number(height);
      const drawnAs = wide / tall;

      return Math.abs(declared - drawnAs) / drawnAs <= A_ROUNDING
        ? []
        : [
            `${page}: says ${source} is ${width}×${height}, which is not the shape of the ` +
              `${String(wide)}×${String(tall)} it actually is — the browser reserves the ` +
              `wrong room and the page jumps as it loads`,
          ];
    });

    return served <= A_PAGE_BUDGET
      ? complaints
      : [
          ...complaints,
          `${page}: serves ${String(Math.round(served / KILOBYTE))}KB of pictures, past the ` +
            `${String(A_PAGE_BUDGET / KILOBYTE)}KB a landing page may spend — draw them ` +
            `smaller or in a leaner format rather than raising this`,
        ];
  });

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

const A_COUNTED_FORM = /^\s*\w*Forms: \{ one: "([^"]+)", few: "([^"]+)", many: "([^"]+)" \},$/gm;

const AN_INTERPOLATION_BEFORE_A_WORD = /\$\{[^}]+\}[  ]+([\p{L}]+)/gu;

const A_COPY_TABLE = /^copy\.[a-z]{2}\.ts$/;

const copyTablesIn = (): readonly string[] =>
  readdirSync(FEATURE_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((feature) =>
      readdirSync(join(FEATURE_FOLDERS, feature.name))
        .filter((name) => A_COPY_TABLE.test(name))
        .map((name) => join(FEATURE_FOLDERS, feature.name, name))
    );

const countedWordsIn = (table: string): ReadonlySet<string> =>
  new Set([...table.matchAll(A_COUNTED_FORM)].flatMap((found) => found.slice(FIRST_GROUP)));

const bakedFormsIn = (file: string): readonly string[] => {
  const table = read(file);
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

const formsBakedIntoCopy = (): readonly string[] => copyTablesIn().flatMap(bakedFormsIn);

const complaints = [
  ...formsBakedIntoCopy(),
  ...brokenLinks(),
  ...flowOutOfStep(),
  ...stagesOutOfStep(),
  ...unreachableHelp(),
  ...featuresMissingFromTheTree(),
  ...scriptsOutOfStep(),
  ...crowdedLayers(),
  ...schemaOutOfStep(),
  ...postersOutOfTheGallery(),
  ...casesOutOfStep(),
  ...mockupsOutOfStep(),
  ...designPageOutOfStep(),
  ...sitePostersOutOfStep(),
  ...siteCssOutOfStep(),
  ...imagesOutOfStep(),
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

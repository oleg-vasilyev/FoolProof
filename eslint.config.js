import unusedImports from "eslint-plugin-unused-imports";
import tsParser from "@typescript-eslint/parser";

// Lint rules that enforce the conventions in CLAUDE.md, so that a convention is
// a build error rather than something a reviewer has to remember. Anything that
// can be checked mechanically belongs here; CLAUDE.md keeps only the rules that
// need judgement.

// The rules with no core equivalent, small enough to live inline rather than as
// a published plugin. Counted here once and wrong ever since, so no longer counted.
const project = {
  rules: {
    // "No comments in src/" — naming carries the intent, and an explanation that
    // does not fit in a name belongs in PLAN.md. This file is exempt because the
    // rule only ever runs against src/.
    "no-comments": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          found: "No comments in src/ or scripts/ — say it in a name, or in PLAN.md.",
        },
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              context.report({ loc: comment.loc, messageId: "found" });
            }
          },
        };
      },
    },
    // "No magic numbers" as this project actually means it: a number must be
    // *named*, so it may appear in a `const NAME = …` initializer and nowhere
    // else. The core no-magic-numbers rule cannot express that — it flags
    // `const ABANDON_AFTER_SECONDS = 3 * 60 * 60`, which is the very shape the
    // convention asks for. 0 and 1 are exempt: an index, a length or a step is
    // not a magic number.
    "named-numbers": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          unnamed: "Name this number with a const — the intent has to fit in the name.",
        },
      },
      create(context) {
        const ALWAYS_CLEAR = new Set([0, 1]);

        const namesTheNumber = (node) => {
          for (let current = node.parent; current; current = current.parent) {
            switch (current.type) {
              case "VariableDeclarator":
                return current.parent.kind === "const";

              case "ArrowFunctionExpression":
              case "FunctionDeclaration":
              case "FunctionExpression":
                return false;

              default:
                break;
            }
          }

          return false;
        };

        return {
          Literal(node) {
            if (typeof node.value !== "number") {
              return;
            }

            const negated =
              node.parent.type === "UnaryExpression" && node.parent.operator === "-";
            const value = negated ? -node.value : node.value;

            if (ALWAYS_CLEAR.has(value) || namesTheNumber(node)) {
              return;
            }

            context.report({ node: negated ? node.parent : node, messageId: "unnamed" });
          },
        };
      },
    },
    // A state's name is declared once, in a frozen table beside its union, and
    // read from there. Spelling it again is what makes one file depend on how
    // another file happens to write a word, and makes renaming it a grep.
    // `typeof x === "string"` and a comparison against "" are not states.
    "named-states": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          spelled:
            "Read this state from the table that declares it, rather than spelling it again here.",
        },
      },
      create(context) {
        // The fields a discriminated union is dispatched on here. `name` is
        // deliberately absent: `name: "game"` is a command and `name: "Oleg"` is a
        // player, so only a *comparison* against `.name` is unambiguously a state.
        const DISCRIMINANTS = new Set([
          "kind",
          "outcome",
          "phase",
          "problem",
          "finish",
          "role",
          "because",
          "reason",
          "action",
        ]);

        const isText = (node) => node.type === "Literal" && typeof node.value === "string";

        const asksTheType = (node) =>
          node.type === "UnaryExpression" && node.operator === "typeof";

        // A spec also compares wire values — `call[0] === "help"`, `method ===
        // "sendMessage"` — which are the literal under test rather than a state
        // spelled twice, so there the comparison has to name a discriminant.
        const readsAState = (node) =>
          node.type === "MemberExpression" &&
          node.property.type === "Identifier" &&
          (DISCRIMINANTS.has(node.property.name) || node.property.name === "name");

        const isSpec = context.filename.endsWith(".spec.ts");

        const FUNCTIONS = new Set([
          "ArrowFunctionExpression",
          "FunctionDeclaration",
          "FunctionExpression",
        ]);

        const enclosingReturnType = (node) => {
          for (let current = node.parent; current; current = current.parent) {
            if (FUNCTIONS.has(current.type)) {
              return current.returnType?.typeAnnotation;
            }
          }

          return undefined;
        };

        // `: string` may hold any text; `: Phase` may hold only what the Phase
        // table says. Anything else — a union, a promise, a literal type — is
        // left alone rather than guessed at.
        const namesAType = (annotation) => annotation?.type === "TSTypeReference";

        const branchesOf = (expression) =>
          expression.type === "ConditionalExpression"
            ? [expression.consequent, expression.alternate]
            : [expression];

        return {
          SwitchCase(node) {
            if (node.test && isText(node.test)) {
              context.report({ node: node.test, messageId: "spelled" });
            }
          },
          Property(node) {
            if (node.computed || node.key.type !== "Identifier") {
              return;
            }

            if (DISCRIMINANTS.has(node.key.name) && isText(node.value)) {
              context.report({ node: node.value, messageId: "spelled" });
            }
          },
          // A function that promises a named type and hands back a bare string
          // is spelling the state a third way: not in a case, not in a
          // comparison, so neither check above sees it. `phaseOf` returned
          // "READY" for a whole phase after the table was introduced.
          ReturnStatement(node) {
            if (node.argument !== null && namesAType(enclosingReturnType(node))) {
              for (const returned of branchesOf(node.argument)) {
                if (isText(returned)) {
                  context.report({ node: returned, messageId: "spelled" });
                }
              }
            }
          },
          BinaryExpression(node) {
            if (node.operator !== "===" && node.operator !== "!==") {
              return;
            }

            if (asksTheType(node.left) || asksTheType(node.right)) {
              return;
            }

            if (isSpec && !readsAState(node.left) && !readsAState(node.right)) {
              return;
            }

            for (const side of [node.left, node.right]) {
              if (isText(side) && side.value !== "") {
                context.report({ node: side, messageId: "spelled" });
              }
            }
          },
        };
      },
    },
    // Every import belongs in the header. Imports are hoisted, so one that
    // lands lower down still runs — a scripted edit that appended one to the
    // end of a file compiled and passed every test, and the blank-line rule
    // below could not see it because there was no statement after it to
    // measure against.
    "imports-first": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          late: "An import belongs in the header, above the first statement.",
        },
      },
      create(context) {
        return {
          Program(program) {
            const firstStatement = program.body.findIndex(
              (statement) => statement.type !== "ImportDeclaration"
            );

            if (firstStatement < 0) {
              return;
            }

            for (const statement of program.body.slice(firstStatement)) {
              if (statement.type === "ImportDeclaration") {
                context.report({ node: statement, messageId: "late" });
              }
            }
          },
        };
      },
    },
    // Exactly two blank lines after the last import, so the imports read as a
    // header rather than as the first statements.
    "blank-lines-after-imports": {
      meta: {
        type: "layout",
        fixable: "whitespace",
        schema: [],
        messages: {
          spacing: "Leave exactly two blank lines after the last import.",
        },
      },
      create(context) {
        const REQUIRED_BLANK_LINES = 2;

        return {
          Program(program) {
            const lastImportIndex = program.body.findLastIndex(
              (statement) => statement.type === "ImportDeclaration"
            );
            const lastImport = program.body[lastImportIndex];
            const firstStatement = program.body[lastImportIndex + 1];

            if (lastImport === undefined || firstStatement === undefined) {
              return;
            }

            const blankLines = firstStatement.loc.start.line - lastImport.loc.end.line - 1;

            if (blankLines !== REQUIRED_BLANK_LINES) {
              context.report({
                loc: lastImport.loc,
                messageId: "spacing",
                fix: (fixer) =>
                  fixer.replaceTextRange(
                    [lastImport.range[1], firstStatement.range[0]],
                    "\n".repeat(REQUIRED_BLANK_LINES + 1)
                  ),
              });
            }
          },
        };
      },
    },
    // "Only sqlite-repository.ts opens the database." This is the rule the whole
    // repository layer rests on — a file that imports the connection can only be
    // tested against a real SQLite — and until now nothing but prose and a reviewer
    // held it, so any feature could open the connection and keep the lint green.
    // It is its own rule rather than another entry in the zones' ban lists because
    // the door has to be left open for two kinds of file, and exempting them by file
    // glob would need blocks that overlap the zones — and a later block replaces an
    // earlier one for the same rule name, which is the trap the zones already carry
    // twice. A rule with its own name collides with nothing and states its own
    // exemptions: the one repository file, by its full path rather than its
    // basename, and any integration spec, which drives a real database on purpose.
    // It matches the connection by basename, so a sibling's `./sqlite-connection.ts`
    // is caught too — that spelling is the natural one for exactly the two files
    // this rule exists to keep out. A computed specifier is invisible to it, as it
    // is to the zones below.
    "one-door-to-the-database": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          opened:
            "Only sqlite-repository.ts opens the database — depend on the Repository " +
            "interface and call a named domain method instead.",
        },
      },
      create(context) {
        const THE_CONNECTION = /(^|\/)sqlite-connection\.ts$/;

        const THE_ONE_DOOR = /\/src\/shared\/repository\/sqlite-repository\.ts$/;

        const AN_INTEGRATION_SPEC = /\.integration\.spec\.ts$/;

        const A_WINDOWS_SEPARATOR = /\\/g;

        const opener = context.filename.replace(A_WINDOWS_SEPARATOR, "/");

        if (THE_ONE_DOOR.test(opener) || AN_INTEGRATION_SPEC.test(opener)) {
          return {};
        }

        const opensIt = (node) => {
          if (typeof node.value === "string" && THE_CONNECTION.test(node.value)) {
            context.report({ node, messageId: "opened" });
          }
        };

        return {
          "ImportDeclaration > Literal": opensIt,
          "ImportExpression > Literal": opensIt,
          "TSImportType > Literal": opensIt,
          "ExportNamedDeclaration > Literal": opensIt,
          "ExportAllDeclaration > Literal": opensIt,
        };
      },
    },
    // "One control row." What such a row is, and why its two slots never vary,
    // is PLAN.md's "The control row" — including the three shapes this rule
    // cannot see, which stay a reviewer's job. Here is only the enforcement. It
    // polices the four captions such a row is made of, and demands more than an
    // import: each caption has to be written *inside* a controlRow(…) call, so
    // a keyboard that uses the builder and then hand-builds a second way out
    // beside it is caught too. That second row is the shape the probe used,
    // since a missing import is already a lint error here and would have proved
    // nothing.
    "one-control-row": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          loose:
            "A way off a screen and a way on are drawn by shared/telegram/control-row.ts, " +
            "so Cancel keeps the same side and the same red on every screen, and Confirm " +
            "the same side and the same green.",
        },
      },
      create(context) {
        const A_KEYBOARD = /-keyboard\.ts$/;

        const A_WINDOWS_SEPARATOR = /\\/g;

        const THE_BUILDER = "controlRow";

        const A_CONTROL_CAPTION = new Set([
          "buttonCancel",
          "buttonBack",
          "buttonConfirm",
          "buttonPlay",
        ]);

        const drawn = context.filename.replace(A_WINDOWS_SEPARATOR, "/");

        if (!A_KEYBOARD.test(drawn)) {
          return {};
        }

        const insideTheBuilder = (node) => {
          for (let current = node.parent; current; current = current.parent) {
            if (
              current.type === "CallExpression" &&
              current.callee.type === "Identifier" &&
              current.callee.name === THE_BUILDER
            ) {
              return true;
            }
          }

          return false;
        };

        return {
          MemberExpression(node) {
            if (node.property.type !== "Identifier") {
              return;
            }

            if (A_CONTROL_CAPTION.has(node.property.name) && !insideTheBuilder(node)) {
              context.report({ node, messageId: "loose" });
            }
          },
        };
      },
    },
  },
};

// The layering rule from CLAUDE.md, expressed as import bans. Inside a feature
// imports point only downward: `bot` may reach `render` and `domain`, `render`
// may reach `domain`, `domain` reaches nothing. Across features they may not
// point at all.
//
// Every zone sets the same rule name, and a later flat-config block REPLACES an
// earlier one for a file matched by both. So the file globs below must not
// overlap: each file falls in exactly one zone and gets one combined pattern
// list. Splitting purity and independence into separate blocks silently drops
// whichever comes first.
//
// Second trap, from the same family: a ban is a *glob*, and minimatch reads a
// leading `#` as a comment, so `#live-game/**` matches nothing at all and the
// zone silently passes everything. Imports here are Node subpath aliases, so
// every ban starting with `#` is converted to a `regex` pattern instead. Both
// traps were found by running deliberate violations — never assume a zone fires.
//
// Third trap, found the same way: `no-restricted-imports` reads only a static
// `import` declaration. It cannot see `await import("…")`, and every spec here
// loads its subject that way because `vi.mock` is hoisted above the imports — so
// the zones were blind to the one import form 102 of these files use. The same
// bans are therefore compiled a second time into `no-restricted-syntax`, which
// walks the syntax tree and does see it — as `ImportExpression` for the runtime
// form and `TSImportType` for `typeof import("…")`, which is a different node and
// was blind for the same reason. What stays invisible to all of them is a computed
// specifier, which is why `scripts/feature-drawings.ts` may build one from a
// template literal to find features at run time.
const A_REGEX_CHARACTER = /[.+?^${}()|[\]\\]/g;

const A_FORWARD_SLASH = /\//g;

const A_TRAILING_GLOB = /\/\*\*$/;

const PAST_THE_LEADING_GLOB = 3;

const WITHOUT_THE_TRAILING_GLOB = -3;

const WITHOUT_THE_TRAILING_STAR = -1;

const quoted = (text) => text.replace(A_REGEX_CHARACTER, "\\$&");

// A ban is written as a glob; this is the same ban as a regular expression over
// the specifier itself, so that one list can drive both rules.
const asAPattern = (ban) => {
  if (ban.startsWith("**/")) {
    return quoted(`/${ban.slice(PAST_THE_LEADING_GLOB).replace(A_TRAILING_GLOB, "")}/`);
  }

  if (ban.endsWith("/**")) {
    return `^${quoted(ban.slice(0, WITHOUT_THE_TRAILING_GLOB))}/`;
  }

  if (ban.endsWith("*")) {
    return `^${quoted(ban.slice(0, WITHOUT_THE_TRAILING_STAR))}`;
  }

  return `^${quoted(ban)}$`;
};

const forbid = (bans, message) => {
  const globs = bans.filter((ban) => !ban.startsWith("#"));
  const aliases = bans.filter((ban) => ban.startsWith("#"));

  return {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...(globs.length > 0 ? [{ group: globs, message }] : []),
          ...aliases.map((alias) => ({ regex: `^${alias.replace("**", "")}`, message })),
        ],
      },
    ],
    "no-restricted-syntax": [
      "error",
      ...bans.flatMap((ban) => {
        const pattern = asAPattern(ban).replace(A_FORWARD_SLASH, "\\/");

        return [
          { selector: `ImportExpression > Literal[value=/${pattern}/]`, message },
          { selector: `TSImportType > Literal[value=/${pattern}/]`, message },
        ];
      }),
    ],
  };
};

const FRAMEWORK = ["grammy", "grammy/*", "@resvg/*", "node:*"];

const FEATURES = ["live-game", "merge-names", "scoresheet", "diagnostics", "language"];

// Imports are written as Node subpath aliases (`#live-game/bot/x.ts`), so that is
// the shape the bans have to name. The relative globs stay listed as well, so a
// relative import that slips back in is caught too.
const otherFeatures = (self) =>
  FEATURES.filter((name) => name !== self).flatMap((name) => [
    `#${name}/**`,
    `**/${name}/**`,
    `**/features/${name}/**`,
  ]);

const independence = (self) =>
  `A feature is independent — ${self}/ may not reach into another feature, and never into the app shell (#app/).`;

// `#app/**` is the composition root and its own copy. Nothing below it may reach
// back up, so every zone bans it alongside the other features.
const above = (self) => [...otherFeatures(self), "#app/**"];

const featureZones = (self) => [
  {
    files: [`src/features/${self}/domain/**/*.ts`],
    rules: forbid(
      [...above(self), `#${self}/render/**`, `#${self}/bot/**`, ...FRAMEWORK],
      `domain/ is the pure core — no framework, no I/O, no rendering. ${independence(self)}`
    ),
  },
  {
    files: [`src/features/${self}/render/**/*.ts`],
    rules: forbid(
      [...above(self), `#${self}/bot/**`, ...FRAMEWORK],
      `render/ turns state into text and SVG — bot orchestrates it, never the reverse. ${independence(self)}`
    ),
  },
  {
    files: [`src/features/${self}/samples/**/*.ts`],
    rules: forbid(
      [...above(self), `#${self}/bot/**`, ...FRAMEWORK],
      `samples/ builds the states this feature draws at — it may call domain/ and render/, but it is not the edge: a sample never rasterizes, never reads a file and never talks to Telegram. ${independence(self)}`
    ),
  },
  {
    files: [`src/features/${self}/bot/**/*.ts`, `src/features/${self}/*.ts`],
    rules: forbid(above(self), independence(self)),
  },
];

export default [
  {
    ignores: ["node_modules/**", "data/**", "reports/**"],
  },
  {
    // scripts/ shares the style rules but not the app rules below: a dev utility
    // may print to the console. It may not import a feature — see the zone at the
    // bottom of this file.
    files: ["src/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "unused-imports": unusedImports,
      project,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "none" },
      ],
      curly: ["error", "all"],
      "prefer-const": "error",
      "no-var": "error",
      "project/no-comments": "error",
      "project/imports-first": "error",
      "project/blank-lines-after-imports": "error",
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.spec.ts", "src/**/*.stub.ts"],
    rules: {
      // App logging goes through shared/logger.ts. Raw console output is for
      // scripts/ dev utilities, which this block does not cover.
      "no-console": "error",
      "project/named-numbers": "error",
    },
  },
  {
    // States are named everywhere, specs included: a fixture that spells a state
    // is the same magic knowledge as a case clause that does. The database door is
    // in the same block for the same reason — a spec that opens the connection is
    // the leak, not an exception to it, and both rules name their own exemptions.
    files: ["src/**/*.ts"],
    rules: {
      "project/named-states": "error",
      "project/one-door-to-the-database": "error",
      "project/one-control-row": "error",
    },
  },
  {
    // The logger is the one file allowed to reach the console — it is the
    // wrapper everything else uses instead.
    files: ["src/shared/logging/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: forbid(
      [...FEATURES.map((name) => `#${name}/**`), "**/features/**", "#app/**"],
      "shared/ is the bottom layer — a feature may import it, never the reverse."
    ),
  },
  ...FEATURES.flatMap(featureZones),
  {
    // e2e/ plays an evening against a real src/main.ts process, so it is a
    // consumer of the app and never part of it: imports are relative, and the
    // `#` aliases stay on the app's side of the line. A scenario that imported
    // copy.en.ts would compare the copy table against itself and assert nothing.
    // No other block matches these files, so this one carries their parser too.
    files: ["e2e/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: forbid(
      ["#app/**", "#shared/**", ...FEATURES.map((name) => `#${name}/**`), "**/src/**"],
      "e2e/ is not the app — import by relative path, never through a # alias and never from src/: a scenario that imports the copy table asserts a constant against itself."
    ),
  },
  {
    // A feature is a folder you can delete, and for a while the tooling made that
    // false: eight scripts imported the scoresheet by name, so removing the folder
    // broke the mockup tools, the site build and docs:check itself. The drawings a
    // feature offers now arrive through #shared/drawings/drawings-contract.ts and
    // are discovered at runtime, so a deleted feature simply stops being listed.
    files: ["scripts/**/*.ts"],
    rules: forbid(
      [...FEATURES.map((name) => `#${name}/**`), "**/features/**"],
      "scripts/ may not name a feature — ask for what features offer through #shared/drawings/drawings-contract.ts, so deleting a folder leaves the tooling running."
    ),
  },
];

import unusedImports from "eslint-plugin-unused-imports";
import tsParser from "@typescript-eslint/parser";

// Lint rules that enforce the conventions in CLAUDE.md, so that a convention is
// a build error rather than something a reviewer has to remember. Anything that
// can be checked mechanically belongs here; CLAUDE.md keeps only the rules that
// need judgement.

// Two rules with no core equivalent. They are small enough to live inline
// rather than as a published plugin.
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
    // may print to the console, and it may import a feature — the mockup tools draw
    // the scoresheet's own posters, which is why no feature zone fences scripts/.
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
    // is the same magic knowledge as a case clause that does.
    files: ["src/**/*.ts"],
    rules: {
      "project/named-states": "error",
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
];

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
          found: "No comments in src/ — say it in a name, or in PLAN.md.",
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

// The layering rule from CLAUDE.md, expressed as import bans: imports point only
// downward. `bot` may reach `game` and `render`; `render` may reach `game`;
// `game` and `shared` reach nothing above themselves.
const forbid = (groups, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group: groups, message }] }],
});

export default [
  {
    ignores: ["node_modules/**", "data/**", "coverage/**", "reports/**", ".stryker-tmp/**"],
  },
  {
    files: ["src/**/*.ts"],
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
    // The logger is the one file allowed to reach the console — it is the
    // wrapper everything else uses instead.
    files: ["src/shared/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: forbid(
      ["**/features/**"],
      "shared/ is the bottom layer — a feature may import it, never the reverse."
    ),
  },
  {
    files: ["src/features/game/**/*.ts"],
    rules: forbid(
      ["**/bot/**", "**/render/**"],
      "features/game/ is the pure reducer — it imports no other feature."
    ),
  },
  {
    files: ["src/features/render/**/*.ts"],
    rules: forbid(
      ["**/bot/**"],
      "features/render/ is pure — bot orchestrates render, never the reverse."
    ),
  },
];

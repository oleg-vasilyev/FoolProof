import unusedImports from "eslint-plugin-unused-imports";
import tsParser from "@typescript-eslint/parser";

// Lint rules that back the conventions in CLAUDE.md. Kept intentionally small
// and autofix-friendly: `npm run lint:fix` (and the Stop hook) cleans them.
// The "no comments in src/" rule has no ESLint equivalent and stays a review
// convention — see CLAUDE.md.
export default [
  {
    ignores: ["node_modules/**", "data/**", "dist/**"],
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
    },
    rules: {
      // Remove unused imports automatically on --fix.
      "unused-imports/no-unused-imports": "error",
      // Flag unused variables (no autofix; _-prefixed are intentional).
      // args: "none" — don't flag function/interface parameters, which are
      // often signature documentation rather than dead code.
      "unused-imports/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", args: "none" }],
      // Never an `if` without braces.
      curly: ["error", "all"],
      // `const` over `let` is a stated project rule, not just a preference.
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];

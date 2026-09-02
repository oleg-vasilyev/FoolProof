import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { read } from "../document-files.ts";
import { A_LINE } from "../markdown-text.ts";


const ATTRIBUTES = ".gitattributes";

const NOT_WALKED = new Set([".git", "node_modules", "reports", "data", ".stryker-tmp"]);

const A_COMMENT = "#";

const A_PATTERN_THIS_CANNOT_READ = /^\/|\*\*|[?[\]!]/;

const BETWEEN_FIELDS = /\s+/;

const FIRST_FIELD = 0;

const DEMANDS_LF = "eol=lf";

const A_CARRIAGE_RETURN = "\r";

const A_SPECIAL_CHARACTER = /[.+?^${}()|[\]\\]/g;

const IN_ONE_FOLDER = "[^/]*";

const A_WINDOWS_SEPARATOR = /\\/g;

const THE_REPOSITORY = ".";

export const pathsDemandingLf = (attributes: string): readonly string[] =>
  attributes
    .split(A_LINE)
    .filter((line) => !line.startsWith(A_COMMENT) && line.includes(DEMANDS_LF))
    .map((line) => line.trim().split(BETWEEN_FIELDS)[FIRST_FIELD] ?? "");

export const walkedInto = (name: string): boolean => !NOT_WALKED.has(name);

export const demandsLf = (path: string, pattern: string): boolean => {
  const literal = pattern
    .split("*")
    .map((part) => part.replaceAll(A_SPECIAL_CHARACTER, (character) => `\\${character}`))
    .join(IN_ONE_FOLDER);
  const against = pattern.includes("/") ? path : (path.split("/").pop() ?? path);

  return new RegExp(`^${literal}$`).test(against);
};

export const beyondThisCheck = (pattern: string): boolean =>
  A_PATTERN_THIS_CANNOT_READ.test(pattern);

export const endingComplaints = (
  paths: readonly string[],
  patterns: readonly string[],
  contentOf: (path: string) => string
): readonly string[] => [
  ...patterns
    .filter(beyondThisCheck)
    .map(
      (pattern) =>
        `${ATTRIBUTES}: writes "${pattern}", which this check cannot read — it knows a ` +
        `literal path and a "*" standing for part of one folder name, so every file that ` +
        `rule covers would go unchecked while the gate still reported agreement; teach it ` +
        `that shape rather than leaving it narrower than the file it reads`
    ),
  ...paths
    .filter((path) =>
      patterns.filter((pattern) => !beyondThisCheck(pattern)).some((pattern) => demandsLf(path, pattern))
    )
    .filter((path) => contentOf(path).includes(A_CARRIAGE_RETURN))
    .map(
      (path) =>
        `${path}: is checked out with CRLF, and ${ATTRIBUTES} says it must be LF — the ` +
        `carriage return travels to the Linux host that reads the file, and a tool editing ` +
        `it here will disagree with the repository about where a line ends; run ` +
        `"git add --renormalize ." and check the file out again`
    ),
];

const filesUnder = (folder: string): readonly string[] =>
  readdirSync(folder, { withFileTypes: true })
    .filter((entry) => walkedInto(entry.name))
    .flatMap((entry) =>
      entry.isDirectory()
        ? filesUnder(join(folder, entry.name))
        : [join(folder, entry.name).replaceAll(A_WINDOWS_SEPARATOR, "/")]
    );

export const lineEndingsOutOfStep = (): readonly string[] =>
  endingComplaints(
    filesUnder(THE_REPOSITORY),
    pathsDemandingLf(read(ATTRIBUTES)),
    (path) => readFileSync(path, "utf8")
  );

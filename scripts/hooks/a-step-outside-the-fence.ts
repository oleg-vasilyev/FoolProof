import { posix, win32 } from "node:path";


const PATH_FIELDS = ["file_path", "path", "notebook_path"] as const;

const PATH_TOOLS = new Set(["Read", "Edit", "Write", "MultiEdit", "NotebookEdit", "Glob", "Grep"]);

const SHELL_TOOL = "Bash";

const A_QUOTE = /["'`]/g;

const A_TRAILING_STOP = /[:,;]+$/;

const A_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

const A_PATTERN_CHARACTER = /[|*?()[\]{}^]/;

const ROOT_RELATIVE = /^[/\\](?![/\\])/;

const A_SPLIT_OPTION = /^--?[\w-]+=(.+)$/;

const A_MSYS_DRIVE = /^\/([a-zA-Z])\//;

const A_WINDOWS_DRIVE = /^[a-zA-Z]:/;

const A_HOME = /^(~|\$HOME|%USERPROFILE%)(?=[/\\]|$)/;

const A_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

const LOOKS_LIKE_A_PATH = /[/\\]|^~$|^\.\.$/;

const CLIMBS = /(^|[/\\])\.\.([/\\]|$)/;

const THE_WHOLE_MATCH = 0;

const FIRST = 1;

const NOTHING = 0;

export interface ToolCall {
  readonly tool: string;
  readonly input: Readonly<Record<string, unknown>>;
}

const pathsFor = (fence: string): typeof win32 | typeof posix =>
  A_WINDOWS_DRIVE.test(fence) ? win32 : posix;

const asLocalPath = (token: string): string => {
  const drive = A_MSYS_DRIVE.exec(token);

  return drive === null
    ? token
    : `${drive[FIRST] ?? ""}:/${token.slice(drive[THE_WHOLE_MATCH].length)}`;
};

const inside = (fences: readonly string[], path: string): boolean =>
  fences.some((fence) => {
    const paths = pathsFor(fence);
    const root = paths.resolve(fence).toLowerCase();
    const candidate = paths.resolve(path).toLowerCase();

    return candidate === root || candidate.startsWith(`${root}${paths.sep}`);
  });

const leaves = (fences: readonly string[], cwd: string, token: string): boolean => {
  if (A_HOME.test(token)) {
    return true;
  }

  const path = asLocalPath(token);
  const paths = pathsFor(cwd);

  if (paths === win32 && ROOT_RELATIVE.test(path) && !A_WINDOWS_DRIVE.test(path)) {
    return false;
  }

  if (CLIMBS.test(path) || paths.isAbsolute(path)) {
    return !inside(fences, paths.isAbsolute(path) ? path : paths.resolve(cwd, path));
  }

  return false;
};

const tokensOf = (command: string): readonly string[] =>
  command
    .replaceAll(A_QUOTE, " ")
    .split(/\s+/)
    .filter((token) => token !== "")
    .map((token) => (A_SPLIT_OPTION.exec(token)?.[FIRST] ?? token).replace(A_TRAILING_STOP, ""))
    .filter((token) => (A_LETTER_OR_DIGIT.test(token) || CLIMBS.test(token)) && !A_PATTERN_CHARACTER.test(token))
    .filter((token) => !A_URL.test(token) && LOOKS_LIKE_A_PATH.test(token));

const pathsNamedBy = (call: ToolCall): readonly string[] => {
  if (call.tool === SHELL_TOOL) {
    const command = call.input["command"];

    return typeof command === "string" ? tokensOf(command) : [];
  }

  if (!PATH_TOOLS.has(call.tool)) {
    return [];
  }

  return PATH_FIELDS.flatMap((field) => {
    const value = call.input[field];

    return typeof value === "string" && value !== "" ? [value] : [];
  });
};

export const stepOutsideTheFence = (
  fences: readonly string[],
  cwd: string,
  call: ToolCall
): string | null => {
  const outside = pathsNamedBy(call).filter((path) => leaves(fences, cwd, path));

  if (outside.length === NOTHING) {
    return null;
  }

  return (
    `Refused: ${call.tool} reaches ${outside.join(", ")}, which is outside ${fences.join(" and ")}. ` +
    "This clone is the whole world for this run: everything the task needs is inside it, " +
    "and nothing outside it may be read, written or run."
  );
};

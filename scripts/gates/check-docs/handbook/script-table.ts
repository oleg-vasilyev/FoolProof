import { backtickedWordsOf } from "../shared/markdown-text.ts";
import { TREE_DOCUMENT, read } from "../shared/document-files.ts";
import { packageScripts } from "../shared/source-files.ts";


export const scriptTableComplaints = (
  documented: ReadonlySet<string>,
  scripts: ReadonlySet<string>
): readonly string[] =>
  [...scripts]
    .filter((name) => !documented.has(name))
    .map((name) => `${TREE_DOCUMENT}: does not list the "${name}" script`);

export const scriptsMissingFromTheTable = (): readonly string[] =>
  scriptTableComplaints(backtickedWordsOf(read(TREE_DOCUMENT)), packageScripts());

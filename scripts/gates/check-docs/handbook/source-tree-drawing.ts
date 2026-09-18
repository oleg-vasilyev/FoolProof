import { readdirSync } from "node:fs";
import { SESSION_DOCUMENT, TREE_DOCUMENT, read } from "../shared/document-files.ts";
import { FEATURE_FOLDERS, featureFolders } from "../shared/source-files.ts";


const SHARED_FOLDERS = "src/shared";

const DRAWS_THE_TREE = [TREE_DOCUMENT, SESSION_DOCUMENT];

const sharedFolders = (): readonly string[] =>
  readdirSync(SHARED_FOLDERS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

export const treeDrawingComplaints = (
  documents: readonly string[],
  documentContents: Readonly<Record<string, string>>,
  features: readonly string[],
  shared: readonly string[]
): readonly string[] =>
  documents.flatMap((document) => {
    const tree = documentContents[document] ?? "";

    return [
      ...features
        .filter((feature) => !tree.includes(`${feature}/`))
        .map((feature) => `${document}: does not mention ${FEATURE_FOLDERS}/${feature}/`),
      ...shared
        .filter((folder) => !tree.includes(`${folder}/`))
        .map(
          (folder) =>
            `${document}: does not mention ${SHARED_FOLDERS}/${folder}/ — the tree is the ` +
            `only place a reader learns what is down there, and a folder missing from it ` +
            `is one the next person invents a second time`
        ),
    ];
  });

export const foldersMissingFromTheTree = (): readonly string[] =>
  treeDrawingComplaints(
    DRAWS_THE_TREE,
    Object.fromEntries(DRAWS_THE_TREE.map((document) => [document, read(document)])),
    featureFolders(),
    sharedFolders()
  );

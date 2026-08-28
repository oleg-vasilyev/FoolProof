import { drawnByName } from "./feature-drawings.ts";
import {
  flowWouldNotRender,
  mermaidLinesCarryingASeparator,
} from "./docs-check/documents/mermaid-rendering.ts";
import { agentsWithoutAContract } from "./docs-check/documents/agent-contracts.ts";
import { frontmatterThatWillNotParse } from "./docs-check/documents/frontmatter-yaml.ts";
import { brokenLinks, specContentsOutOfStep } from "./docs-check/documents/document-references.ts";
import { overBudget, pagesOverBudget, skillsOverBudget } from "./docs-check/documents/reading-budgets.ts";
import { citationsWithNoFile, pagesNobodyOpens } from "./docs-check/documents/file-citations.ts";
import { envTemplateOutOfStep, requiredKeysOutOfStep } from "./docs-check/source/env-keys.ts";
import {
  casesOutOfStep,
  designPageOutOfStep,
  mockupsOutOfStep,
  postersOutOfTheGallery,
  sitePostersOutOfStep,
} from "./docs-check/source/committed-pictures.ts";
import { formsBakedIntoCopy } from "./docs-check/source/copy-word-forms.ts";
import { debtWithoutATrigger } from "./docs-check/documents/debt-entry-triggers.ts";
import { DOCUMENTS } from "./docs-check/document-files.ts";
import {
  descriptionsOffTheirStage,
  flowOutOfStep,
  flowRepliesLeaveTheLaneTheyWereAskedOf,
  stagesOutOfStep,
} from "./docs-check/documents/flow-drawing.ts";
import { phaseLogsOffTheMap } from "./docs-check/documents/phase-log-paths.ts";
import { schemaOutOfStep } from "./docs-check/source/running-schema.ts";
import {
  crowdedLayers,
  foldersMissingFromTheTree,
  scriptsOutOfStep,
} from "./docs-check/source/source-tree.ts";
import { imagesOutOfStep, siteCssOutOfStep } from "./docs-check/source/site-pages.ts";


const NOTHING = 0;

const FAILED = 1;

const theMockups = await drawnByName((offered) => offered.mockups());

const theSitePosters = await drawnByName((offered) => offered.sitePosters());

const complaints = [
  ...formsBakedIntoCopy(),
  ...brokenLinks(),
  ...specContentsOutOfStep(),
  ...overBudget(),
  ...skillsOverBudget(),
  ...pagesOverBudget(),
  ...pagesNobodyOpens(),
  ...citationsWithNoFile(),
  ...agentsWithoutAContract(),
  ...frontmatterThatWillNotParse(),
  ...debtWithoutATrigger(),
  ...flowOutOfStep(),
  ...flowRepliesLeaveTheLaneTheyWereAskedOf(),
  ...flowWouldNotRender(),
  ...mermaidLinesCarryingASeparator(),
  ...stagesOutOfStep(),
  ...descriptionsOffTheirStage(),
  ...phaseLogsOffTheMap(),
  ...foldersMissingFromTheTree(),
  ...scriptsOutOfStep(),
  ...crowdedLayers(),
  ...schemaOutOfStep(),
  ...requiredKeysOutOfStep(),
  ...envTemplateOutOfStep(),
  ...postersOutOfTheGallery(),
  ...casesOutOfStep(),
  ...mockupsOutOfStep(theMockups),
  ...designPageOutOfStep(theMockups),
  ...sitePostersOutOfStep(theSitePosters),
  ...siteCssOutOfStep(),
  ...imagesOutOfStep(),
];

for (const complaint of complaints) {
  console.error(complaint);
}

console.log(
  complaints.length === NOTHING
    ? `documents agree: ${String(DOCUMENTS.length)} files, links and anchors resolve`
    : `${String(complaints.length)} problem(s) in the documents`
);

process.exit(complaints.length === NOTHING ? NOTHING : FAILED);

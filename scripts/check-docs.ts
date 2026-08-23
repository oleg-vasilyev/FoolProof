import { drawnByName } from "./feature-drawings.ts";
import {
  flowWouldNotRender,
  mermaidLinesCarryingASeparator,
} from "./docs/a-mermaid-diagram.ts";
import { brokenLinks, specContentsOutOfStep, unreachableHelp } from "./docs/document-links.ts";
import { overBudget, skillsOverBudget } from "./docs/reading-budgets.ts";
import { requiredKeysOutOfStep } from "./docs/required-env-keys.ts";
import {
  casesOutOfStep,
  designPageOutOfStep,
  mockupsOutOfStep,
  postersOutOfTheGallery,
  sitePostersOutOfStep,
} from "./docs/the-committed-pictures.ts";
import { formsBakedIntoCopy } from "./docs/the-copy-tables.ts";
import { debtWithoutATrigger } from "./docs/the-debt-list.ts";
import { DOCUMENTS } from "./docs/the-documents.ts";
import {
  flowOutOfStep,
  flowRepliesLeaveTheLaneTheyWereAskedOf,
  stagesOutOfStep,
} from "./docs/the-flow-drawing.ts";
import { schemaOutOfStep } from "./docs/the-running-schema.ts";
import {
  crowdedLayers,
  featuresMissingFromTheTree,
  scriptsOutOfStep,
} from "./docs/the-source-tree.ts";
import { imagesOutOfStep, siteCssOutOfStep } from "./docs/the-website.ts";


const NOTHING = 0;

const FAILED = 1;

const theMockups = await drawnByName((offered) => offered.mockups());

const theSitePosters = await drawnByName((offered) => offered.sitePosters());

const complaints = [
  ...formsBakedIntoCopy(),
  ...brokenLinks(),
  ...specContentsOutOfStep(),
  ...unreachableHelp(),
  ...overBudget(),
  ...skillsOverBudget(),
  ...debtWithoutATrigger(),
  ...flowOutOfStep(),
  ...flowRepliesLeaveTheLaneTheyWereAskedOf(),
  ...flowWouldNotRender(),
  ...mermaidLinesCarryingASeparator(),
  ...stagesOutOfStep(),
  ...featuresMissingFromTheTree(),
  ...scriptsOutOfStep(),
  ...crowdedLayers(),
  ...schemaOutOfStep(),
  ...requiredKeysOutOfStep(),
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

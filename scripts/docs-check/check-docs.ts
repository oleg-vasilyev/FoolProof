import { drawnByName, featuresThatDraw } from "../drawings/feature-drawings.ts";
import {
  flowWouldNotRender,
  mermaidLinesCarryingASeparator,
} from "./documents/mermaid-rendering.ts";
import { agentsWithoutAContract } from "./documents/agent-contracts.ts";
import { frontmatterThatWillNotParse } from "./documents/frontmatter-yaml.ts";
import { brokenLinks, specContentsOutOfStep } from "./documents/document-references.ts";
import { overBudget, pagesOverBudget, skillsOverBudget } from "./documents/reading-budgets.ts";
import { citationsWithNoFile, pagesNobodyOpens } from "./documents/file-citations.ts";
import { envTemplateOutOfStep, requiredKeysOutOfStep } from "./source/env-keys.ts";
import {
  casesOutOfStep,
  designPageOutOfStep,
  postersOutOfStep,
  postersOutOfTheGallery,
} from "./source/committed-pictures.ts";
import { formsBakedIntoCopy } from "./source/copy-word-forms.ts";
import { advancesOutOfStep } from "./source/glyph-advances.ts";
import { debtWithoutATrigger } from "./documents/debt-entry-triggers.ts";
import { DOCUMENTS, read } from "./document-files.ts";
import {
  descriptionsOffTheirStage,
  flowOutOfStep,
  flowRepliesLeaveTheLaneTheyWereAskedOf,
  stagesOutOfStep,
} from "./documents/flow-drawing.ts";
import {
  TOOLS_SCRIPT,
  commandsNobodyHas,
  toolVerbsIn,
} from "./documents/named-commands.ts";
import { phaseLogsOffTheMap } from "./documents/phase-log-paths.ts";
import { schemaOutOfStep } from "./source/running-schema.ts";
import {
  crowdedLayers,
  foldersMissingFromTheTree,
  scriptsOutOfStep,
} from "./source/source-tree.ts";
import { imagesOutOfStep, siteCssOutOfStep } from "./source/site-pages.ts";
import { lineEndingsOutOfStep } from "./source/line-endings.ts";
import { ALL_GATES } from "../gates/gate-list.ts";


const NOTHING = 0;

const FAILED = 1;

const thePosters = await drawnByName((offered) => offered.posters());

const theToolVerbs = new Set([
  ...toolVerbsIn(read(TOOLS_SCRIPT)),
  ...(await featuresThatDraw()).flatMap((offered) => Object.keys(offered.tools)),
]);

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
  ...commandsNobodyHas(theToolVerbs, new Set(ALL_GATES)),
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
  ...advancesOutOfStep(),
  ...postersOutOfTheGallery(),
  ...casesOutOfStep(),
  ...postersOutOfStep(thePosters),
  ...designPageOutOfStep(thePosters),
  ...siteCssOutOfStep(),
  ...imagesOutOfStep(),
  ...lineEndingsOutOfStep(),
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

import { drawnByName, featuresThatDraw } from "../../drawings/feature-drawings.ts";
import { ALL_GATES } from "../shared/gate-list.ts";
import { CHECK_DOCS_COMPLAINTS } from "../shared/gate-paths.ts";
import { DOCUMENTS, read } from "./shared/document-files.ts";
import { writeComplaints } from "./shared/complaints-report.ts";
import { pointersThatResolveToNothing } from "./prose/broken-pointers.ts";
import { TOOLS_SCRIPT, commandsNothingOffers, toolVerbsIn } from "./prose/named-commands.ts";
import { frontmatterThatWillNotParse } from "./prose/frontmatter-yaml.ts";
import { drawingsThatWouldNotRender } from "./prose/mermaid-drawings.ts";
import { thePlanAndItsContentsListDisagree } from "./handbook/plan-contents-list.ts";
import {
  documentsOverTheirLineBudget,
  pagesOverTheirLineBudget,
  skillsOverTheirLineBudget,
} from "./handbook/line-budgets.ts";
import { pagesNobodyOpens } from "./handbook/skill-pages.ts";
import { agentsWithoutAContract } from "./handbook/agent-contracts.ts";
import { debtWithoutATrigger } from "./handbook/debt-entry-triggers.ts";
import { foldersMissingFromTheTree } from "./handbook/source-tree-drawing.ts";
import { scriptsMissingFromTheTable } from "./handbook/script-table.ts";
import { schemaThePlanDoesNotQuote } from "./handbook/plan-schema-block.ts";
import { theRosterTheFlowDisagreesWith } from "./flow/flow-roster.ts";
import { repliesLeavingTheLaneTheyWereAskedOf } from "./flow/flow-lanes.ts";
import { descriptionsThatNameNoStage, stagesASkillAndTheFlowDisagreeOn } from "./flow/skill-stages.ts";
import { phaseLogsThatDoNotWalkTheDrawing } from "./flow/phase-log-walk.ts";
import { pagesTheirFactTreeContradicts } from "./site/site-text.ts";
import { wordsThePagesMayNotSay } from "./site/site-prose.ts";
import { classesTheStylesheetHasNoRuleFor } from "./site/site-css.ts";
import { picturesThePagesGetWrong } from "./site/site-images.ts";
import { tracesTheRouteNoLongerDraws } from "./site/site-traces.ts";
import { faqTheStructuredDataContradicts } from "./site/site-faq.ts";
import { postersNoGalleryCaseDraws, galleryCasesNobodyApproved } from "./pictures/gallery-cases.ts";
import {
  committedPostersTheRendererDisagreesWith,
  theDesignPageDrawnFromOlderPosters,
} from "./pictures/committed-posters.ts";
import { advancesMeasuredOnOtherFaces } from "./pictures/glyph-advances.ts";
import { copyTablesChoosingAWordForm } from "./codebase/copy-word-forms.ts";
import { layersWithMoreFilesThanTheRuleAllows } from "./codebase/crowded-layers.ts";
import {
  keysTheServerWouldShipWithout,
  keysTheTemplateAndTheCodeDisagreeOn,
} from "./codebase/env-keys.ts";
import { filesCheckedOutWithTheWrongLineEnding } from "./codebase/line-endings.ts";


const NOTHING = 0;

const FAILED = 1;

const thePosters = await drawnByName((offered) => offered.posters());

const theToolVerbs = new Set([
  ...toolVerbsIn(read(TOOLS_SCRIPT)),
  ...(await featuresThatDraw()).flatMap((offered) => Object.keys(offered.tools)),
]);

const complaints = [
  ...pointersThatResolveToNothing(),
  ...commandsNothingOffers(theToolVerbs, new Set(ALL_GATES)),
  ...frontmatterThatWillNotParse(),
  ...drawingsThatWouldNotRender(),

  ...thePlanAndItsContentsListDisagree(),
  ...documentsOverTheirLineBudget(),
  ...skillsOverTheirLineBudget(),
  ...pagesOverTheirLineBudget(),
  ...pagesNobodyOpens(),
  ...agentsWithoutAContract(),
  ...debtWithoutATrigger(),
  ...foldersMissingFromTheTree(),
  ...scriptsMissingFromTheTable(),
  ...schemaThePlanDoesNotQuote(),

  ...theRosterTheFlowDisagreesWith(),
  ...repliesLeavingTheLaneTheyWereAskedOf(),
  ...stagesASkillAndTheFlowDisagreeOn(),
  ...descriptionsThatNameNoStage(),
  ...phaseLogsThatDoNotWalkTheDrawing(),

  ...pagesTheirFactTreeContradicts(),
  ...wordsThePagesMayNotSay(),
  ...classesTheStylesheetHasNoRuleFor(),
  ...picturesThePagesGetWrong(),
  ...tracesTheRouteNoLongerDraws(),
  ...faqTheStructuredDataContradicts(),

  ...postersNoGalleryCaseDraws(),
  ...galleryCasesNobodyApproved(),
  ...committedPostersTheRendererDisagreesWith(thePosters),
  ...theDesignPageDrawnFromOlderPosters(thePosters),
  ...advancesMeasuredOnOtherFaces(),

  ...copyTablesChoosingAWordForm(),
  ...layersWithMoreFilesThanTheRuleAllows(),
  ...keysTheServerWouldShipWithout(),
  ...keysTheTemplateAndTheCodeDisagreeOn(),
  ...filesCheckedOutWithTheWrongLineEnding(),
];

writeComplaints(CHECK_DOCS_COMPLAINTS, complaints);

console.log(
  complaints.length === NOTHING
    ? `documents agree: ${String(DOCUMENTS.length)} files, links and anchors resolve`
    : `${String(complaints.length)} problem(s) in ${CHECK_DOCS_COMPLAINTS}`
);

process.exit(complaints.length === NOTHING ? NOTHING : FAILED);

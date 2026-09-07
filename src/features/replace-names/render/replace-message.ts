import { escapeHtml } from "#shared/text/html-escape.ts";
import { counted } from "#shared/locale/plural-rules.ts";
import type { Replacement } from "#replace-names/domain/replace-plan.ts";
import { eveningDate } from "#replace-names/render/evening-date.ts";
import type { Copy } from "#replace-names/copy.ts";


const BETWEEN_LINES = "\n";

const planLine = (copy: Copy, plan: Replacement): string =>
  copy.plan(escapeHtml(plan.leaving.displayName), escapeHtml(plan.arriving.displayName));

const tallyOf = (copy: Copy, plan: Replacement): string =>
  counted(copy.locale, plan.leaving.games, copy.gameForms);

const dateOf = (copy: Copy, plan: Replacement): string => eveningDate(copy, plan.evening.startedOn);

const newNameLine = (copy: Copy, plan: Replacement): readonly string[] =>
  plan.arriving.playerId === null ? [copy.newName(escapeHtml(plan.arriving.displayName))] : [];

export const renderProposal = (copy: Copy, plan: Replacement): string =>
  [
    copy.header,
    planLine(copy, plan),
    copy.willRewrite(tallyOf(copy, plan), dateOf(copy, plan)),
    ...newNameLine(copy, plan),
  ].join(BETWEEN_LINES);

export const renderReplaced = (copy: Copy, plan: Replacement): string =>
  [copy.header, planLine(copy, plan), copy.rewritten(tallyOf(copy, plan), dateOf(copy, plan))].join(
    BETWEEN_LINES
  );

export const renderCancelled = (copy: Copy): string =>
  [copy.header, copy.cancelledBody].join(BETWEEN_LINES);

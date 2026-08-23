import { reportOnTheNewestEvening } from "#scoresheet/bot/evening-report.ts";
import { contactSheet } from "#scoresheet/samples/contact-sheet.ts";
import { gallery } from "#scoresheet/samples/gallery-edges.ts";
import { posters } from "#scoresheet/samples/sample-table.ts";
import { sitePosters } from "#scoresheet/samples/site-set.ts";
import type { Drawing, FeatureDrawings } from "#shared/drawings/drawings-contract.ts";


const CONTACT_SHEET = "contact-sheet";

const CHAT_TO_READ = 1;

const A_WHOLE_NUMBER = /^-?\d+$/;

const asDrawings = (named: Readonly<Record<string, string>>, asks: string): readonly Drawing[] =>
  Object.entries(named).map(([file, svg]) => ({ file, asks, svg }));

const everyEdge = (): readonly Drawing[] => {
  const edges = gallery();

  return [
    ...edges,
    {
      file: CONTACT_SHEET,
      asks: "every edge above, in one field of view",
      svg: contactSheet("FoolProof — every edge the gallery draws", edges),
    },
  ];
};

const theNewestEvening = (args: readonly string[]): readonly string[] => {
  const asked = args[CHAT_TO_READ];

  if (asked === undefined || !A_WHOLE_NUMBER.test(asked)) {
    throw new Error("evening needs the chat id whose newest evening should be read");
  }

  return reportOnTheNewestEvening(Number(asked));
};

export const drawings: FeatureDrawings = {
  mockups: () => asDrawings(posters(), "the sample evening, drawn by the renderer itself"),
  sitePosters: () => asDrawings(sitePosters(), "the same evening, drawn for the website"),
  gallery: everyEdge,
  tools: {
    evening: {
      does: "print the awards a real chat's newest evening would carry, in that chat's own language",
      usage: "node scripts/tools.ts evening <chat id>",
      say: theNewestEvening,
    },
  },
};

import { FIRST_GROUP, anchorOf } from "../shared/markdown-text.ts";
import { SPEC_DOCUMENT, read } from "../shared/document-files.ts";


const NOTHING = 0;

const LAST = -1;

const A_SPEC_SECTION = /^## (.+)$/gm;

const A_CONTENTS_LINK = /\[[^\]]+\]\(#([a-z0-9-]+)\)/g;

const SPEC_CONTENTS = "What is in here";

export const contentsListComplaints = (text: string): readonly string[] => {
  const sections = [...text.matchAll(A_SPEC_SECTION)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .filter((section) => section !== SPEC_CONTENTS);
  const contents = text.split(`## ${SPEC_CONTENTS}`).at(LAST)?.split("\n## ").at(NOTHING) ?? "";
  const listed = new Set(
    [...contents.matchAll(A_CONTENTS_LINK)].map((link) => link[FIRST_GROUP] ?? "")
  );
  const anchors = new Set(sections.map(anchorOf));

  return [
    ...sections
      .filter((section) => !listed.has(anchorOf(section)))
      .map(
        (section) =>
          `${SPEC_DOCUMENT}: "${section}" is not in "${SPEC_CONTENTS}" — this file is ` +
          `read by following a link, so a section the list does not carry is one nobody ` +
          `arrives at`
      ),
    ...[...listed]
      .filter((anchor) => !anchors.has(anchor))
      .map(
        (anchor) =>
          `${SPEC_DOCUMENT}: "${SPEC_CONTENTS}" points at #${anchor}, which is not a ` +
          `section here any more — a contents list nobody can follow is worse than none`
      ),
  ];
};

export const thePlanAndItsContentsListDisagree = (): readonly string[] =>
  contentsListComplaints(read(SPEC_DOCUMENT));

import { existsSync } from "node:fs";
import { installedSkills, read, skillFile, skillPages } from "../shared/document-files.ts";


const A_DOT = /\./g;

const A_LINK_OR_A_CODE_SPAN = (page: string): RegExp =>
  new RegExp(`[(\`]${page.replace(A_DOT, "\\.")}[)\`]`);

export const pageComplaints = (
  skill: string,
  pages: readonly string[],
  skillText: string
): readonly string[] =>
  pages
    .filter((page) => !A_LINK_OR_A_CODE_SPAN(page).test(skillText))
    .map(
      (page) =>
        `${skillFile(skill)}: never opens "${page}" lying beside it — a page nothing ` +
        `sends a reader to is a page nobody reads, which is how splitting a skill ` +
        `loses the rule instead of moving it`
    );

export const pagesNobodyOpens = (): readonly string[] =>
  installedSkills()
    .filter((skill) => existsSync(skillFile(skill)))
    .flatMap((skill) => pageComplaints(skill, skillPages(skill), read(skillFile(skill))));

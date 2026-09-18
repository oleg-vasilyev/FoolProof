import { beforeEach, describe, expect, it, vi } from "vitest";


const readSpy = vi.fn();

const installedSkillsSpy = vi.fn();

const skillPagesSpy = vi.fn();

const existsSyncSpy = vi.fn();

vi.mock("../shared/document-files.ts", () => ({
  read: (file: string) => readSpy(file),
  installedSkills: () => installedSkillsSpy(),
  skillPages: (skill: string) => skillPagesSpy(skill),
  skillFile: (skill: string) => `FILE-OF-${skill}`,
}));

vi.mock("node:fs", () => ({
  existsSync: (path: string) => existsSyncSpy(path),
}));

const { pageComplaints, pagesNobodyOpens } = await import("./skill-pages.ts");

const NOTHING = 0;

const ONE_COMPLAINT = 1;

const FIRST = 0;

const A_SKILL = "a-skill";

const A_PAGE = "a-page.md";

describe("pageComplaints", () => {
  it("should say nothing about a page its skill sends a reader to", () => {
    const said = pageComplaints(A_SKILL, [A_PAGE], `open [it](${A_PAGE}) when it is red`);

    expect(said).toEqual([]);
  });

  it("should name the skill file that fails to open the page beside it", () => {
    const said = pageComplaints(A_SKILL, [A_PAGE], "a skill that mentions nothing");

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain(`FILE-OF-${A_SKILL}`);
    expect(said[FIRST]).toContain(A_PAGE);
    expect(said[FIRST]).toContain("splitting a skill loses the rule instead of moving it");
  });

  it("should judge every page, not only the first", () => {
    const said = pageComplaints(A_SKILL, ["opened.md", "orphaned.md"], "see [it](opened.md)");

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("orphaned.md");
  });

  it("should not count a page merely named in a sentence as opened", () => {
    const said = pageComplaints(A_SKILL, [A_PAGE], `the old ${A_PAGE} said otherwise`);

    expect(said).toHaveLength(ONE_COMPLAINT);
  });

  it("should count a page named in a code span as opened", () => {
    const said = pageComplaints(A_SKILL, [A_PAGE], `see \`${A_PAGE}\` beside this file`);

    expect(said).toEqual([]);
  });

  it("should say nothing when a skill has no pages beside it", () => {
    expect(pageComplaints(A_SKILL, [], "no pages here")).toHaveLength(NOTHING);
  });
});

describe("pagesNobodyOpens", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installedSkillsSpy.mockReturnValue([A_SKILL]);
    skillPagesSpy.mockReturnValue([A_PAGE]);
    existsSyncSpy.mockReturnValue(true);
  });

  it("should complain about a page the skill never names", () => {
    readSpy.mockReturnValue("a skill that mentions nothing");

    const said = pagesNobodyOpens();

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain(A_PAGE);
  });

  it("should say nothing once the skill opens it", () => {
    readSpy.mockReturnValue(`open [the page](${A_PAGE})`);

    expect(pagesNobodyOpens()).toEqual([]);
  });

  it("should ask each installed skill for its own pages", () => {
    readSpy.mockReturnValue(A_PAGE);

    pagesNobodyOpens();

    expect(skillPagesSpy).toHaveBeenCalledWith(A_SKILL);
  });

  it("should leave a skill folder with no SKILL.md to the budget check", () => {
    existsSyncSpy.mockReturnValue(false);

    expect(pagesNobodyOpens()).toEqual([]);
    expect(readSpy).not.toHaveBeenCalled();
  });
});

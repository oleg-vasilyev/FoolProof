import { beforeEach, describe, expect, it, vi } from "vitest";


const readSpy = vi.fn();

const installedSkillsSpy = vi.fn();

const definedAgentsSpy = vi.fn();

const skillPagesSpy = vi.fn();

const existsSyncSpy = vi.fn();

const readdirSyncSpy = vi.fn();

const insideAStrippedFolderSpy = vi.fn((_path: string) => false);

vi.mock("../shared/document-files.ts", () => ({
  DOCUMENTS: ["A-DOCUMENT.md"],
  FLOW_DOCUMENT: "THE-FLOW.md",
  SKILLS_FOLDER: "THE-SKILLS-FOLDER",
  AGENTS_FOLDER: "THE-AGENTS-FOLDER",
  read: (file: string) => readSpy(file),
  installedSkills: () => installedSkillsSpy(),
  definedAgents: () => definedAgentsSpy(),
  skillPages: (skill: string) => skillPagesSpy(skill),
  skillFile: (skill: string) => `FILE-OF-${skill}`,
  insideAStrippedFolder: (path: string) => insideAStrippedFolderSpy(path),
}));

vi.mock("node:fs", () => ({
  existsSync: (path: string) => existsSyncSpy(path),
  readdirSync: (path: string) => readdirSyncSpy(path),
}));

const {
  citationComplaints,
  citedPathsIn,
  linkComplaints,
  pointersThatResolveToNothing,
  prefixesUnderTheSource,
  whereACitationPoints,
} = await import("./broken-pointers.ts");

const NOTHING = 0;

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const ONE_PATH = 1;

const FIRST = 0;

const FILE = "README.md";

const A_SKILL = "a-skill";

const A_PAGE = "a-page.md";

const ALWAYS = (): boolean => true;

const NEVER = (): boolean => false;

const EVERYTHING_IS_THERE = () => true;

const NOTHING_IS_THERE = () => false;

const UNDER_THE_SOURCE = { features: "src", shared: "src", scoresheet: "src/features" };

describe("linkComplaints", () => {
  it("should say nothing about a link that resolves and carries no anchor", () => {
    const complaints = linkComplaints(FILE, "[see](PLAN.md)", {}, ALWAYS);

    expect(complaints).toEqual([]);
  });

  it("should skip a link starting with http, because it names nothing on disk", () => {
    const complaints = linkComplaints(FILE, "[see](https://example.com)", {}, NEVER);

    expect(complaints).toEqual([]);
  });

  it("should skip a link that only names an anchor in the same document", () => {
    const complaints = linkComplaints(FILE, "[see](#a-heading)", {}, NEVER);

    expect(complaints).toEqual([]);
  });

  it("should name a target that does not exist on disk", () => {
    const complaints = linkComplaints(FILE, "[see](GHOST.md)", {}, NEVER);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("GHOST.md");
    expect(complaints[FIRST]).toContain("does not exist");
  });

  it("should name a heading that the target document does not carry", () => {
    const complaints = linkComplaints(
      FILE,
      "[see](PLAN.md#missing)",
      { "PLAN.md": new Set(["real-heading"]) },
      ALWAYS
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("PLAN.md#missing");
    expect(complaints[FIRST]).toContain("that heading is not in PLAN.md");
  });

  it("should say nothing about a heading the target document actually carries", () => {
    const complaints = linkComplaints(
      FILE,
      "[see](PLAN.md#real-heading)",
      { "PLAN.md": new Set(["real-heading"]) },
      ALWAYS
    );

    expect(complaints).toEqual([]);
  });

  it("should say nothing about an anchor into a target whose headings were never gathered", () => {
    const complaints = linkComplaints(FILE, "[see](OTHER.md#anything)", {}, ALWAYS);

    expect(complaints).toEqual([]);
  });

  it("should resolve a target relative to the document that links it", () => {
    const complaints = linkComplaints(
      "deploy/README.md",
      "[see](../PLAN.md#missing)",
      { "PLAN.md": new Set(["real-heading"]) },
      ALWAYS
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("that heading is not in PLAN.md");
  });

  it("should not read a link that a sentence merely mentions the shape of", () => {
    const complaints = linkComplaints(FILE, "prose about [text] and (parens) separately", {}, NEVER);

    expect(complaints).toEqual([]);
  });

  it("should find several complaints across several links", () => {
    const complaints = linkComplaints(FILE, "[a](GHOST.md) and [b](ANOTHER.md)", {}, NEVER);

    expect(complaints).toHaveLength(TWO_COMPLAINTS);
  });
});

describe("citedPathsIn", () => {
  it("should find a path that names a folder this repository has", () => {
    expect(citedPathsIn("see `src/main.ts` for the wiring", UNDER_THE_SOURCE)).toEqual(["src/main.ts"]);
  });

  it("should name a path only once however often it is cited", () => {
    const found = citedPathsIn("scripts/tools/tools.ts and again scripts/tools/tools.ts", UNDER_THE_SOURCE);

    expect(found).toHaveLength(ONE_PATH);
  });

  it("should keep the whole extension rather than the first one that matches", () => {
    expect(citedPathsIn("`.claude/settings.json` holds the hooks", UNDER_THE_SOURCE)).toEqual([
      ".claude/settings.json",
    ]);
  });

  it("should ignore a path that lives outside this repository", () => {
    expect(citedPathsIn("the global `~/.claude/CLAUDE.md` if present", UNDER_THE_SOURCE)).toEqual([]);
  });

  it("should ignore a placeholder standing in for a name nobody has chosen", () => {
    expect(citedPathsIn("committed as docs/mockups/[gallery script].cases.txt", UNDER_THE_SOURCE)).toEqual([]);
  });

  it("should ignore a shape written with a hole in it", () => {
    expect(citedPathsIn("a change under src/features/<X>/ plays its own", UNDER_THE_SOURCE)).toEqual([]);
  });

  it("should ignore a glob, which names no single file", () => {
    expect(citedPathsIn("a `scripts/gallery*.ts` the entry point never gathers", UNDER_THE_SOURCE)).toEqual([]);
  });

  it("should ignore a folder this repository does not keep under version control", () => {
    expect(citedPathsIn("written to reports/mutation/mutation.json by every run", UNDER_THE_SOURCE)).toEqual([]);
  });

  it("should find every distinct path in a paragraph, not only the first", () => {
    const found = citedPathsIn("`e2e/README.md` and `deploy/README.md` disagree", UNDER_THE_SOURCE);

    expect(found).toEqual(["e2e/README.md", "deploy/README.md"]);
  });
});

describe("whereACitationPoints", () => {
  it("should look for a feature under the source folder, where prose omits it", () => {
    const resolved = whereACitationPoints("features/live-game/domain/lineup-parsing.ts", UNDER_THE_SOURCE);

    expect(resolved.startsWith("src")).toBe(true);
    expect(resolved.endsWith("features/live-game/domain/lineup-parsing.ts")).toBe(true);
  });

  it("should do the same for the shared folder", () => {
    expect(whereACitationPoints("shared/config/env.ts", UNDER_THE_SOURCE).startsWith("src")).toBe(true);
  });

  it("should leave a path that already names its folder alone", () => {
    expect(whereACitationPoints("scripts/check-docs.ts", UNDER_THE_SOURCE)).toBe("scripts/check-docs.ts");
  });

  it("should leave a path under the source folder alone", () => {
    expect(whereACitationPoints("src/main.ts", UNDER_THE_SOURCE)).toBe("src/main.ts");
  });
});

describe("citationComplaints", () => {
  it("should say nothing while every path a document names is there", () => {
    const said = citationComplaints("A-DOCUMENT.md", "see src/main.ts", UNDER_THE_SOURCE, EVERYTHING_IS_THERE);

    expect(said).toEqual([]);
  });

  it("should name the document, the path and why nothing else would catch it", () => {
    const said = citationComplaints("A-DOCUMENT.md", "see src/gone.ts", UNDER_THE_SOURCE, NOTHING_IS_THERE);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("A-DOCUMENT.md");
    expect(said[FIRST]).toContain("src/gone.ts");
    expect(said[FIRST]).toContain("a rule whose subject has moved");
    expect(said[FIRST]).toContain("no compiler reads prose");
    expect(said[FIRST]).toContain("nothing else fails when one rots");
  });

  it("should ask after the resolved path rather than the one the prose wrote", () => {
    const asked: string[] = [];

    citationComplaints("A-DOCUMENT.md", "see shared/config/env.ts", UNDER_THE_SOURCE, (path) => {
      asked.push(path);

      return true;
    });

    expect(asked[FIRST]?.startsWith("src")).toBe(true);
  });
});

describe("prefixesUnderTheSource", () => {
  it("should put a bare feature name under the features folder", () => {
    const prefixes = prefixesUnderTheSource(["scoresheet"]);

    expect(whereACitationPoints("scoresheet/render/palette.ts", prefixes)).toBe(
      "src/features/scoresheet/render/palette.ts"
    );
  });

  it("should keep features and shared directly under the source folder", () => {
    const prefixes = prefixesUnderTheSource([]);

    expect(whereACitationPoints("shared/config/env.ts", prefixes)).toBe("src/shared/config/env.ts");
    expect(whereACitationPoints("features/live-game/x.ts", prefixes)).toBe(
      "src/features/live-game/x.ts"
    );
  });

  it("should let a feature name be cited at all, which a fixed list could not", () => {
    const prefixes = prefixesUnderTheSource(["scoresheet"]);

    expect(citedPathsIn("`scoresheet/render/palette.ts` draws it", prefixes)).toEqual([
      "scoresheet/render/palette.ts",
    ]);
  });

  it("should know every folder this repository tracks at its root", () => {
    const roots = [
      ".claude/settings.json",
      ".github/workflows/check.yml",
      ".githooks/commit-msg.js",
      "src/main.ts",
      "scripts/check-docs.ts",
      "e2e/README.md",
      "deploy/README.md",
      "docs/mockups/one.png",
      "assets/logo.svg",
    ];

    expect(citedPathsIn(roots.join(" and "), UNDER_THE_SOURCE)).toEqual(roots);
  });

  it("should not see a feature name when this repository has no features", () => {
    expect(citedPathsIn("`scoresheet/render/palette.ts`", prefixesUnderTheSource([]))).toEqual([]);
  });

  it("should see a systemd unit, which the deploy folder is full of", () => {
    expect(citedPathsIn("`deploy/foolproof.service` restarts it", UNDER_THE_SOURCE)).toEqual([
      "deploy/foolproof.service",
    ]);
  });
});

describe("pointersThatResolveToNothing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    readSpy.mockReturnValue("no paths in here");
    installedSkillsSpy.mockReturnValue([A_SKILL]);
    definedAgentsSpy.mockReturnValue(["an-agent"]);
    skillPagesSpy.mockReturnValue([A_PAGE]);
    existsSyncSpy.mockReturnValue(true);
    readdirSyncSpy.mockReturnValue([]);
  });

  it("should read the documents, the drawing, the skills, their pages and the agents", () => {
    pointersThatResolveToNothing();

    expect(readSpy).toHaveBeenCalledWith("A-DOCUMENT.md");
    expect(readSpy).toHaveBeenCalledWith("THE-FLOW.md");
    expect(readSpy).toHaveBeenCalledWith(`FILE-OF-${A_SKILL}`);
    expect(readSpy).toHaveBeenCalledWith(expect.stringContaining(A_PAGE));
    expect(readSpy).toHaveBeenCalledWith(expect.stringContaining("an-agent"));
  });

  it("should complain about a path none of them can point at", () => {
    readSpy.mockReturnValue("see src/gone.ts");
    existsSyncSpy.mockReturnValue(false);

    const said = pointersThatResolveToNothing();

    expect(said.length).toBeGreaterThan(NOTHING);
    expect(said.some((line) => line.includes("src/gone.ts"))).toBe(true);
    expect(said.some((line) => line.includes("a rule whose subject has moved"))).toBe(true);
  });

  it("should complain about a link a document cannot follow, in the same pass", () => {
    readSpy.mockReturnValue("[see](GHOST.md)");
    existsSyncSpy.mockReturnValue(false);

    const said = pointersThatResolveToNothing();

    expect(said.some((line) => line.includes("links to GHOST.md"))).toBe(true);
  });

  it("should not complain about a path inside a folder a benchmark clone strips, when it is stripped", () => {
    readSpy.mockReturnValue("see scripts/benchmark/run-benchmark.ts and src/gone.ts");
    existsSyncSpy.mockReturnValue(false);
    insideAStrippedFolderSpy.mockImplementation((path: string) => path.startsWith("scripts/benchmark/"));

    const said = pointersThatResolveToNothing();

    expect(said.some((line) => line.includes("src/gone.ts"))).toBe(true);
    expect(said.some((line) => line.includes("scripts/benchmark/run-benchmark.ts"))).toBe(false);
    expect(insideAStrippedFolderSpy).toHaveBeenCalledWith("scripts/benchmark/run-benchmark.ts");
  });

  it("should leave a skill folder with no SKILL.md to the budget check", () => {
    existsSyncSpy.mockImplementation((path: string) => path !== `FILE-OF-${A_SKILL}`);

    pointersThatResolveToNothing();

    expect(readSpy).not.toHaveBeenCalledWith(`FILE-OF-${A_SKILL}`);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


const execFileSyncSpy = vi.fn();

const readSpy = vi.fn();

const entriesInSpy = vi.fn();

const lastParagraphOfSpy = vi.fn();

const A_DEBT_DOCUMENT = "A-DEBT-DOCUMENT.md";

vi.mock("node:child_process", () => ({
  execFileSync: (...args: readonly unknown[]) => execFileSyncSpy(...args),
}));

vi.mock("../gates/check-docs/shared/document-files.ts", () => ({
  DEBT_DOCUMENT: A_DEBT_DOCUMENT,
  read: (path: string) => readSpy(path),
}));

vi.mock("../gates/check-docs/handbook/debt-entry-triggers.ts", () => ({
  entriesIn: (document: string) => entriesInSpy(document),
  lastParagraphOf: (body: string) => lastParagraphOfSpy(body),
}));

const { changedFiles, debtForTheDiff, entriesTouchedBy, linesFor, pathsNamedIn, triggerFor } =
  await import("./debt-for-a-diff.ts");


const THE_DOCUMENT = "the document's own text";

const A_TRIGGER = "**Do it when it hurts.**";

const THE_SENTENCE_ITSELF = "Do it when it hurts.";

const A_WRAPPED_TRIGGER =
  "**Delete each wrapper the next time its file is\n  touched for another reason** — inline `counted()` at its callers.";

const THE_WRAPPED_SENTENCE = "Delete each wrapper the next time its file is touched for another reason";

const LAST_LINE = -1;

const NOTHING_ASKED: readonly string[] = [];

const A_SPLITTING_ENTRY = {
  title: "Files that may be worth splitting",
  body: "the biggest are `a/big.ts` and `b/other.ts`",
};

const A_PROSE_ENTRY = {
  title: "A backup that stops happening",
  body: "`deploy/backup.sh` writes a snapshot a month",
};

const A_DELIBERATE_ENTRY = {
  title: "Not debt, deliberately",
  body: "`shared/logging/logger.ts` reads the environment at module scope, and that is right",
};

describe("pathsNamedIn()", () => {
  it("should take every backticked path an entry names", () => {
    expect(pathsNamedIn("read `a/b.ts` then `c/d.sh`")).toEqual(["a/b.ts", "c/d.sh"]);
  });

  it("should name a path once however often the entry repeats it", () => {
    expect(pathsNamedIn("`a/b.ts` and `a/b.ts` again")).toEqual(["a/b.ts"]);
  });

  it("should leave a backticked word that is not a file alone", () => {
    expect(pathsNamedIn("`MOST_ROWS` and `npm run check:phase`")).toEqual([]);
  });

  it("should leave the documents out, since every documents phase touches one of them", () => {
    expect(pathsNamedIn("`PLAN.md` explains it, `src/a.ts` does it")).toEqual(["src/a.ts"]);
  });

  it("should take a path however deep the folders go", () => {
    expect(pathsNamedIn("read `a/b/c/d.ts` please")).toEqual(["a/b/c/d.ts"]);
  });

  it("should leave a bare file name alone, since seven features have a copy.en.ts", () => {
    expect(pathsNamedIn("`copy.en.ts` may not decide, `a/copy.en.ts` is the one that does")).toEqual(
      ["a/copy.en.ts"]
    );
  });
});

describe("triggerFor()", () => {
  const A_TABLE = [
    "| File | Why it is on the list | Split it when |",
    "|---|---|---|",
    "| `a/big.ts` | It does four jobs | A fifth job arrives |",
    "| `b/other.ts` | Every query | The queries stop overlapping |",
  ].join("\n");

  it("should give the bold sentence a prose entry closes with", () => {
    expect(triggerFor(`${A_TRIGGER} And then some prose.`, "a/b.ts")).toBe(THE_SENTENCE_ITSELF);
  });

  it("should give the bold sentence even when the prose names the file after it", () => {
    expect(triggerFor(`${A_TRIGGER} the file \`a/b.ts\` is the one`, "a/b.ts")).toBe(
      THE_SENTENCE_ITSELF
    );
  });

  it("should read a trigger wrapped over two lines as one sentence", () => {
    expect(triggerFor(A_WRAPPED_TRIGGER, "a/b.ts")).toBe(THE_WRAPPED_SENTENCE);
  });

  it("should give the whole closing paragraph when it states no bold sentence", () => {
    expect(triggerFor("\npick it up\nwhen it hurts\n", "a/b.ts")).toBe("pick it up when it hurts");
  });

  it("should give the touched file's own row of a table, not another file's", () => {
    expect(triggerFor(A_TABLE, "b/other.ts")).toBe("The queries stop overlapping");
  });

  it("should fall back to the table's first row when it has none for that file", () => {
    expect(triggerFor(A_TABLE, "c/absent.ts")).toBe(
      "| File | Why it is on the list | Split it when | |---|---|---| | `a/big.ts` | It does four jobs | A fifth job arrives | | `b/other.ts` | Every query | The queries stop overlapping |"
    );
  });
});

describe("entriesTouchedBy()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    entriesInSpy.mockReturnValue([A_SPLITTING_ENTRY, A_PROSE_ENTRY, A_DELIBERATE_ENTRY]);
    lastParagraphOfSpy.mockReturnValue(A_TRIGGER);
  });

  it("should read the entries out of the document it was handed", () => {
    entriesTouchedBy(THE_DOCUMENT, []);

    expect(entriesInSpy).toHaveBeenCalledWith(THE_DOCUMENT);
  });

  it("should report the entry whose named file the diff changed", () => {
    const touched = entriesTouchedBy(THE_DOCUMENT, ["src/deploy/backup.sh"]);

    expect(touched.map((entry) => entry.title)).toEqual([A_PROSE_ENTRY.title]);
  });

  it("should leave out what the document says is not debt, however many files it names", () => {
    expect(entriesTouchedBy(THE_DOCUMENT, ["src/shared/logging/logger.ts"])).toEqual([]);
  });

  it("should match a path the entry writes without the folder above it", () => {
    expect(entriesTouchedBy(THE_DOCUMENT, ["src/features/a/big.ts"])[0]?.triggers).toEqual([
      { file: "a/big.ts", says: THE_SENTENCE_ITSELF },
    ]);
  });

  it("should give each touched file of one entry its own trigger", () => {
    lastParagraphOfSpy.mockReturnValue(
      ["| `a/big.ts` | four jobs | A fifth job arrives |", "| `b/other.ts` | queries | They stop overlapping |"].join(
        "\n"
      )
    );

    const touched = entriesTouchedBy(THE_DOCUMENT, ["a/big.ts", "b/other.ts"]);

    expect(touched[0]?.triggers).toEqual([
      { file: "a/big.ts", says: "A fifth job arrives" },
      { file: "b/other.ts", says: "They stop overlapping" },
    ]);
  });

  it("should not match a file whose name merely ends the same way", () => {
    expect(entriesTouchedBy(THE_DOCUMENT, ["src/other-big.ts"])).toEqual([]);
  });

  it("should take the trigger out of the entry's closing paragraph", () => {
    entriesTouchedBy(THE_DOCUMENT, ["b/other.ts"]);

    expect(lastParagraphOfSpy).toHaveBeenCalledWith(A_SPLITTING_ENTRY.body);
  });

  it("should find nothing when the diff touches no file any entry names", () => {
    expect(entriesTouchedBy(THE_DOCUMENT, ["src/main.ts"])).toEqual([]);
  });
});

describe("changedFiles()", () => {
  const AGAINST_MAIN = "origin/main";

  const ANOTHER_BASELINE = "HEAD~3";

  beforeEach(() => {
    vi.clearAllMocks();

    execFileSyncSpy.mockReturnValue("");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should ask git what the diff changed and what is not yet added", () => {
    changedFiles();

    expect(execFileSyncSpy.mock.calls.map((call) => call[0])).toEqual(["git", "git"]);
    expect(execFileSyncSpy.mock.calls.map((call) => call[1])).toEqual([
      ["diff", "--name-only", AGAINST_MAIN],
      ["ls-files", "--others", "--exclude-standard"],
    ]);
  });

  it("should measure against the baseline the environment names, the way the other gates do", () => {
    vi.stubEnv("DEBT_AGAINST", ANOTHER_BASELINE);

    changedFiles();

    expect(execFileSyncSpy.mock.calls[0]?.[1]).toEqual([
      "diff",
      "--name-only",
      ANOTHER_BASELINE,
    ]);
  });

  it("should read git's answer as text rather than bytes", () => {
    changedFiles();

    expect(execFileSyncSpy.mock.calls[0]?.[2]).toEqual({ encoding: "utf8" });
  });

  it("should take one path per line, trimmed, and drop the blank one at the end", () => {
    execFileSyncSpy.mockReturnValue("  src/a.ts  \nsrc/b.ts\n");

    expect(changedFiles()).toEqual(["src/a.ts", "src/b.ts", "src/a.ts", "src/b.ts"]);
  });
});

describe("linesFor()", () => {
  it("should say so plainly when nothing was touched, rather than printing an empty list", () => {
    expect(linesFor([])).toEqual(["no entry names a file this asks about"]);
  });

  it("should print the entry and a line per file, each with that file's trigger", () => {
    expect(
      linesFor([
        {
          title: "An entry",
          triggers: [
            { file: "a/b.ts", says: "when it hurts" },
            { file: "c/d.ts", says: "when it hurts more" },
          ],
        },
      ])
    ).toEqual(["An entry", "    a/b.ts — when it hurts", "    c/d.ts — when it hurts more"]);
  });
});

describe("debtForTheDiff()", () => {
  const said: string[] = [];

  const say = (line: string): void => {
    said.push(line);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    said.length = 0;

    execFileSyncSpy.mockReturnValue("b/other.ts\n");
    readSpy.mockReturnValue(THE_DOCUMENT);
    entriesInSpy.mockReturnValue([A_SPLITTING_ENTRY]);
    lastParagraphOfSpy.mockReturnValue(A_TRIGGER);
  });

  it("should read the debt document itself, not a copy of it", () => {
    debtForTheDiff(NOTHING_ASKED, say);

    expect(readSpy).toHaveBeenCalledWith(A_DEBT_DOCUMENT);
  });

  it("should say each touched entry and close with the counts", () => {
    debtForTheDiff(NOTHING_ASKED, say);

    expect(said).toEqual([
      A_SPLITTING_ENTRY.title,
      `    b/other.ts — ${THE_SENTENCE_ITSELF}`,
      `${A_DEBT_DOCUMENT} — 1 entry over 2 files`,
    ]);
  });

  it("should judge the files it was given instead of the diff, which stage 1 does not have yet", () => {
    debtForTheDiff(["a/big.ts"], say);

    expect(execFileSyncSpy).not.toHaveBeenCalled();
    expect(said.at(LAST_LINE)).toBe(`${A_DEBT_DOCUMENT} — 1 entry over 1 files`);
  });

  it("should count more than one entry in the plural", () => {
    entriesInSpy.mockReturnValue([A_SPLITTING_ENTRY, { ...A_PROSE_ENTRY, body: "`c/other.ts`" }]);

    debtForTheDiff(["b/other.ts", "c/other.ts"], say);

    expect(said.at(LAST_LINE)).toBe(`${A_DEBT_DOCUMENT} — 2 entries over 2 files`);
  });

  it("should still close with a line when nothing was touched", () => {
    debtForTheDiff(["src/main.ts"], say);

    expect(said).toEqual([
      "no entry names a file this asks about",
      `${A_DEBT_DOCUMENT} — 0 entries over 1 files`,
    ]);
  });
});

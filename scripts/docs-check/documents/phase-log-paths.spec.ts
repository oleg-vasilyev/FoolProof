import { describe, expect, it } from "vitest";
import {
  citationsIn,
  logsOffTheMap,
  markersIn,
  markersMatching,
  pathComplaints,
  stageTitlesIn,
  stillBeingWritten,
  theLogsAmong,
} from "./phase-log-paths.ts";


const NOTHING = 0;

const ONE_COMPLAINT = 1;

const ONE_MARKER = 1;

const TWO_COMPLAINTS = 2;

const THREE_COMPLAINTS = 3;

const FIRST = 0;

const STILL_BEING_WRITTEN = true;

const ALREADY_TESTIMONY = false;

const A_LOG = "logbook/phases/2026-08-26-a-phase.md";

const BETWEEN_STAGES = /\s*→\s*/;

const BETWEEN_ENTRIES = /\s+·\s+/;

const A_DRAWING = [
  "sequenceDiagram",
  "    actor U as Product owner",
  "    note over U,K: Stage 1. Framing the task",
  "    U->>C: what should be different",
  "    C->>C: check the tech debt",
  "    C->>K: the fix-a-bug skill",
  "    note over C,K: Stage 2. Quality gates",
  "    note over C: the thresholds, in one line",
  "    C->>C: npm run check:phase",
  "    C->>K: the fix-a-bug skill",
  "    note over C,R: Stage 3. Review by an agent",
  "    C->>R: the phase-reviewer agent",
  "    R-->>C: findings, most severe first",
  "    note over C,G: Stage 4. Release to production",
  "    C->>G: commit and push to main",
].join("\n");

const THE_MARKERS = markersIn(A_DRAWING);

const walking = (path: string, skipped: string, offMap = "none"): string =>
  [
    "# A phase",
    "",
    "```",
    `Path:       ${path}`,
    `Skipped:    ${skipped}`,
    `Off-map:    ${offMap}`,
    "```",
    "",
  ].join("\n");

describe("markersIn", () => {
  it("should mark every stage, and file each step under the stage it was drawn in", () => {
    expect(markersIn(A_DRAWING).filter((marker) => marker.kind === "step")).toEqual([
      { kind: "step", text: "what should be different", stage: "Framing the task" },
      { kind: "step", text: "check the tech debt", stage: "Framing the task" },
      { kind: "step", text: "the fix-a-bug skill", stage: "Framing the task" },
      { kind: "step", text: "npm run check:phase", stage: "Quality gates" },
      { kind: "step", text: "the fix-a-bug skill", stage: "Quality gates" },
      { kind: "step", text: "the phase-reviewer agent", stage: "Review by an agent" },
      { kind: "step", text: "findings, most severe first", stage: "Review by an agent" },
      { kind: "step", text: "commit and push to main", stage: "Release to production" },
    ]);
  });

  it("should read a reply arrow as a step, dashes and all", () => {
    const marked = markersIn("    note over C,R: Stage 1. Review\n    R-->>C: findings");

    expect(marked.map((marker) => marker.text)).toEqual(["Review", "findings"]);
  });

  it("should not read a note as a step, since nothing walks through one", () => {
    expect(
      markersIn("    note over C,K: Stage 1. Gates\n    note over C: the thresholds")
    ).toHaveLength(ONE_MARKER);
  });

  it("should ignore a step drawn before any stage has opened", () => {
    expect(markersIn("sequenceDiagram\n    U->>C: a stray arrow")).toEqual([]);
  });

  it("should read a stage past the ninth, which two digits make", () => {
    expect(markersIn("    note over C: Stage 12. A late stage")).toEqual([
      { kind: "stage", text: "A late stage", stage: "A late stage" },
    ]);
  });

  it("should read a stage whose title was written tight against the dot", () => {
    expect(markersIn("    note over C: Stage 1.Tight")).toEqual([
      { kind: "stage", text: "Tight", stage: "Tight" },
    ]);
  });

  it("should not take a stage mark quoted inside a longer line", () => {
    expect(markersIn("    C->>C: the line note over C: Stage 1. Not a stage")).toEqual([]);
  });

  it("should not take an arrow that begins somewhere other than the start of its line", () => {
    const drawn = markersIn("    note over C: Stage 1. Gates\n    said that C->>C: not a step");

    expect(drawn.filter((marker) => marker.kind === "step")).toEqual([]);
  });

  it("should not take a participant that does not start with a letter", () => {
    const drawn = markersIn("    note over C: Stage 1. Gates\n    1->>C: not a step");

    expect(drawn.filter((marker) => marker.kind === "step")).toEqual([]);
  });

  it("should not take a participant whose name is not a word", () => {
    const drawn = markersIn("    note over C: Stage 1. Gates\n    C->>a-b: not a step");

    expect(drawn.filter((marker) => marker.kind === "step")).toEqual([]);
  });

  it("should read a step written tight against its colon", () => {
    const drawn = markersIn("    note over C: Stage 1. Gates\n    C->>C:tight");

    expect(drawn.filter((marker) => marker.kind === "step")).toEqual([
      { kind: "step", text: "tight", stage: "Gates" },
    ]);
  });
});

describe("theLogsAmong", () => {
  it("should take the markdown files and leave everything else", () => {
    expect(theLogsAmong(["a-phase.md", "notes.txt", "picture.md.png"])).toEqual(["a-phase.md"]);
  });
});

describe("stillBeingWritten", () => {
  it("should take the paths git named, trimmed", () => {
    expect([...stillBeingWritten(["  logbook/phases/one.md  ", "logbook/phases/two.md"])]).toEqual([
      "logbook/phases/one.md",
      "logbook/phases/two.md",
    ]);
  });

  it("should drop the blank line git ends its output with", () => {
    expect(stillBeingWritten(["logbook/phases/one.md", "", "   "]).size).toBe(ONE_MARKER);
  });

  it("should say nothing is pending when git said nothing", () => {
    expect(stillBeingWritten([]).size).toBe(NOTHING);
  });
});

describe("logsOffTheMap", () => {
  it("should judge a log git calls pending and leave the one it does not", () => {
    const log = walking("framing", "none");
    const said = logsOffTheMap(
      [
        { file: "logbook/phases/pending.md", log },
        { file: "logbook/phases/written.md", log },
      ],
      THE_MARKERS,
      new Set(["logbook/phases/pending.md"])
    );

    expect(said).toHaveLength(THREE_COMPLAINTS);
    expect(said.every((complaint) => complaint.startsWith("logbook/phases/pending.md"))).toBe(true);
  });
});

describe("stageTitlesIn", () => {
  it("should take the stages and leave the steps", () => {
    expect(stageTitlesIn(THE_MARKERS)).toEqual([
      "Framing the task",
      "Quality gates",
      "Review by an agent",
      "Release to production",
    ]);
  });
});

describe("citationsIn", () => {
  it("should split a walk on its arrows", () => {
    expect(citationsIn("framing → quality gates → review", BETWEEN_STAGES)).toEqual([
      "framing",
      "quality gates",
      "review",
    ]);
  });

  it("should keep an em dash a step of the drawing is written with", () => {
    expect(citationsIn("the copy-reader agent — the finished sentences", BETWEEN_ENTRIES)).toEqual([
      "the copy-reader agent — the finished sentences",
    ]);
  });

  it("should read none as an answer rather than as the name of a stage", () => {
    expect(citationsIn("none", BETWEEN_ENTRIES)).toEqual([]);
  });

  it("should read an empty value the same way", () => {
    expect(citationsIn("   ", BETWEEN_ENTRIES)).toEqual([]);
  });

  it("should keep a stage walked twice, because the repeat is the finding", () => {
    expect(citationsIn("framing → review → framing", BETWEEN_STAGES)).toEqual([
      "framing",
      "review",
      "framing",
    ]);
  });

  it("should split an arrow written without spaces around it", () => {
    expect(citationsIn("framing→review", BETWEEN_STAGES)).toEqual(["framing", "review"]);
  });

  it("should drop the empty entry two arrows in a row leave behind", () => {
    expect(citationsIn("framing → → review", BETWEEN_STAGES)).toEqual(["framing", "review"]);
  });

  it("should read none written with spaces around it as an answer", () => {
    expect(citationsIn("  none  ", BETWEEN_ENTRIES)).toEqual([]);
  });
});

describe("markersMatching", () => {
  it("should match a stage on the opening words of its title", () => {
    expect(markersMatching("quality", THE_MARKERS).map((marker) => marker.text)).toEqual([
      "Quality gates",
    ]);
  });

  it("should match a step on the opening words of its own line", () => {
    expect(markersMatching("commit and push", THE_MARKERS)).toEqual([
      { kind: "step", text: "commit and push to main", stage: "Release to production" },
    ]);
  });

  it("should not care about case, because a log writes its citations in lower case", () => {
    expect(markersMatching("RELEASE TO", THE_MARKERS).map((marker) => marker.text)).toEqual([
      "Release to production",
    ]);
  });

  it("should return every line a citation too short to separate them fits", () => {
    expect(markersMatching("re", THE_MARKERS).map((marker) => marker.text)).toEqual([
      "Review by an agent",
      "Release to production",
    ]);
  });

  it("should return nothing for a citation no line begins with", () => {
    expect(markersMatching("stage 3", THE_MARKERS)).toEqual([]);
  });

  it("should take the line quoted whole over the longer one it opens", () => {
    const drawn = markersIn(
      [
        "    note over C,R: Stage 1. Review",
        "    R-->>C: findings, most severe first",
        "    note over C,R: Stage 2. The checkup",
        "    R-->>C: findings, most severe first, with the measurements as a table",
      ].join("\n")
    );

    expect(markersMatching("findings, most severe first", drawn)).toEqual([
      { kind: "step", text: "findings, most severe first", stage: "Review" },
    ]);
  });
});

describe("pathComplaints", () => {
  it("should say nothing when the walk and the skipped list together account for every stage", () => {
    const log = walking("framing → quality gates → release", "review by an agent");

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(NOTHING);
  });

  it("should let a step stand for the stage it was drawn in", () => {
    const log = walking(
      "what should be different → npm run check:phase → the phase-reviewer → commit and push",
      "none"
    );

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(NOTHING);
  });

  it("should accept a stage walked twice without counting it as a stage skipped", () => {
    const log = walking(
      "framing → quality gates → framing → quality gates → review by → release",
      "none"
    );

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(NOTHING);
  });

  it("should accept a step skipped inside a stage that was walked", () => {
    const log = walking(
      "framing → quality gates → review by an agent → release",
      "check the tech debt"
    );

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(NOTHING);
  });

  it("should name each owed field a log leaves out, and stop there", () => {
    const log = "# A phase\n\n```\nKind:       process\n```\n";

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(THREE_COMPLAINTS);
    expect(said[FIRST]).toContain(`${A_LOG}: no "Path:" line`);
    expect(said[FIRST]).toContain("reads exactly like a stage nobody skipped");
  });

  it("should refuse a citation no line of the drawing begins with", () => {
    const log = walking("framing → stage 2 → quality gates → review by → release", "none");

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('Path names "stage 2"');
    expect(said[FIRST]).toContain("never by a number");
  });

  it("should refuse a citation short enough to fit two different lines", () => {
    const log = walking("framing → quality gates → re", "none");

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('Path names "re", which fits 2 lines');
  });

  it("should say which stages a step drawn more than once sits in, rather than asking for more words", () => {
    const log = walking("framing → the fix-a-bug skill → review by → release", "none");

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('a step DEVELOPMENT-FLOW.md draws 2 times');
    expect(said[FIRST]).toContain('"Framing the task" and "Quality gates"');
    expect(said[FIRST]).toContain("name the stage instead");
  });

  it("should name a stage the log puts neither on the walk nor in the skipped list", () => {
    const log = walking("framing → quality gates → release", "none");

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('says nothing about the "Review by an agent" stage');
    expect(said[FIRST]).toContain("cannot read as a phase that forgot to mention it");
  });

  it("should name every stage left unaccounted for, not only the first", () => {
    const log = walking("framing", "none");

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(THREE_COMPLAINTS);
  });

  it("should refuse the same line claimed as walked and as skipped", () => {
    const log = walking(
      "framing → quality gates → review by an agent → release",
      "review by an agent"
    );

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('puts "Review by an agent" on the walk and in the skipped list');
  });

  it("should not read a stage walked and a step of it skipped as that contradiction", () => {
    const log = walking(
      "framing the task → quality gates → review by → release",
      "check the tech debt"
    );

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(NOTHING);
  });

  it("should refuse a walk that names nothing at all", () => {
    const log = walking("none", "none");

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(
      stageTitlesIn(THE_MARKERS).length
    );
  });

  it("should read a walk wrapped across two lines as one walk", () => {
    const log = [
      "# A phase",
      "",
      "```",
      "Path:       framing → quality gates → review by an agent →",
      "            release",
      "Skipped:    none",
      "Off-map:    none",
      "```",
      "",
    ].join("\n");

    expect(pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN)).toHaveLength(NOTHING);
  });

  it("should refuse a whole stage called skipped while the walk goes through a step of it", () => {
    const log = walking(
      "framing → npm run check:phase → the phase-reviewer agent → commit and push",
      "quality gates"
    );

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('calls the whole "Quality gates" stage skipped');
    expect(said[FIRST]).toContain("the week's tally of what gets gone round");
  });

  it("should say that once, not twice, when the stage is named on both sides outright", () => {
    const log = walking(
      "framing → quality gates → the phase-reviewer agent → commit and push",
      "quality gates"
    );

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("on the walk and in the skipped list at once");
  });

  it("should leave a log already written alone, whatever the drawing has done since", () => {
    const log = walking("framing → a step this drawing no longer draws", "none");

    expect(pathComplaints(A_LOG, log, THE_MARKERS, ALREADY_TESTIMONY)).toHaveLength(NOTHING);
  });

  it("should leave a log already written alone even when it carries none of the fields", () => {
    const log = "# A phase\n\n```\nKind:       process\n```\n";

    expect(pathComplaints(A_LOG, log, THE_MARKERS, ALREADY_TESTIMONY)).toHaveLength(NOTHING);
  });

  it("should complain about both a bad citation and the stage it left uncovered", () => {
    const log = walking("framing → quality gates → review by → nowhere", "none");

    const said = pathComplaints(A_LOG, log, THE_MARKERS, STILL_BEING_WRITTEN);

    expect(said).toHaveLength(TWO_COMPLAINTS);
    expect(said.some((complaint) => complaint.includes('names "nowhere"'))).toBe(true);
    expect(said.some((complaint) => complaint.includes('"Release to production" stage'))).toBe(true);
  });
});

describe("a log carrying an estimate", () => {
  const guessing = walking("framing", "quality gates · review").replace(
    "Off-map:    none",
    "Off-map:    none\nRan:        ~50 min"
  );

  it("should be refused alongside the walk it does describe", () => {
    const said = pathComplaints(A_LOG, guessing, THE_MARKERS, STILL_BEING_WRITTEN).join("\n");

    expect(said).toContain('"Ran: ~50 min"');
  });

  it("should be let alone once the log is testimony rather than a draft", () => {
    expect(pathComplaints(A_LOG, guessing, THE_MARKERS, ALREADY_TESTIMONY)).toHaveLength(NOTHING);
  });
});

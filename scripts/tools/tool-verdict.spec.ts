import { describe, expect, it } from "vitest";
import {
  TOOLS_DIR,
  closingLine,
  toolLogPathOf,
  toolVerdictPathOf,
  verdictOfRun,
} from "./tool-verdict.ts";


const STARTED = new Date("2026-09-09T10:00:00.000Z");

const ENDED = new Date("2026-09-09T10:00:41.200Z");

const DURATION_MS = 41200;

const SAID = ["reports/gallery/a.png — the widest name", "reports/gallery/b.png — nine players"];

const ARGS = ["gallery"];

describe("the folder and the files", () => {
  it("should be reports/tools, spelled out so tidy-reports reads it off this file", () => {
    expect(TOOLS_DIR).toBe("reports/tools");
  });

  it("should put a verb's log and verdict side by side, named after it", () => {
    expect(toolLogPathOf("gallery")).toBe("reports/tools/gallery.log");
    expect(toolVerdictPathOf("design-page")).toBe("reports/tools/design-page.json");
  });
});

describe("verdictOfRun()", () => {
  it("should record a run that threw nothing as green, with what it said and how long it took", () => {
    expect(verdictOfRun("gallery", ARGS, STARTED, ENDED, SAID, null)).toEqual({
      verb: "gallery",
      args: ARGS,
      ok: true,
      startedAt: STARTED.toISOString(),
      durationMs: DURATION_MS,
      said: SAID,
      error: null,
    });
  });

  it("should record a thrown error as red, keeping its message and not its stack", () => {
    const verdict = verdictOfRun("forget-chat", ["forget-chat", "x"], STARTED, ENDED, [], new Error("needs a chat id"));

    expect(verdict.ok).toBe(false);
    expect(verdict.error).toBe("needs a chat id");
  });

  it("should stringify a thrown value that is no Error", () => {
    expect(verdictOfRun("posters", ARGS, STARTED, ENDED, [], "gave up").error).toBe("gave up");
  });
});

describe("closingLine()", () => {
  it("should count the lines and point at the verdict for a green run", () => {
    expect(closingLine(verdictOfRun("gallery", ARGS, STARTED, ENDED, SAID, null))).toBe(
      "gallery: 2 lines in 41.2s → reports/tools/gallery.json"
    );
  });

  it("should say FAILED with the message for a red run", () => {
    expect(closingLine(verdictOfRun("posters", ARGS, STARTED, ENDED, [], new Error("no font")))).toBe(
      "posters: FAILED in 41.2s — no font → reports/tools/posters.json"
    );
  });
});

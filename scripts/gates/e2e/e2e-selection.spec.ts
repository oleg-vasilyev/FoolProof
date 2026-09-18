import { describe, expect, it } from "vitest";
import { selectionFor, selectionIn } from "./e2e-selection.ts";


const EVERY_SCENARIO = { kind: "everything" };

const NO_SCENARIO = { kind: "nothing" };

const A_LANGUAGE_SCENARIO = "e2e/scenarios/picking-a-language.e2e.spec.ts";

const A_MERGE_SCENARIO = "e2e/scenarios/merging-two-names.e2e.spec.ts";

describe("selectionFor(), the scenarios a diff can reach", () => {
  it("should play nothing for a change no scenario covers, and say so as its own answer", () => {
    expect(selectionFor(["README.md", "docs/posters/awards-en.png"])).toEqual(NO_SCENARIO);
  });

  it("should play a feature's own scenarios when that feature changed", () => {
    expect(selectionFor(["src/features/language/language-feature.ts"])).toEqual({
      kind: "scenarios",
      files: [A_LANGUAGE_SCENARIO, "e2e/scenarios/the-pictures-in-russian.e2e.spec.ts"],
    });
  });

  it("should play a scenario that changed, whatever else did", () => {
    expect(selectionFor([A_MERGE_SCENARIO])).toEqual({ kind: "scenarios", files: [A_MERGE_SCENARIO] });
  });

  it("should ask for each scenario once when two features share one", () => {
    const wanted = selectionFor([
      "src/features/merge-names/merge-names-feature.ts",
      "src/features/diagnostics/diagnostics-feature.ts",
    ]);

    expect(wanted).toEqual({
      kind: "scenarios",
      files: ["e2e/scenarios/merging-two-names.e2e.spec.ts", "e2e/scenarios/the-status-report.e2e.spec.ts"],
    });
  });

  it("should play everything when the bot's shared half, entry or supervisor changed", () => {
    for (const file of [
      "src/shared/table/name-list.ts",
      "src/main.ts",
      "src/supervisor.ts",
      "src/feature-installer.ts",
    ]) {
      expect(selectionFor([file])).toEqual(EVERY_SCENARIO);
    }
  });

  it("should play everything when the harness itself changed", () => {
    for (const file of [
      "e2e/harness/scenario-chat.ts",
      "e2e/hub/hub.ts",
      "e2e/fake-telegram/api.ts",
      "e2e/pages/chat.ts",
      "e2e/bot-process.ts",
      "e2e/bot-log.ts",
      "e2e/scratch-database.ts",
      "e2e/world-ports.ts",
    ]) {
      expect(selectionFor([file])).toEqual(EVERY_SCENARIO);
    }
  });

  it("should play everything when anything the gate itself runs on changed, not just its config", () => {
    for (const file of [
      "scripts/gates/e2e/vitest.e2e.config.ts",
      "scripts/gates/e2e/e2e-changed.ts",
      "scripts/gates/e2e/e2e-selection.ts",
      "scripts/gates/e2e/vitest.harness.config.ts",
    ]) {
      expect(selectionFor([file])).toEqual(EVERY_SCENARIO);
    }
  });

  it("should play everything for a feature folder it has never heard of, rather than nothing", () => {
    expect(selectionFor(["src/features/a-feature-nobody-mapped/its-feature.ts"])).toEqual(EVERY_SCENARIO);
  });

  it("should take everything over a narrower answer when both are asked for at once", () => {
    expect(selectionFor([A_MERGE_SCENARIO, "src/shared/table/name-list.ts"])).toEqual(EVERY_SCENARIO);
  });
});

describe("selectionIn(), reading back what the gate recorded", () => {
  it("should read every shape the gate writes", () => {
    expect(selectionIn(JSON.stringify(EVERY_SCENARIO))).toEqual(EVERY_SCENARIO);
    expect(selectionIn(JSON.stringify(NO_SCENARIO))).toEqual(NO_SCENARIO);
    expect(selectionIn(JSON.stringify({ kind: "scenarios", files: [A_MERGE_SCENARIO] }))).toEqual({
      kind: "scenarios",
      files: [A_MERGE_SCENARIO],
    });
  });

  it("should refuse a file that is not JSON at all rather than throwing under the runner", () => {
    expect(selectionIn("not json")).toBeNull();
  });

  it("should refuse a kind it does not know", () => {
    expect(selectionIn(JSON.stringify({ kind: "some-other-thing" }))).toBeNull();
  });

  it("should refuse scenarios carrying no list, which would read as a run over nothing", () => {
    expect(selectionIn(JSON.stringify({ kind: "scenarios" }))).toBeNull();
  });

  it("should refuse a scenario list holding something that is not a path", () => {
    expect(selectionIn(JSON.stringify({ kind: "scenarios", files: [1] }))).toBeNull();
  });

  it("should refuse a bare value, which JSON.parse accepts happily", () => {
    expect(selectionIn("null")).toBeNull();
    expect(selectionIn("7")).toBeNull();
  });
});

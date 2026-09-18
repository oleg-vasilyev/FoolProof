import { describe, expect, it } from "vitest";
import { scenariosFor } from "./e2e-changed.ts";


const EVERY_SCENARIO = null;

const A_LANGUAGE_SCENARIO = "e2e/scenarios/picking-a-language.e2e.spec.ts";

const A_MERGE_SCENARIO = "e2e/scenarios/merging-two-names.e2e.spec.ts";

describe("scenariosFor(), the scenarios a diff can reach", () => {
  it("should play nothing for a change no scenario covers", () => {
    expect(scenariosFor(["README.md", "docs/posters/awards-en.png"])).toEqual([]);
  });

  it("should play a feature's own scenarios when that feature changed", () => {
    expect(scenariosFor(["src/features/language/language-feature.ts"])).toEqual([
      A_LANGUAGE_SCENARIO,
      "e2e/scenarios/the-pictures-in-russian.e2e.spec.ts",
    ]);
  });

  it("should play a scenario that changed, whatever else did", () => {
    expect(scenariosFor([A_MERGE_SCENARIO])).toEqual([A_MERGE_SCENARIO]);
  });

  it("should ask for each scenario once when two features share one", () => {
    const wanted = scenariosFor([
      "src/features/merge-names/merge-names-feature.ts",
      "src/features/diagnostics/diagnostics-feature.ts",
    ]);

    expect(wanted).toEqual(["e2e/scenarios/merging-two-names.e2e.spec.ts", "e2e/scenarios/the-status-report.e2e.spec.ts"]);
  });

  it("should play everything when the bot's shared half, entry or supervisor changed", () => {
    for (const file of [
      "src/shared/table/name-list.ts",
      "src/main.ts",
      "src/supervisor.ts",
      "src/feature-installer.ts",
    ]) {
      expect(scenariosFor([file])).toBe(EVERY_SCENARIO);
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
      expect(scenariosFor([file])).toBe(EVERY_SCENARIO);
    }
  });

  it("should play everything when anything the gate itself runs on changed, not just its config", () => {
    for (const file of [
      "scripts/gates/e2e/vitest.e2e.config.ts",
      "scripts/gates/e2e/e2e-changed.ts",
      "scripts/gates/e2e/vitest.harness.config.ts",
    ]) {
      expect(scenariosFor([file])).toBe(EVERY_SCENARIO);
    }
  });

  it("should play everything for a feature folder it has never heard of, rather than nothing", () => {
    expect(scenariosFor(["src/features/a-feature-nobody-mapped/its-feature.ts"])).toBe(EVERY_SCENARIO);
  });

  it("should take everything over a narrower answer when both are asked for at once", () => {
    expect(scenariosFor([A_MERGE_SCENARIO, "src/shared/table/name-list.ts"])).toBe(EVERY_SCENARIO);
  });
});

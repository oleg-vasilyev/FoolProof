import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  THE_CHECKUP_AGENT,
  fullMutationOutsideTheCheckup,
  runsTheFullMutation,
} from "./a-full-mutation-outside-the-checkup.ts";


describe("runsTheFullMutation()", () => {
  it("should find the full run typed into bash, alone or chained", () => {
    expect(runsTheFullMutation("node scripts/gates/gate-runner.ts test:mutation")).toBe(true);
    expect(runsTheFullMutation("git status; node scripts/gates/gate-runner.ts   test:mutation")).toBe(true);
  });

  it("should find the full run whichever slash the path is written with, relative or absolute", () => {
    expect(runsTheFullMutation(String.raw`node scripts\gates\gate-runner.ts test:mutation`)).toBe(true);
    expect(runsTheFullMutation(String.raw`node .\scripts\gates\gate-runner.ts test:mutation`)).toBe(true);
    expect(runsTheFullMutation(String.raw`node D:\Temp\FoolProof\scripts\gates\gate-runner.ts test:mutation`)).toBe(
      true
    );
    expect(runsTheFullMutation(String.raw`node scripts/gates\gate-runner.ts test:mutation`)).toBe(true);
  });

  it("should find the full run handed to a detached process as an argument list", () => {
    expect(
      runsTheFullMutation("Start-Process node -ArgumentList 'scripts/gates/gate-runner.ts','test:mutation'")
    ).toBe(true);
    expect(runsTheFullMutation('Start-Process node "scripts/gates/gate-runner.ts test:mutation"')).toBe(true);
  });

  it("should let the diff's own mutation and every other gate through", () => {
    expect(runsTheFullMutation("node scripts/gates/gate-runner.ts test:mutation-changed a.ts")).toBe(false);
    expect(runsTheFullMutation("node scripts/gates/gate-runner.ts test:coverage")).toBe(false);
    expect(runsTheFullMutation("node scripts/gates/gate-runner.ts test:mutationx")).toBe(false);
    expect(runsTheFullMutation("node scripts/gates/gate-runner.ts test:mutation:changed")).toBe(false);
  });

  it("should read the runner's path literally, so a dot is not any character", () => {
    expect(runsTheFullMutation("node scripts/gates/gate-runnerXts test:mutation")).toBe(false);
  });
});

describe("fullMutationOutsideTheCheckup()", () => {
  const theFullRun = "node scripts/gates/gate-runner.ts test:mutation";

  it("should name an agent that exists, or a renamed checkup would be refused its own run", () => {
    expect(existsSync(`.claude/agents/${THE_CHECKUP_AGENT}.md`)).toBe(true);
  });

  it("should let the checkup agent run it", () => {
    expect(fullMutationOutsideTheCheckup(theFullRun, THE_CHECKUP_AGENT)).toBeNull();
  });

  it("should say nothing about a command that is not the full run, whoever sends it", () => {
    expect(fullMutationOutsideTheCheckup("git status", undefined)).toBeNull();
  });

  it("should refuse the main session and every other agent, naming the run a phase uses instead", () => {
    const refusal = fullMutationOutsideTheCheckup(theFullRun, undefined);

    expect(fullMutationOutsideTheCheckup(theFullRun, "phase-reviewer")).toBe(refusal);
    expect(refusal?.split("\n")).toEqual([
      "Refused: test:mutation is the deep-checkup agent's run and nobody else's.",
      "A phase mutates its own diff and a tag what changed since the previous tag:",
      "node scripts/gates/gate-runner.ts test:mutation-changed [files].",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import {
  MOST_FAILURES,
  MOST_MESSAGE_LINES,
  THE_FILE_DID_NOT_LOAD,
  casesIn,
  failuresIn,
  messageOf,
  ratesIn,
  resultsIn,
  type VitestResults,
} from "./test-results.ts";


const A_FAILED_FILE = "D:/Temp/FoolProof/scripts/gate-paths.spec.ts";

const A_FAILED_NAME = "fileStemOf() should turn the colons a file name may not carry into dashes";

const A_FAILED_MESSAGE =
  "AssertionError: expected 'test-mutation-changed' to be 'PROBE-this-must-fail' // Object.is equality";

const ELEVEN = 11;

const ONE = 1;

const NONE = 0;

const A_PATH = "reports/tests/results.json";

const A_UNIT = false;

const AN_E2E_RUN = true;

const STATEMENTS = 99.84;

const BRANCHES = 97.61;

const FUNCTIONS = 100;

const LINES = 99.83;

const readerOver = (files: Record<string, string>) => (path: string) => files[path] ?? null;

const redResults = (failed: number): VitestResults =>
  JSON.parse(
    JSON.stringify({
      numTotalTests: failed + ONE,
      numFailedTests: failed,
      testResults: [
        {
          name: A_FAILED_FILE,
          assertionResults: [
            { fullName: "a green one", status: "passed", failureMessages: [] },
            ...Array.from({ length: failed }, (unused, index) => ({
              fullName: `${A_FAILED_NAME} ${String(index)}`,
              status: "failed",
              failureMessages: [`${A_FAILED_MESSAGE}\n    at ${A_FAILED_FILE}:18:49\n    at runner.js:302:11`],
            })),
          ],
        },
      ],
    })
  ) as VitestResults;

describe("messageOf()", () => {
  it("should keep the message and drop the stack frames vitest appends to it", () => {
    expect(messageOf("AssertionError: expected 'a' to be 'b'\n    at file:18:49\n    at runner.js:302:11")).toBe(
      "AssertionError: expected 'a' to be 'b'"
    );
  });

  it("should keep a message of several lines up to the ceiling, and no more", () => {
    const four = ["one", "two", "three", "four"].join("\n");

    expect(messageOf(four).split("\n")).toHaveLength(MOST_MESSAGE_LINES);
    expect(messageOf("- expected\n+ received\n    at x:1:1")).toBe("- expected\n+ received");
  });

  it("should say nothing for a failure that carried no message at all", () => {
    expect(messageOf(undefined)).toBe("");
  });
});

describe("failuresIn(), read off the reporter's real shape", () => {
  it("should name each failed assertion by file, full name and its message with the stack frames cut off", () => {
    expect(failuresIn(redResults(ONE), A_UNIT)).toEqual([
      { file: A_FAILED_FILE, name: `${A_FAILED_NAME} 0`, message: A_FAILED_MESSAGE, botLog: null },
    ]);
  });

  it("should name a spec file that failed to load, which has no assertions to fail, by the file's own message", () => {
    const results = {
      numTotalTests: NONE,
      numFailedTests: NONE,
      testResults: [
        {
          name: A_FAILED_FILE,
          status: "failed",
          message: '[vitest] No "LINT_FINDINGS" export is defined on the mock.\nIf you need to partially mock a module…',
          assertionResults: [],
        },
      ],
    };

    expect(failuresIn(results, A_UNIT)).toEqual([
      {
        file: A_FAILED_FILE,
        name: THE_FILE_DID_NOT_LOAD,
        message: expect.stringContaining("LINT_FINDINGS") as unknown as string,
        botLog: null,
      },
    ]);
  });

  it("should name the bot log of the scenario an e2e case failed in, and none for a unit", () => {
    const results = {
      numTotalTests: ONE,
      numFailedTests: ONE,
      testResults: [
        {
          name: "e2e/scenarios/picking-a-language.e2e.spec.ts",
          assertionResults: [
            {
              fullName: "picking the language a chat is played in should open a screen",
              ancestorTitles: ["picking the language a chat is played in"],
              status: "failed",
              failureMessages: ["AssertionError: expected [] to equal []\n    at a.ts:9:5"],
            },
          ],
        },
      ],
    };

    expect(failuresIn(results, AN_E2E_RUN)[NONE]?.botLog).toBe(
      "reports/e2e/bot/picking-the-language-a-chat-is-played-in.log"
    );
    expect(failuresIn(results, A_UNIT)[NONE]?.botLog).toBeNull();
  });

  it("should keep at most ten failures, the rest being in the log", () => {
    expect(failuresIn(redResults(ELEVEN), A_UNIT)).toHaveLength(MOST_FAILURES);
  });

  it("should carry no failures for a green run", () => {
    expect(failuresIn({ numTotalTests: ONE, numFailedTests: NONE, testResults: [] }, A_UNIT)).toEqual([]);
  });
});

describe("casesIn()", () => {
  it("should count the cases the reporter counted and the files it listed", () => {
    expect(casesIn(redResults(ONE), A_UNIT)).toMatchObject({ cases: 2, files: ONE, failed: ONE });
  });
});

describe("resultsIn()", () => {
  it("should read the reporter's file, and say nothing when the run never wrote one", () => {
    expect(resultsIn(readerOver({ [A_PATH]: JSON.stringify(redResults(ONE)) }), A_PATH)).toMatchObject({
      numFailedTests: ONE,
    });
    expect(resultsIn(readerOver({}), A_PATH)).toBeNull();
  });
});

describe("ratesIn()", () => {
  it("should read the four percentages in statements, branches, functions, lines order", () => {
    const summary = JSON.stringify({
      total: {
        statements: { pct: STATEMENTS },
        branches: { pct: BRANCHES },
        functions: { pct: FUNCTIONS },
        lines: { pct: LINES },
      },
    });

    expect(ratesIn(readerOver({ [A_PATH]: summary }), A_PATH)).toEqual({
      statements: STATEMENTS,
      branches: BRANCHES,
      functions: FUNCTIONS,
      lines: LINES,
    });
  });

  it("should say nothing when a red suite left no coverage summary behind", () => {
    expect(ratesIn(readerOver({}), A_PATH)).toBeNull();
  });
});

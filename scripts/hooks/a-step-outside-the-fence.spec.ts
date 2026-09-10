import { describe, expect, it } from "vitest";
import { stepOutsideTheFence } from "./a-step-outside-the-fence.ts";


const FENCE = "D:\\tmp\\benchmark\\clone";

const SCRATCH = "D:\\tmp\\claude";

const FENCES = [FENCE, SCRATCH];

const CWD = "D:\\tmp\\benchmark\\clone\\src";

const read = (file_path: string) => ({ tool: "Read", input: { file_path } });

const shell = (command: string) => ({ tool: "Bash", input: { command } });

describe("stepOutsideTheFence()", () => {
  describe("a tool that names a file", () => {
    it("should let a file inside the fence through, absolute or relative", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read("D:\\tmp\\benchmark\\clone\\PLAN.md"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, read("features/x.ts"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, read("d:/tmp/BENCHMARK/clone/src/a.ts"))).toBeNull();
    });

    it("should let the second root through as readily as the first", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read("D:\\tmp\\claude\\session\\scratch.txt"))).toBeNull();
    });

    it("should let the clone's own memory folder through when the runner names it as a root", () => {
      const memory = "C:\\Users\\x\\.claude\\projects\\D--tmp-benchmark-clone";

      expect(stepOutsideTheFence([...FENCES, memory], CWD, read(`${memory}\\memory\\MEMORY.md`))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, read(`${memory}\\memory\\MEMORY.md`))).toContain("outside");
    });

    it("should refuse an absolute file outside every fence", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read("D:\\Temp\\FoolProof\\benchmark\\task.json"))).toContain(
        "Refused: Read reaches D:\\Temp\\FoolProof\\benchmark\\task.json"
      );
      expect(stepOutsideTheFence(FENCES, CWD, read("C:\\x"))).toContain(`outside ${FENCE} and ${SCRATCH}`);
    });

    it("should refuse a relative path that climbs out", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read("../../../secrets.txt"))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, read("..\\..\\x"))).toContain("outside");
    });

    it("should let a climb that stays inside through", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read("../PLAN.md"))).toBeNull();
    });

    it("should refuse the home folder in any spelling", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read("~/.claude/projects"))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, { tool: "Glob", input: { path: "$HOME/.claude" } })).toContain("outside");
    });

    it("should read the path field each tool uses", () => {
      expect(stepOutsideTheFence(FENCES, CWD, { tool: "Grep", input: { pattern: "x", path: "C:\\" } })).toContain(
        "Refused: Grep"
      );
      expect(
        stepOutsideTheFence(FENCES, CWD, { tool: "NotebookEdit", input: { notebook_path: "C:\\n.ipynb" } })
      ).toContain("Refused: NotebookEdit");
      expect(stepOutsideTheFence(FENCES, CWD, { tool: "MultiEdit", input: { file_path: "C:\\a.ts" } })).toContain(
        "Refused: MultiEdit"
      );
    });

    it("should say nothing about a tool that names no path", () => {
      expect(stepOutsideTheFence(FENCES, CWD, { tool: "WebSearch", input: { query: "C:\\" } })).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, { tool: "Read", input: {} })).toBeNull();
    });

    it("should sit exactly on the fence: the root itself is inside, a sibling with the same prefix is not", () => {
      expect(stepOutsideTheFence(FENCES, CWD, read(FENCE))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, read(`${FENCE}-other\\x`))).toContain("outside");
    });
  });

  describe("a shell command", () => {
    it("should let ordinary work through", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("node scripts/gates/gate-runner.ts test src/a.spec.ts"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("git log --oneline -5 && npm run check:quick"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("sed -i 's/a\\/b/c/' PLAN.md"))).toBeNull();
    });

    it("should refuse an absolute path outside, in Windows or in msys spelling", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat D:\\Temp\\FoolProof\\PLAN.md"))).toContain("Refused: Bash");
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat /d/Temp/FoolProof/PLAN.md"))).toContain("Refused: Bash");
      expect(stepOutsideTheFence(FENCES, CWD, shell("cd /c/Users && ls"))).toContain("Refused: Bash");
    });

    it("should let an absolute path inside a fence through, in either spelling", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat D:\\tmp\\benchmark\\clone\\PLAN.md"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat /d/tmp/benchmark/clone/PLAN.md"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("echo x > /d/tmp/claude/s/note.txt"))).toBeNull();
    });

    it("should refuse a climb out and the home folder", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("cd ../../.. && ls"))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, shell("ls ~/.claude"))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat $HOME/x"))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, shell("type %USERPROFILE%\\x"))).toContain("outside");
    });

    it("should look inside quotes and behind an option's equals sign", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell('cat "D:\\Temp\\FoolProof\\PLAN.md"'))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, shell("node x --config=C:\\x.json"))).toContain("outside");
    });

    it("should not mistake a URL or a regex for a path", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("curl https://example.com/a/b"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("grep -E 'a|b/c' x.ts"))).toBeNull();
    });

    it("should not read the seven fragments the first calibration refused as paths: pattern pieces, bare punctuation, quoted prose", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("grep -n 'HAT TRICK\\|FIRST' src/awards.ts"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("grep -rn /awards.ts: reports"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("sed -n '/stats_awards,/p' PLAN.md"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("git grep -n `Первое, /, /, /` -- src"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("printf '\\ / / / \\n' >> notes.md"))).toBeNull();
      expect(
        stepOutsideTheFence(FENCES, CWD, shell("grep -l x /src/features/scoresheet/samples/gallery-edges.ts"))
      ).toBeNull();
    });

    it("should still refuse a real path when it ends in a stop or sits in backticks", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat D:\\Temp\\FoolProof\\PLAN.md, D:\\x"))).toContain("outside");
      expect(stepOutsideTheFence(FENCES, CWD, shell("echo `cat /d/Temp/FoolProof/PLAN.md`"))).toContain("outside");
    });

    it("should let a root-relative path pass on Windows, where it is a pattern far more often than a drive-relative file", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("cat /etc/passwd"))).toBeNull();
      expect(stepOutsideTheFence(FENCES, CWD, shell("type \\Windows\\win.ini"))).toBeNull();
    });

    it("should name every path that leaves, not just the first", () => {
      expect(stepOutsideTheFence(FENCES, CWD, shell("cp C:\\a D:\\b"))).toContain("C:\\a, D:\\b");
    });

    it("should say nothing when the command is not a string", () => {
      expect(stepOutsideTheFence(FENCES, CWD, { tool: "Bash", input: {} })).toBeNull();
    });
  });

  describe("on a posix machine", () => {
    const POSIX_FENCE = "/tmp/foolproof-benchmark/x/clone";

    const POSIX_CWD = "/tmp/foolproof-benchmark/x/clone/src";

    it("should judge posix paths with posix rules", () => {
      expect(stepOutsideTheFence([POSIX_FENCE], POSIX_CWD, read("/tmp/foolproof-benchmark/x/clone/PLAN.md"))).toBeNull();
      expect(stepOutsideTheFence([POSIX_FENCE], POSIX_CWD, read("../PLAN.md"))).toBeNull();
      expect(stepOutsideTheFence([POSIX_FENCE], POSIX_CWD, read("/home/someone/.claude"))).toContain("outside");
      expect(stepOutsideTheFence([POSIX_FENCE], POSIX_CWD, shell("cd ../../.. && ls"))).toContain("outside");
      expect(stepOutsideTheFence([POSIX_FENCE], POSIX_CWD, shell("cat /etc/passwd"))).toContain("outside");
    });

    it("should judge Windows fixtures with Windows rules whatever the machine, so the spec above holds on CI", () => {
      expect(stepOutsideTheFence([FENCE], CWD, read("C:\\elsewhere"))).toContain("outside");
    });
  });
});

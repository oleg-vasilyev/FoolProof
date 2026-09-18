import { describe, expect, it } from "vitest";
import {
  beyondThisCheck,
  demandsLf,
  endingComplaints,
  pathsDemandingLf,
  walkedInto,
} from "./line-endings.ts";


const ONE_COMPLAINT = 1;

const NO_COMPLAINT = 0;

const FIRST = 0;

const A_SHELL_SCRIPT = "deploy/configure-server.sh";

const CRLF = "set -eu\r\n";

const LF = "set -eu\n";

describe("pathsDemandingLf", () => {
  it("should take the path off a line that asks for LF", () => {
    expect(pathsDemandingLf("*.sh text eol=lf")).toEqual(["*.sh"]);
  });

  it("should read every rule in a file, not only the first", () => {
    expect(pathsDemandingLf("*.sh text eol=lf\n*.service text eol=lf")).toEqual([
      "*.sh",
      "*.service",
    ]);
  });

  it("should ignore a comment that happens to mention the attribute", () => {
    expect(pathsDemandingLf("# a unit is stored with eol=lf\n*.sh text eol=lf")).toEqual(["*.sh"]);
  });

  it("should ignore a rule that says nothing about line endings", () => {
    expect(pathsDemandingLf("*.png binary\n*.sh text eol=lf")).toEqual(["*.sh"]);
  });

  it("should not read a blank line as a pattern", () => {
    expect(pathsDemandingLf("\n\n*.sh text eol=lf\n")).toEqual(["*.sh"]);
  });

  it("should read a file whose lines end the way it is warning about", () => {
    expect(pathsDemandingLf("*.sh text eol=lf\r\n*.timer text eol=lf\r\n")).toEqual([
      "*.sh",
      "*.timer",
    ]);
  });

  it("should take the path off an indented rule", () => {
    expect(pathsDemandingLf("    *.sh text eol=lf")).toEqual(["*.sh"]);
  });

  it("should read a rule whose fields are held apart by a tab", () => {
    expect(pathsDemandingLf("*.sh\ttext\teol=lf")).toEqual(["*.sh"]);
  });
});

describe("walkedInto", () => {
  it("should walk into a folder the repository keeps", () => {
    expect(["docs", "src", "deploy", ".githooks"].filter((name) => !walkedInto(name))).toEqual([]);
  });

  it("should stay out of everything a check writes or a tool installs", () => {
    expect(
      [".git", "node_modules", "reports", "data", ".stryker-tmp"].filter(walkedInto)
    ).toEqual([]);
  });
});

describe("demandsLf", () => {
  it("should match an extension rule however deep the file sits", () => {
    expect(demandsLf("deploy/nested/run.sh", "*.sh")).toBe(true);
  });

  it("should not match a name the extension is only the start of", () => {
    expect(demandsLf("deploy/run.shell", "*.sh")).toBe(false);
  });

  it("should match a file directly inside the folder a rule names", () => {
    expect(demandsLf(".githooks/pre-push", ".githooks/*")).toBe(true);
  });

  it("should not let a folder rule reach into a folder below it", () => {
    expect(demandsLf(".githooks/deeper/pre-push", ".githooks/*")).toBe(false);
  });

  it("should read a dot in a literal rule as a dot rather than as any character", () => {
    expect(demandsLf(".env-example", ".env.example")).toBe(false);
  });

  it("should match the literal rule it was written for", () => {
    expect(demandsLf(".env.example", ".env.example")).toBe(true);
  });
});

describe("beyondThisCheck", () => {
  it("should not claim to read a rule anchored to the repository root", () => {
    expect(beyondThisCheck("/deploy/*.sh")).toBe(true);
  });

  it("should not claim to read a rule reaching through folders", () => {
    expect(beyondThisCheck("deploy/**")).toBe(true);
  });

  it("should not claim to read a rule that excludes rather than covers", () => {
    expect(beyondThisCheck("!deploy/generated.sh")).toBe(true);
  });

  it("should read the shapes this repository actually writes", () => {
    expect([".env.example", "*.sh", ".githooks/*"].filter(beyondThisCheck)).toEqual([]);
  });
});

describe("endingComplaints", () => {
  it("should refuse a rule it cannot read rather than passing its files in silence", () => {
    const said = endingComplaints([A_SHELL_SCRIPT], ["/deploy/*.sh"], () => CRLF);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("cannot read");
    expect(said[FIRST]).toContain("/deploy/*.sh");
  });

  it("should not let a rule it cannot read decide that a file is covered", () => {
    const said = endingComplaints([A_SHELL_SCRIPT], ["deploy/**"], () => CRLF);

    expect(said.filter((complaint) => complaint.startsWith(A_SHELL_SCRIPT))).toHaveLength(
      NO_COMPLAINT
    );
  });

  it("should name the file, the reason and the command that fixes it", () => {
    const said = endingComplaints([A_SHELL_SCRIPT], ["*.sh"], () => CRLF);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toBe(
      `${A_SHELL_SCRIPT}: is checked out with CRLF, and .gitattributes says it must be LF ` +
        `— the carriage return travels to the Linux host that reads the file, and a tool ` +
        `editing it here will disagree with the repository about where a line ends; run ` +
        `"git add --renormalize ." and check the file out again`
    );
  });

  it("should say of a rule it cannot read what it does know how to read", () => {
    const said = endingComplaints([], ["/deploy/*.sh"], () => LF);

    expect(said[FIRST]).toBe(
      `.gitattributes: writes "/deploy/*.sh", which this check cannot read — it knows a ` +
        `literal path and a "*" standing for part of one folder name, so every file that ` +
        `rule covers would go unchecked while the gate still reported agreement; teach it ` +
        `that shape rather than leaving it narrower than the file it reads`
    );
  });

  it("should say nothing about a file that already ends its lines with LF", () => {
    expect(endingComplaints([A_SHELL_SCRIPT], ["*.sh"], () => LF)).toHaveLength(NO_COMPLAINT);
  });

  it("should say nothing about a file no rule covers, whatever is in it", () => {
    expect(endingComplaints(["docs/index.html"], ["*.sh"], () => CRLF)).toHaveLength(NO_COMPLAINT);
  });

  it("should not open a file no rule covers", () => {
    const opened: string[] = [];

    endingComplaints(["docs/index.html", A_SHELL_SCRIPT], ["*.sh"], (path) => {
      opened.push(path);

      return LF;
    });

    expect(opened).toEqual([A_SHELL_SCRIPT]);
  });

  it("should complain once per file even when two rules cover it", () => {
    expect(endingComplaints([A_SHELL_SCRIPT], ["*.sh", "deploy/*"], () => CRLF)).toHaveLength(
      ONE_COMPLAINT
    );
  });
});

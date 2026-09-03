import { describe, expect, it } from "vitest";
import { namedCommandComplaints, toolVerbsIn } from "./named-commands.ts";


const FIRST = 0;

const SECOND = 1;

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const A_FILE = ".claude/skills/build-it/SKILL.md";

const THE_TARGETS = { scripts: new Set(["check", "e2e:changed"]), verbs: new Set(["posters"]) };

describe("toolVerbsIn", () => {
  it("should read each verb from the usage line tools.ts prints for it", () => {
    const source = [
      '    usage: "node scripts/tools.ts posters",',
      '    usage: "node scripts/tools.ts forget-chat <chat id>",',
    ].join("\n");

    expect(toolVerbsIn(source)).toEqual(["posters", "forget-chat"]);
  });

  it("should read nothing from a source with no usage line", () => {
    expect(toolVerbsIn('const usage = "node scripts/tools.ts";')).toEqual([]);
  });
});

describe("namedCommandComplaints", () => {
  it("should pass a document naming only commands and verbs that exist", () => {
    const text = "run `npm run check`, then `node scripts/tools.ts posters`";

    expect(namedCommandComplaints(A_FILE, text, THE_TARGETS)).toEqual([]);
  });

  it("should read a script name carrying a digit, the way the e2e family is spelled", () => {
    expect(namedCommandComplaints(A_FILE, "run npm run e2e:changed", THE_TARGETS)).toEqual([]);
    expect(namedCommandComplaints(A_FILE, "run npm run e2e", THE_TARGETS)).toHaveLength(
      ONE_COMPLAINT
    );
  });

  it("should name a command package.json does not have, and say why that is a finding", () => {
    const said = namedCommandComplaints(A_FILE, "run npm run nonesuch", THE_TARGETS);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain(`${A_FILE}: names "npm run nonesuch"`);
    expect(said[FIRST]).toContain("a broken link with a verb in it");
  });

  it("should name a verb tools.ts does not offer, and say where the list is", () => {
    const said = namedCommandComplaints(A_FILE, "node scripts/tools.ts evening 1", THE_TARGETS);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain(
      'names "scripts/tools.ts evening", which scripts/tools.ts does not offer'
    );
    expect(said[FIRST]).toContain("run it with no arguments for the list");
  });

  it("should complain once about a name a document repeats", () => {
    const text = "npm run nonesuch, and again npm run nonesuch";

    expect(namedCommandComplaints(A_FILE, text, THE_TARGETS)).toHaveLength(ONE_COMPLAINT);
  });

  it("should leave a placeholder verb alone, since <verb> names nothing", () => {
    const text = "node scripts/tools.ts <verb> and npm run <gate>";

    expect(namedCommandComplaints(A_FILE, text, THE_TARGETS)).toEqual([]);
  });

  it("should report both kinds of missing name from one document", () => {
    const text = "npm run nonesuch; node scripts/tools.ts nowhere";
    const said = namedCommandComplaints(A_FILE, text, THE_TARGETS);

    expect(said).toHaveLength(TWO_COMPLAINTS);
    expect(said[FIRST]).toContain("npm run nonesuch");
    expect(said[SECOND]).toContain("scripts/tools.ts nowhere");
  });
});

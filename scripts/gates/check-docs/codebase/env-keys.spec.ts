import { describe, expect, it } from "vitest";
import { envTemplateComplaints, requiredKeyComplaints } from "./env-keys.ts";


const NOTHING = 0;

const ONE = 1;

const TWO = 2;

const FIRST = 0;

const A_FULL_TEMPLATE = [
  "# The template.",
  "BOT_TOKEN=",
  "DB_PATH=data/foolproof.dev.db",
  "# Set by the supervisor, never by hand.",
  "#   BOT_START_ATTEMPT",
].join("\n");

const A_FULL_SOURCE = [
  'const bot = new Bot(requireEnv(env, "BOT_TOKEN"));',
  'const file = optionalEnv(env, "DB_PATH") ?? DEFAULT;',
  'const attempt = optionalEnv(env, "BOT_START_ATTEMPT");',
].join("\n");

describe("envTemplateComplaints", () => {
  it("should say nothing when every key the code reads is in the template", () => {
    expect(envTemplateComplaints(A_FULL_TEMPLATE, A_FULL_SOURCE)).toHaveLength(NOTHING);
  });

  it("should catch a key the code reads that the template never names", () => {
    const source = `${A_FULL_SOURCE}\nconst root = optionalEnv(env, "BOT_API_ROOT");`;

    const said = envTemplateComplaints(A_FULL_TEMPLATE, source);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("says nothing about BOT_API_ROOT");
  });

  it("should catch a key read straight off the environment, not only through requireEnv", () => {
    const source = `${A_FULL_SOURCE}\nconst level = process.env.LOG_LEVEL;`;

    expect(envTemplateComplaints(A_FULL_TEMPLATE, source)[FIRST]).toContain(
      "says nothing about LOG_LEVEL"
    );
  });

  it("should refuse a required key the template only talks about, since a copy cannot carry it", () => {
    const template = A_FULL_TEMPLATE.replace("BOT_TOKEN=", "#   BOT_TOKEN");

    const said = envTemplateComplaints(template, A_FULL_SOURCE);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain('offers no "BOT_TOKEN=" line');
  });

  it("should let an optional key be a note rather than a line, which is how the supervisor's are written", () => {
    const asALine = A_FULL_TEMPLATE.replace("#   BOT_START_ATTEMPT", "BOT_START_ATTEMPT=");

    expect(envTemplateComplaints(A_FULL_TEMPLATE, A_FULL_SOURCE)).toHaveLength(NOTHING);
    expect(envTemplateComplaints(asALine, A_FULL_SOURCE)).toHaveLength(NOTHING);
  });

  it("should say only that a required key is missing, never also that it is mentioned", () => {
    const template = A_FULL_TEMPLATE.replace("BOT_TOKEN=\n", "");

    const said = envTemplateComplaints(template, A_FULL_SOURCE);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("says nothing about BOT_TOKEN");
  });

  it("should catch a line offered to be filled in that nothing reads any more", () => {
    const template = `${A_FULL_TEMPLATE}\nOLD_KEY=`;

    const said = envTemplateComplaints(template, A_FULL_SOURCE);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("offers OLD_KEY to be filled in");
  });

  it("should read the text and not the syntax — safe here, since lint bans comments in src/", () => {
    const source = `${A_FULL_SOURCE}\n// requireEnv(env, "NOT_REALLY") is what we used to do`;

    expect(envTemplateComplaints(A_FULL_TEMPLATE, source)[FIRST]).toContain(
      "says nothing about NOT_REALLY"
    );
  });

  it("should read a key straight after the comma, with no space before the quote", () => {
    const source = `${A_FULL_SOURCE}\nconst tight = optionalEnv(env,"TIGHT_KEY");`;

    expect(envTemplateComplaints(A_FULL_TEMPLATE, source)[FIRST]).toContain(
      "says nothing about TIGHT_KEY"
    );
  });

  it("should only count a fillable key at the true start of its line, not one a prefix runs into", () => {
    const template = `${A_FULL_TEMPLATE}\nseeNEW_KEY=again`;

    expect(envTemplateComplaints(template, A_FULL_SOURCE)).toHaveLength(NOTHING);
  });
});

describe("requiredKeyComplaints", () => {
  const A_GUARDING_SCRIPT = 'REQUIRED_KEYS="BOT_TOKEN DB_PATH"\n';

  const A_REQUIRING_SOURCE = [
    'const bot = new Bot(requireEnv(env, "BOT_TOKEN"));',
    'const file = requireEnv(env, "DB_PATH");',
  ].join("\n");

  it("should say nothing when the deploy script guards every key the entry point requires", () => {
    expect(requiredKeyComplaints(A_GUARDING_SCRIPT, A_REQUIRING_SOURCE)).toHaveLength(NOTHING);
  });

  it("should name a required key the deploy script never guards, and say the entry point refuses without it", () => {
    const source = `${A_REQUIRING_SOURCE}\nconst root = requireEnv(env, "BOT_API_ROOT");`;

    const said = requiredKeyComplaints(A_GUARDING_SCRIPT, source);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("would ship a config with no BOT_API_ROOT");
    expect(said[FIRST]).toContain("src/main.ts refuses to start without");
  });

  it("should read a required key with no space between the comma and the quote", () => {
    const source = 'const x = requireEnv(env,"NO_SPACE_KEY");';

    const said = requiredKeyComplaints(A_GUARDING_SCRIPT, source);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("would ship a config with no NO_SPACE_KEY");
  });

  it("should report every required key when the deploy script guards nothing at all", () => {
    const said = requiredKeyComplaints("# no REQUIRED_KEYS line here\n", A_REQUIRING_SOURCE);

    expect(said).toHaveLength(TWO);
    expect(said.some((line) => line.includes("no BOT_TOKEN"))).toBe(true);
    expect(said.some((line) => line.includes("no DB_PATH"))).toBe(true);
  });

  it("should not let a guarded key cover a required key that only starts with it", () => {
    const deployScript = 'REQUIRED_KEYS="BOT_TOKEN"\n';
    const source = 'const x = requireEnv(env, "BOT_TOKEN_TWO");';

    const said = requiredKeyComplaints(deployScript, source);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("would ship a config with no BOT_TOKEN_TWO");
  });

  it("should require REQUIRED_KEYS to sit at the true start of its line, not merely appear on one", () => {
    const deployScript = '#REQUIRED_KEYS="BOT_TOKEN"\n';
    const source = 'const bot = new Bot(requireEnv(env, "BOT_TOKEN"));';

    const said = requiredKeyComplaints(deployScript, source);

    expect(said).toHaveLength(ONE);
    expect(said[FIRST]).toContain("would ship a config with no BOT_TOKEN");
  });
});

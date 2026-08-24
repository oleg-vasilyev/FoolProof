import { basename, dirname } from "node:path";
import { FIRST_GROUP, SECOND_GROUP, read } from "./the-documents.ts";
import { filesIn, sourceFilesIn } from "./the-repository.ts";


const ENTRY_POINT = "src/main.ts";

const DEPLOY_SCRIPT = "deploy/configure-server.sh";

const ENV_TEMPLATE = ".env.example";

const SOURCE_ROOT = "src";

const A_REQUIRED_KEY = /requireEnv\([^,]+,\s*"([A-Z_]+)"\)/g;

const A_KEY_READ =
  /(?:requireEnv|optionalEnv)\([^,]+,\s*"([A-Z_][A-Z0-9_]*)"\)|process\.env(?:\.|\[")([A-Z_][A-Z0-9_]*)/g;

const A_FILLABLE_KEY = /^([A-Z_][A-Z0-9_]*)=/gm;

const THE_GUARDED_KEYS = /^REQUIRED_KEYS="([^"]*)"/m;

const BETWEEN_KEYS = " ";

const BETWEEN_FILES = "\n";

const sourceOfTheApp = (): string =>
  filesIn(SOURCE_ROOT)
    .filter((file) => sourceFilesIn(dirname(file)).includes(basename(file)))
    .map((file) => read(file))
    .join(BETWEEN_FILES);

const keysReadBySource = (source: string): ReadonlySet<string> =>
  new Set(
    [...source.matchAll(A_KEY_READ)].map((found) => found[FIRST_GROUP] ?? found[SECOND_GROUP] ?? "")
  );

const keysTheAppRefusesWithout = (source: string): ReadonlySet<string> =>
  new Set([...source.matchAll(A_REQUIRED_KEY)].map((found) => found[FIRST_GROUP] ?? ""));

export const requiredKeyComplaints = (deployScript: string, entryPoint: string): readonly string[] => {
  const guarded = new Set(
    (THE_GUARDED_KEYS.exec(deployScript)?.[FIRST_GROUP] ?? "").split(BETWEEN_KEYS)
  );

  return [...entryPoint.matchAll(A_REQUIRED_KEY)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .filter((key) => !guarded.has(key))
    .map(
      (key) =>
        `${DEPLOY_SCRIPT}: would ship a config with no ${key}, which ${ENTRY_POINT} refuses to start without`
    );
};

export const requiredKeysOutOfStep = (): readonly string[] =>
  requiredKeyComplaints(read(DEPLOY_SCRIPT), read(ENTRY_POINT));

export const envTemplateComplaints = (template: string, source: string): readonly string[] => {
  const asked = keysReadBySource(source);
  const refusedWithout = keysTheAppRefusesWithout(source);
  const fillable = new Set(
    [...template.matchAll(A_FILLABLE_KEY)].map((found) => found[FIRST_GROUP] ?? "")
  );

  return [
    ...[...asked]
      .filter((key) => !template.includes(key))
      .map(
        (key) =>
          `${ENV_TEMPLATE}: says nothing about ${key}, which the code reads — the file that ` +
          `lands on the server is the whole configuration of that run, so a key absent from ` +
          `the template is one the operator never learns to set`
      ),
    ...[...refusedWithout]
      .filter((key) => template.includes(key) && !fillable.has(key))
      .map(
        (key) =>
          `${ENV_TEMPLATE}: mentions ${key} but offers no "${key}=" line to fill in, and the ` +
          `bot refuses to start without it — a key only talked about is one a fresh copy of ` +
          `this file cannot carry`
      ),
    ...[...fillable]
      .filter((key) => !asked.has(key))
      .map(
        (key) =>
          `${ENV_TEMPLATE}: offers ${key} to be filled in, which nothing in ${SOURCE_ROOT}/ ` +
          `reads any more — a line somebody will set and wonder why it does nothing`
      ),
  ];
};

export const envTemplateOutOfStep = (): readonly string[] =>
  envTemplateComplaints(read(ENV_TEMPLATE), sourceOfTheApp());

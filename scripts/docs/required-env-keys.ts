import { FIRST_GROUP, read } from "./the-documents.ts";


const ENTRY_POINT = "src/main.ts";

const DEPLOY_SCRIPT = "deploy/configure-server.sh";

const A_REQUIRED_KEY = /requireEnv\([^,]+,\s*"([A-Z_]+)"\)/g;

const THE_GUARDED_KEYS = /^REQUIRED_KEYS="([^"]*)"/m;

const BETWEEN_KEYS = " ";

export const requiredKeysOutOfStep = (): readonly string[] => {
  const guarded = new Set(
    (THE_GUARDED_KEYS.exec(read(DEPLOY_SCRIPT))?.[FIRST_GROUP] ?? "").split(BETWEEN_KEYS)
  );

  return [...read(ENTRY_POINT).matchAll(A_REQUIRED_KEY)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .filter((key) => !guarded.has(key))
    .map(
      (key) =>
        `${DEPLOY_SCRIPT}: would ship a config with no ${key}, which ${ENTRY_POINT} refuses to start without`
    );
};

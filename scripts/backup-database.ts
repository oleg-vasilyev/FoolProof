import {
  chmodSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { gzipSync } from "node:zlib";
import { loadEnv, optionalEnv, requireEnv, rootDir } from "#shared/config/env.ts";


const DEFAULT_DB_PATH = "data/foolproof.dev.db";

const DEFAULT_BACKUP_DIR = "backups";

const SNAPSHOTS_KEPT = 14;

const NOTHING = 0;

const FIRST = 0;

const BYTES_IN_KB = 1024;

const OWNER_ONLY = 0o600;

const NOBODY_ELSE = 0o077;

const HEALTHY = "ok";

process.umask(NOBODY_ELSE);

const env = loadEnv();

const databaseFile = resolve(rootDir, optionalEnv(env, "DB_PATH") ?? DEFAULT_DB_PATH);

const backupDir = resolve(rootDir, optionalEnv(env, "BACKUP_DIR") ?? DEFAULT_BACKUP_DIR);

const stampOf = (moment: Date): string =>
  moment.toISOString().replaceAll(":", "-").split(".")[FIRST] ?? "";

const isSnapshot = (name: string): boolean =>
  name.startsWith("foolproof-") && name.endsWith(".db.gz");

const takeSnapshot = (into: string): void => {
  const live = new DatabaseSync(databaseFile, { readOnly: true });
  try {
    live.exec(`VACUUM INTO '${into.replaceAll("'", "''")}'`);
  } finally {
    live.close();
  }

  chmodSync(into, OWNER_ONLY);
};

const whatItHolds = (snapshot: string): string => {
  const copy = new DatabaseSync(snapshot, { readOnly: true });
  try {
    const health = copy.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    if (health.integrity_check !== HEALTHY) {
      throw new Error(`the snapshot is corrupt: ${String(health.integrity_check)}`);
    }

    const games = copy.prepare("SELECT count(*) AS tally FROM games").get() as { tally: number };
    const players = copy.prepare("SELECT count(*) AS tally FROM players").get() as { tally: number };

    return `${String(games.tally)} games, ${String(players.tally)} players`;
  } finally {
    copy.close();
  }
};

const forgetOldest = (): number => {
  const kept = readdirSync(backupDir).filter(isSnapshot).sort();
  const doomed = kept.slice(NOTHING, Math.max(NOTHING, kept.length - SNAPSHOTS_KEPT));
  for (const name of doomed) {
    rmSync(join(backupDir, name));
  }

  return doomed.length;
};

const sendToOperator = async (archive: string, caption: string): Promise<void> => {
  const token = requireEnv(env, "BOT_TOKEN");
  const chat = requireEnv(env, "OPERATOR_TG_ID");

  const form = new FormData();
  form.set("chat_id", chat);
  form.set("caption", caption);
  form.set("document", new Blob([readFileSync(archive)]), basename(archive));

  const answer = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: form,
  });

  const outcome = (await answer.json()) as { ok: boolean; description?: string };
  if (!outcome.ok) {
    throw new Error(`Telegram refused the backup: ${outcome.description ?? "no reason given"}`);
  }
};

mkdirSync(backupDir, { recursive: true });

const stamp = stampOf(new Date());

const plain = join(backupDir, `foolproof-${stamp}Z.db`);

takeSnapshot(plain);

const contents = whatItHolds(plain);

const archive = `${plain}.gz`;

writeFileSync(archive, gzipSync(readFileSync(plain)), { mode: OWNER_ONLY });
rmSync(plain);

const sizeInKb = Math.ceil(statSync(archive).size / BYTES_IN_KB);

const forgotten = forgetOldest();

await sendToOperator(archive, `FoolProof backup ${stamp}Z — ${contents}, ${String(sizeInKb)} KB`);

console.log(
  `backup: ${basename(archive)} — ${contents}, ${String(sizeInKb)} KB, sent to the operator, ` +
    `${String(forgotten)} older snapshot(s) forgotten`
);

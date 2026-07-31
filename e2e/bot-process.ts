import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";


const projectRoot = resolve(import.meta.dirname, "..");

const ENTRY = resolve(projectRoot, "src", "main.ts");

const FAKE_TOKEN = "424242:AAH-nothing-here-reaches-telegram";

const STOP_GRACE_MS = 3000;

export interface BotOptions {
  readonly apiRoot: string;
  readonly dbPath: string;
  readonly logLevel: string;
  readonly operatorTgId: string;
  readonly echo: boolean;
}

export interface BotProcess {
  stop(): Promise<void>;
  output(): string;
  alive(): boolean;
}

const collect = (child: ChildProcess, echo: boolean, lines: string[]): void => {
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      lines.push(text);

      if (echo) {
        process.stdout.write(
          text
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => `  bot │ ${line}\n`)
            .join("")
        );
      }
    });
  }
};

export const startBot = (options: BotOptions): BotProcess => {
  const lines: string[] = [];

  const child = spawn(process.execPath, [ENTRY], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      BOT_TOKEN: FAKE_TOKEN,
      BOT_API_ROOT: options.apiRoot,
      DB_PATH: options.dbPath,
      LOG_LEVEL: options.logLevel,
      OPERATOR_TG_ID: options.operatorTgId,
    },
  });

  let running = true;
  child.once("exit", () => {
    running = false;
  });

  collect(child, options.echo, lines);

  return {
    stop: async () => {
      if (!running) {
        return;
      }

      await new Promise<void>((done) => {
        const timer = setTimeout(done, STOP_GRACE_MS);

        child.once("exit", () => {
          clearTimeout(timer);
          done();
        });

        child.kill();
      });
    },

    output: () => lines.join(""),

    alive: () => running,
  };
};

import { vi } from "vitest";
import type { ChildProcess } from "node:child_process";


type Listener = (...args: readonly unknown[]) => void;


export class SpawnStub {
  public spawnSpy = vi.fn();
  public killSpy = vi.fn();

  private readonly listeners = new Map<string, Listener>();

  private running = { exitCode: null as number | null };

  public readonly module: { spawn: typeof import("node:child_process").spawn };

  public constructor() {
    this.spawnSpy.mockImplementation(() => this.child());

    this.module = {
      spawn: ((command: string, args: readonly string[], options: unknown) =>
        this.spawnSpy(command, args, options)) as typeof import("node:child_process").spawn,
    };
  }

  public commandGiven(): string | undefined {
    return this.spawnSpy.mock.calls[0]?.[0];
  }

  public argsGiven(): readonly string[] | undefined {
    return this.spawnSpy.mock.calls[0]?.[1];
  }

  public optionsGiven(): { stdio?: string } | undefined {
    return this.spawnSpy.mock.calls[0]?.[2];
  }

  public exitWith(code: number | null, signal: string | null = null): void {
    this.running.exitCode = code;
    this.listeners.get("exit")?.(code, signal);
  }

  public failWith(error: Error): void {
    this.listeners.get("error")?.(error);
  }

  private child(): ChildProcess {
    const running = { exitCode: null as number | null };

    this.running = running;

    return {
      get exitCode(): number | null {
        return running.exitCode;
      },
      on: (event: string, listener: Listener) => this.listeners.set(event, listener),
      kill: this.killSpy,
    } as unknown as ChildProcess;
  }
}

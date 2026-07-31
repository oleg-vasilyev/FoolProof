import { vi } from "vitest";


type CrashExitModule = typeof import("#shared/lifecycle/crash-exit.ts");


export class CrashExitStub {
  public installCrashExitSpy = vi.fn<CrashExitModule["installCrashExit"]>();

  public readonly module: CrashExitModule;

  public constructor() {
    this.module = { installCrashExit: (log) => this.installCrashExitSpy(log) };
  }

  public logGiven(): unknown {
    return this.installCrashExitSpy.mock.calls[0]?.[0];
  }
}

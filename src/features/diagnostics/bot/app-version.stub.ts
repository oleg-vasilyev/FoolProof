import { vi } from "vitest";


type AppVersionModule = typeof import("#diagnostics/bot/app-version.ts");

const STUB_VERSION = "9.9.9";

export class AppVersionStub {
  public appVersionSpy = vi.fn<AppVersionModule["appVersion"]>();

  public readonly version = STUB_VERSION;

  public readonly module: AppVersionModule;

  public constructor() {
    this.appVersionSpy.mockReturnValue(STUB_VERSION);

    this.module = { appVersion: () => this.appVersionSpy() };
  }
}

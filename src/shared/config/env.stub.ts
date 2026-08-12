import { vi } from "vitest";


type EnvModule = typeof import("#shared/config/env.ts");

const STUB_ROOT = "/repo";

export class EnvStub {
  public loadEnvSpy = vi.fn<EnvModule["loadEnv"]>();
  public requireEnvSpy = vi.fn<EnvModule["requireEnv"]>();
  public optionalEnvSpy = vi.fn<EnvModule["optionalEnv"]>();

  public readonly rootDir = STUB_ROOT;

  public readonly loaded: Record<string, string>;

  public readonly module: EnvModule;

  public constructor(loaded: Record<string, string> = {}) {
    this.loaded = loaded;
    this.loadEnvSpy.mockReturnValue(loaded);
    this.requireEnvSpy.mockReturnValue("");
    this.optionalEnvSpy.mockReturnValue(null);

    this.module = {
      rootDir: this.rootDir,
      loadEnv: () => this.loadEnvSpy(),
      requireEnv: (env, key) => this.requireEnvSpy(env, key),
      optionalEnv: (env, key) => this.optionalEnvSpy(env, key),
    };
  }
}

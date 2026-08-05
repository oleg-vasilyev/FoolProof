import { vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";


type LanguageFeatureModule = typeof import("#language/language-feature.ts");

export class LanguageFeatureStub {
  public createLanguageFeatureSpy = vi.fn<LanguageFeatureModule["createLanguageFeature"]>();

  public readonly feature: Feature;

  public readonly module: LanguageFeatureModule;

  public constructor() {
    this.feature = featureOf({ name: "language" });
    this.createLanguageFeatureSpy.mockReturnValue(this.feature);

    this.module = {
      createLanguageFeature: (deps) => this.createLanguageFeatureSpy(deps),
    };
  }

  public depsGiven(): Parameters<LanguageFeatureModule["createLanguageFeature"]>[0] | undefined {
    return this.createLanguageFeatureSpy.mock.calls[0]?.[0];
  }
}

import { vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";


type ScoresheetFeatureModule = typeof import("#scoresheet/scoresheet-feature.ts");

export class ScoresheetFeatureStub {
  public createScoresheetFeatureSpy = vi.fn<ScoresheetFeatureModule["createScoresheetFeature"]>();

  public readonly feature: Feature;

  public readonly module: ScoresheetFeatureModule;

  public constructor() {
    this.feature = featureOf({ name: "stats" });
    this.createScoresheetFeatureSpy.mockReturnValue(this.feature);

    this.module = {
      createScoresheetFeature: (deps) => this.createScoresheetFeatureSpy(deps),
    };
  }

  public depsGiven(): Parameters<ScoresheetFeatureModule["createScoresheetFeature"]>[0] | undefined {
    return this.createScoresheetFeatureSpy.mock.calls[0]?.[0];
  }
}

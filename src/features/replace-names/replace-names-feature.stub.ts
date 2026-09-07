import { vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";


type ReplaceNamesFeatureModule = typeof import("#replace-names/replace-names-feature.ts");

export class ReplaceNamesFeatureStub {
  public createReplaceNamesFeatureSpy = vi.fn<ReplaceNamesFeatureModule["createReplaceNamesFeature"]>();

  public readonly feature: Feature;

  public readonly module: ReplaceNamesFeatureModule;

  public constructor() {
    this.feature = featureOf({ name: "replace" });
    this.createReplaceNamesFeatureSpy.mockReturnValue(this.feature);

    this.module = {
      createReplaceNamesFeature: (deps) => this.createReplaceNamesFeatureSpy(deps),
    };
  }

  public depsGiven(): Parameters<ReplaceNamesFeatureModule["createReplaceNamesFeature"]>[0] | undefined {
    return this.createReplaceNamesFeatureSpy.mock.calls[0]?.[0];
  }
}

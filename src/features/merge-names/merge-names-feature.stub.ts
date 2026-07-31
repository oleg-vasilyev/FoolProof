import { vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";


type MergeNamesFeatureModule = typeof import("#merge-names/merge-names-feature.ts");

export class MergeNamesFeatureStub {
  public createMergeNamesFeatureSpy = vi.fn<MergeNamesFeatureModule["createMergeNamesFeature"]>();

  public readonly feature: Feature;

  public readonly module: MergeNamesFeatureModule;

  public constructor() {
    this.feature = featureOf({ name: "merge" });
    this.createMergeNamesFeatureSpy.mockReturnValue(this.feature);

    this.module = {
      createMergeNamesFeature: (deps) => this.createMergeNamesFeatureSpy(deps),
    };
  }

  public depsGiven(): Parameters<MergeNamesFeatureModule["createMergeNamesFeature"]>[0] | undefined {
    return this.createMergeNamesFeatureSpy.mock.calls[0]?.[0];
  }
}

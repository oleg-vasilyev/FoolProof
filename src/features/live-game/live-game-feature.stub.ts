import { vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";


type LiveGameFeatureModule = typeof import("#live-game/live-game-feature.ts");

export class LiveGameFeatureStub {
  public createLiveGameFeatureSpy = vi.fn<LiveGameFeatureModule["createLiveGameFeature"]>();
  public stopSpy = vi.fn(async (): Promise<void> => undefined);

  public readonly feature: Feature;

  public readonly module: LiveGameFeatureModule;

  public constructor() {
    this.feature = featureOf({ name: "game", stop: this.stopSpy });
    this.createLiveGameFeatureSpy.mockReturnValue(this.feature);

    this.module = {
      createLiveGameFeature: (deps) => this.createLiveGameFeatureSpy(deps),
    };
  }

  public depsGiven(): Parameters<LiveGameFeatureModule["createLiveGameFeature"]>[0] | undefined {
    return this.createLiveGameFeatureSpy.mock.calls[0]?.[0];
  }
}

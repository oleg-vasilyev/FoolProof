import { vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";


type DiagnosticsFeatureModule = typeof import("#diagnostics/diagnostics-feature.ts");

export class DiagnosticsFeatureStub {
  public createDiagnosticsFeatureSpy = vi.fn<DiagnosticsFeatureModule["createDiagnosticsFeature"]>();

  public readonly feature: Feature;

  public readonly module: DiagnosticsFeatureModule;

  public constructor() {
    this.feature = featureOf({ name: "status", hidden: true });
    this.createDiagnosticsFeatureSpy.mockReturnValue(this.feature);

    this.module = {
      createDiagnosticsFeature: (deps) => this.createDiagnosticsFeatureSpy(deps),
    };
  }

  public depsGiven(): Parameters<DiagnosticsFeatureModule["createDiagnosticsFeature"]>[0] | undefined {
    return this.createDiagnosticsFeatureSpy.mock.calls[0]?.[0];
  }
}

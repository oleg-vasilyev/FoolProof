import { vi } from "vitest";
import type { calculateMetrics } from "mutation-testing-metrics";


type Metrics = ReturnType<typeof calculateMetrics>["metrics"];

const A_SCORE = 90;

const KILLED = 9;

const SURVIVED = 1;

const NONE = 0;

export class MutationMetricsStub {
  public calculateMetricsSpy = vi.fn();

  public readonly module: typeof import("mutation-testing-metrics");

  public constructor() {
    this.scored({});

    this.module = {
      calculateMetrics: (files: unknown) => this.calculateMetricsSpy(files),
    } as unknown as typeof import("mutation-testing-metrics");
  }

  public scored(metrics: Partial<Metrics>): void {
    this.calculateMetricsSpy.mockReturnValue({
      metrics: {
        mutationScore: A_SCORE,
        totalValid: KILLED + SURVIVED,
        killed: KILLED,
        survived: SURVIVED,
        noCoverage: NONE,
        timeout: NONE,
        ...metrics,
      } as Metrics,
    });
  }
}

import { vi } from "vitest";
import type { RestartHistory } from "#shared/lifecycle/restart-policy.ts";


type RestartPolicyModule = typeof import("#shared/lifecycle/restart-policy.ts");


const NO_DELAY = 0;

const FIRST_CALL = 0;

export class RestartPolicyStub {
  public planRestartSpy = vi.fn<RestartPolicyModule["planRestart"]>();
  public describeDeathSpy = vi.fn<RestartPolicyModule["describeDeath"]>();

  public readonly noRuns: RestartHistory = { failures: 0, everRan: false };

  public readonly module: RestartPolicyModule;

  public constructor() {
    this.planRestartSpy.mockReturnValue({
      restart: false,
      reason: "stopped",
      delayMs: NO_DELAY,
      history: this.noRuns,
    });
    this.describeDeathSpy.mockReturnValue("");

    this.module = {
      NO_RUNS: this.noRuns,
      planRestart: (death, history, stopping) => this.planRestartSpy(death, history, stopping),
      describeDeath: (death) => this.describeDeathSpy(death),
    };
  }

  public deathGiven(): unknown {
    return this.planRestartSpy.mock.calls[FIRST_CALL]?.[0];
  }

  public historyGiven(call = FIRST_CALL): RestartHistory | undefined {
    return this.planRestartSpy.mock.calls[call]?.[1];
  }

  public stoppingGiven(call = FIRST_CALL): boolean | undefined {
    return this.planRestartSpy.mock.calls[call]?.[2];
  }
}

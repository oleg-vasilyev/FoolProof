import { vi } from "vitest";


type ApiCallTallyModule = typeof import("#shared/telegram/api-call-tally.ts");


const NOTHING = 0;

export class ApiCallTallyStub {
  public recordCallTroubleSpy = vi.fn<ApiCallTallyModule["recordCallTrouble"]>();
  public callTallySpy = vi.fn<ApiCallTallyModule["callTally"]>();

  public readonly module: ApiCallTallyModule;

  public constructor() {
    this.callTallySpy.mockReturnValue({
      retried: NOTHING,
      rateLimit: NOTHING,
      refusal: NOTHING,
    });

    this.module = {
      recordCallTrouble: (trouble) => this.recordCallTroubleSpy(trouble),
      callTally: () => this.callTallySpy(),
    };
  }

  public troublesRecorded(): readonly string[] {
    return this.recordCallTroubleSpy.mock.calls.map(([trouble]) => trouble);
  }
}

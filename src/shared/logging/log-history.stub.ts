import { vi } from "vitest";


type LogHistoryModule = typeof import("#shared/logging/log-history.ts");


const NOTHING = 0;

export class LogHistoryStub {
  public recordProblemSpy = vi.fn<LogHistoryModule["recordProblem"]>();
  public problemsSeenSpy = vi.fn<LogHistoryModule["problemsSeen"]>();
  public problemTallySpy = vi.fn<LogHistoryModule["problemTally"]>();

  public readonly module: LogHistoryModule;

  public constructor() {
    this.problemsSeenSpy.mockReturnValue([]);
    this.problemTallySpy.mockReturnValue({ warn: NOTHING, error: NOTHING });

    this.module = {
      recordProblem: (level, message) => this.recordProblemSpy(level, message),
      problemsSeen: () => this.problemsSeenSpy(),
      problemTally: () => this.problemTallySpy(),
    };
  }

  public levelGiven(): string | undefined {
    return this.recordProblemSpy.mock.calls[0]?.[0];
  }

  public messageGiven(): string | undefined {
    return this.recordProblemSpy.mock.calls[0]?.[1];
  }
}

import { vi } from "vitest";
import type { Logger } from "#shared/logging/logger.ts";


type LoggerModule = typeof import("#shared/logging/logger.ts");


export class LoggerStub implements Logger {
  public debugSpy = vi.fn();
  public infoSpy = vi.fn();
  public warnSpy = vi.fn();
  public errorSpy = vi.fn();

  public debug(message: string): void {
    this.debugSpy(message);
  }

  public info(message: string): void {
    this.infoSpy(message);
  }

  public warn(message: string): void {
    this.warnSpy(message);
  }

  public error(message: string): void {
    this.errorSpy(message);
  }
}

export class LoggingStub {
  public createLoggerSpy = vi.fn<LoggerModule["createLogger"]>();

  public readonly logger = new LoggerStub();

  public readonly module: LoggerModule;

  public constructor() {
    this.createLoggerSpy.mockReturnValue(this.logger);

    this.module = { createLogger: (scope) => this.createLoggerSpy(scope) };
  }

  public scopeGiven(): string | undefined {
    return this.createLoggerSpy.mock.calls[0]?.[0];
  }
}

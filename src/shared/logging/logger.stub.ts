import { vi } from "vitest";
import type { Logger } from "#shared/logging/logger.ts";


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

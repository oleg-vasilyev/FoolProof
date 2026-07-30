import { vi } from "vitest";
import type { CardService } from "#live-game/bot/card-service.ts";


const NOTHING_SWEPT = 0;

export class CardServiceStub {
  public openSpy = vi.fn();
  public tapSpy = vi.fn();
  public sweepIdleSpy = vi.fn();
  public shutdownSpy = vi.fn();

  public readonly service: CardService;

  public constructor() {
    this.openSpy.mockResolvedValue(undefined);
    this.tapSpy.mockResolvedValue("");
    this.sweepIdleSpy.mockResolvedValue(NOTHING_SWEPT);
    this.shutdownSpy.mockResolvedValue(undefined);

    this.service = {
      open: this.openSpy,
      tap: this.tapSpy,
      sweepIdle: this.sweepIdleSpy,
      shutdown: this.shutdownSpy,
    } as unknown as CardService;
  }
}

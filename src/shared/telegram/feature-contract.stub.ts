import { vi } from "vitest";
import type { CallbackTap, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";


export class ListenersStub implements Listeners {
  public onTextSpy = vi.fn((_run: (ctx: TextMessage) => Promise<void>) => undefined);
  public onTapSpy = vi.fn((_run: (ctx: CallbackTap) => Promise<void>) => undefined);

  public onText(run: (ctx: TextMessage) => Promise<void>): void {
    this.onTextSpy(run);
  }

  public onTap(run: (ctx: CallbackTap) => Promise<void>): void {
    this.onTapSpy(run);
  }

  public textListener(): ((ctx: TextMessage) => Promise<void>) | undefined {
    return this.onTextSpy.mock.calls[0]?.[0];
  }

  public tapListener(): ((ctx: CallbackTap) => Promise<void>) | undefined {
    return this.onTapSpy.mock.calls[0]?.[0];
  }
}

export const featureOf = (
  over: Partial<Feature> & { readonly name?: string } = {}
): Feature => {
  const name = over.name ?? "thing";

  return {
    commands: [
      {
        command: name,
        menuDescription: `does ${name}`,
        help: `/${name} — does it`,
        run: vi.fn(async () => undefined),
      },
    ],
    ...over,
  };
};

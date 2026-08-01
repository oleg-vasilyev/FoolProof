import { vi } from "vitest";
import type { CallbackTap, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";


const FIRST_LISTENER = 0;

export class ListenersStub implements Listeners {
  public onTextSpy = vi.fn((_run: (ctx: TextMessage) => Promise<void>) => undefined);
  public onTapSpy = vi.fn(
    (_owns: RegExp, _run: (ctx: CallbackTap) => Promise<void>) => undefined
  );

  public onText(run: (ctx: TextMessage) => Promise<void>): void {
    this.onTextSpy(run);
  }

  public onTap(owns: RegExp, run: (ctx: CallbackTap) => Promise<void>): void {
    this.onTapSpy(owns, run);
  }

  public textListener(): ((ctx: TextMessage) => Promise<void>) | undefined {
    return this.onTextSpy.mock.calls[0]?.[0];
  }

  public tapListener(registered = FIRST_LISTENER): ((ctx: CallbackTap) => Promise<void>) | undefined {
    return this.onTapSpy.mock.calls[registered]?.[1];
  }

  public tapPattern(registered = FIRST_LISTENER): RegExp | undefined {
    return this.onTapSpy.mock.calls[registered]?.[0];
  }
}

export const featureOf = (
  over: Partial<Feature> & { readonly name?: string; readonly hidden?: boolean } = {}
): Feature => {
  const name = over.name ?? "thing";

  return {
    commands: [
      {
        command: name,
        menuDescription: `does ${name}`,
        help: `/${name} — does it`,
        hidden: over.hidden,
        run: vi.fn(async () => undefined),
      },
    ],
    ...over,
  };
};

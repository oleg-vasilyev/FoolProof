import { vi } from "vitest";


type BotClientOptionsModule = typeof import("#shared/telegram/bot-client-options.ts");


export class BotClientOptionsStub {
  public botClientOptionsSpy = vi.fn<BotClientOptionsModule["botClientOptions"]>();

  public readonly module: BotClientOptionsModule;

  public constructor() {
    this.botClientOptionsSpy.mockReturnValue(undefined);

    this.module = {
      botClientOptions: (env, log) => this.botClientOptionsSpy(env, log),
    };
  }

  public envGiven(): unknown {
    return this.botClientOptionsSpy.mock.calls[0]?.[0];
  }

  public logGiven(): unknown {
    return this.botClientOptionsSpy.mock.calls[0]?.[1];
  }
}

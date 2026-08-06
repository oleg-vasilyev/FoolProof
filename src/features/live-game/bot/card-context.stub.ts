import { vi } from "vitest";


type CardContextModule = typeof import("#live-game/bot/card-context.ts");

export class CardContextStub {
  public copyForSpy = vi.fn<CardContextModule["copyFor"]>();
  public commandTextSpy = vi.fn<CardContextModule["commandText"]>();
  public refusedBecauseLiveSpy = vi.fn<CardContextModule["refusedBecauseLive"]>();
  public askForNamesSpy = vi.fn<CardContextModule["askForNames"]>();

  public readonly module: CardContextModule;

  public constructor() {
    this.commandTextSpy.mockReturnValue("");
    this.refusedBecauseLiveSpy.mockResolvedValue(false);
    this.askForNamesSpy.mockResolvedValue(undefined);

    this.module = {
      copyFor: (context, chatId) => this.copyForSpy(context, chatId),
      commandText: (ctx) => this.commandTextSpy(ctx),
      refusedBecauseLive: (copy, context, ctx) => this.refusedBecauseLiveSpy(copy, context, ctx),
      askForNames: (context, ctx, question, placeholder) =>
        this.askForNamesSpy(context, ctx, question, placeholder),
    };
  }
}

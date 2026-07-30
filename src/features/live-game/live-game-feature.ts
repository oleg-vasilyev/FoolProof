import type { Api } from "grammy";
import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { Logger } from "#shared/logging/logger.ts";
import type { CardRepository } from "#shared/repository/repository-contract.ts";
import { copy } from "#live-game/copy.en.ts";
import { createCardService } from "#live-game/bot/card-service.ts";
import { onGame, onNamesReply, onNext, onTap, type CardContext } from "#live-game/bot/update-handlers.ts";
import { createPromptRegistry } from "#live-game/bot/prompt-registry.ts";
import { startIdleSweep } from "#live-game/bot/idle-sweep.ts";


export interface LiveGameDeps {
  readonly repo: CardRepository;
  readonly api: Api;
  readonly log: Logger;
}

export const createLiveGameFeature = (deps: LiveGameDeps): Feature => {
  const { repo, api, log } = deps;
  const cards = createCardService({ repo, api, log });

  const context: CardContext = {
    repo,
    cards,
    prompts: createPromptRegistry(api, log),
  };

  const stopSweep = startIdleSweep(cards, log);

  return {
    commands: [
      {
        command: "game",
        menuDescription: copy.commandGame,
        help: copy.helpGame,
        run: (ctx) => onGame(context, ctx),
      },
      {
        command: "next",
        menuDescription: copy.commandNext,
        help: copy.helpNext,
        run: (ctx) => onNext(context, ctx),
      },
    ],

    notes: copy.helpCard,

    listen: (listeners: Listeners) => {
      listeners.onText((ctx) => onNamesReply(context, ctx));
      listeners.onTap((ctx) => onTap(context, ctx));
    },

    stop: async () => {
      stopSweep();
      await cards.shutdown();
    },
  };
};

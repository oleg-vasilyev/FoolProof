import type { Api } from "grammy";
import type { Feature, Listeners } from "../../../shared/feature.ts";
import type { Logger } from "../../../shared/logger.ts";
import type { CardRepository } from "../../../shared/repository/types.ts";
import { strings } from "../strings.ts";
import { createCardService } from "./cards.ts";
import { onGame, onNamesReply, onNext, onTap, type CardContext } from "./handlers.ts";
import { createPromptRegistry } from "./prompts.ts";
import { startReaper } from "./reaper.ts";


export interface CardDeps {
  readonly repo: CardRepository;
  readonly api: Api;
  readonly log: Logger;
}

export const createCardFeature = (deps: CardDeps): Feature => {
  const { repo, api, log } = deps;
  const cards = createCardService({ repo, api, log });

  const context: CardContext = {
    repo,
    cards,
    prompts: createPromptRegistry(api, log),
  };

  const stopReaper = startReaper(cards, log);

  return {
    commands: [
      {
        command: "game",
        menuDescription: strings.commandGame,
        help: strings.helpGame,
        run: (ctx) => onGame(context, ctx),
      },
      {
        command: "next",
        menuDescription: strings.commandNext,
        help: strings.helpNext,
        run: (ctx) => onNext(context, ctx),
      },
    ],

    notes: strings.helpCard,

    listen: (listeners: Listeners) => {
      listeners.onText((ctx) => onNamesReply(context, ctx));
      listeners.onTap((ctx) => onTap(context, ctx));
    },

    stop: async () => {
      stopReaper();
      await cards.shutdown();
    },
  };
};

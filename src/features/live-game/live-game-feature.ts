import type { Api } from "grammy";
import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { Logger } from "#shared/logging/logger.ts";
import type { CardRepository } from "#shared/repository/repository-contract.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { copyIn } from "#live-game/copy.ts";
import { createCardService } from "#live-game/bot/card/card-service.ts";
import type { CardContext } from "#live-game/bot/card-context.ts";
import { onGame } from "#live-game/bot/lineup/lineup-from-names.ts";
import { onNext, onNextWith, onNextWithout } from "#live-game/bot/lineup/lineup-from-last-game.ts";
import { onNamesReply } from "#live-game/bot/lineup/names-reply.ts";
import { onTap } from "#live-game/bot/card/tap-handler.ts";
import { onReopen } from "#live-game/bot/card/reopen-handler.ts";
import { onSeatingTap } from "#live-game/bot/seating-screen.ts";
import { onLeavingTap } from "#live-game/bot/leaving-screen.ts";
import type { PromptRegistry } from "#shared/telegram/prompt-registry.ts";
import { CARD_TAPS } from "#live-game/render/callback-data-codec.ts";
import { SEATING_TAPS } from "#live-game/render/seating-screen/seating-callback-codec.ts";
import { LEAVING_TAPS } from "#live-game/render/leaving-screen/leaving-callback-codec.ts";
import { startIdleSweep } from "#live-game/bot/card/idle-sweep.ts";


const NOTHING_LIVE = 0;

export interface LiveGameDeps {
  readonly repo: CardRepository;
  readonly api: Api;
  readonly log: Logger;
  readonly localeIn: LocaleReader;
  readonly prompts: PromptRegistry;
}

export const createLiveGameFeature = (deps: LiveGameDeps): Feature => {
  const { repo, api, log, localeIn, prompts } = deps;
  const cards = createCardService({ repo, api, log, localeIn });

  const context: CardContext = {
    repo,
    cards,
    prompts,
    localeIn,
  };

  const stopSweep = startIdleSweep(cards, log);

  return {
    commands: [
      {
        command: "game",
        menuDescription: (locale) => copyIn(locale).commandGame,
        help: (locale) => copyIn(locale).helpGame,
        run: (ctx) => onGame(context, ctx),
      },
      {
        command: "next",
        menuDescription: (locale) => copyIn(locale).commandNext,
        help: (locale) => copyIn(locale).helpNext,
        run: (ctx) => onNext(context, ctx),
      },
      {
        command: "next_with",
        menuDescription: (locale) => copyIn(locale).commandNextWith,
        help: (locale) => copyIn(locale).helpNextWith,
        run: (ctx) => onNextWith(context, ctx),
      },
      {
        command: "next_without",
        menuDescription: (locale) => copyIn(locale).commandNextWithout,
        help: (locale) => copyIn(locale).helpNextWithout,
        run: (ctx) => onNextWithout(context, ctx),
      },
      {
        command: "reopen",
        menuDescription: (locale) => copyIn(locale).commandReopen,
        help: (locale) => copyIn(locale).helpReopen,
        run: (ctx) => onReopen(context, ctx),
      },
    ],

    notes: (locale) => copyIn(locale).helpCard,

    listen: (listeners: Listeners) => {
      listeners.onText((ctx) => onNamesReply(context, ctx));
      listeners.onTap(CARD_TAPS, (ctx) => onTap(context, ctx));
      listeners.onTap(SEATING_TAPS, (ctx) => onSeatingTap(context, ctx));
      listeners.onTap(LEAVING_TAPS, (ctx) => onLeavingTap(context, ctx));
    },

    resume: async () => {
      const redrawn = await cards.redrawLive();

      if (redrawn > NOTHING_LIVE) {
        log.info(`${redrawn} card(s) were still live, redrawing them`);
      }
    },

    stop: async () => {
      stopSweep();
      await cards.shutdown();
    },
  };
};

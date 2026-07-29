import { Bot, type Api } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import type { Logger } from "../../shared/logger.ts";
import type { Repository } from "../../shared/repository/types.ts";
import { strings } from "../render/strings.ts";
import { createCardService, type CardService } from "./cards.ts";
import {
  onGame,
  onHelp,
  onNamesReply,
  onNext,
  onStats,
  onTap,
  type BotContext,
} from "./handlers.ts";
import { createPromptRegistry } from "./prompts.ts";


export interface BotDeps {
  readonly repo: Repository;
  readonly log: Logger;
  readonly botInfo?: UserFromGetMe;
}

export interface BotBundle {
  readonly bot: Bot;
  readonly cards: CardService;
}

const COMMAND_MENU = [
  { command: "game", description: strings.commandGame },
  { command: "next", description: strings.commandNext },
  { command: "stats", description: strings.commandStats },
  { command: "help", description: strings.commandHelp },
];

export async function publishCommandMenu(api: Api): Promise<void> {
  await api.setMyCommands(COMMAND_MENU);
}

export function createBot(token: string, deps: BotDeps): BotBundle {
  const { repo, log, botInfo } = deps;
  const bot = new Bot(token, botInfo === undefined ? {} : { botInfo });
  const cards = createCardService({ repo, api: bot.api, log });

  const context: BotContext = {
    repo,
    cards,
    prompts: createPromptRegistry(bot.api, log),
  };

  bot.command("game", (ctx) => onGame(context, ctx));
  bot.command("next", (ctx) => onNext(context, ctx));
  bot.command("stats", (ctx) => onStats(context, ctx));
  bot.command("help", (ctx) => onHelp(ctx));

  bot.on("message:text", (ctx) => onNamesReply(context, ctx));
  bot.on("callback_query:data", (ctx) => onTap(context, ctx));

  bot.catch((error) => {
    log.error(`update ${error.ctx.update.update_id} failed: ${String(error.error)}`);
  });

  return { bot, cards };
}

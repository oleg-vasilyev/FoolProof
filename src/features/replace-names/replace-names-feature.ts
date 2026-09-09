import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { ReplaceRepository } from "#shared/repository/repository-contract.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import type { PromptRegistry } from "#shared/telegram/prompt-registry.ts";
import { copyIn } from "#replace-names/copy.ts";
import {
  onNamesReply,
  onReplace,
  onTap,
  type ReplaceContext,
} from "#replace-names/bot/replace-handler.ts";
import { REPLACE_TAPS } from "#replace-names/render/replace-callback-codec.ts";


export interface ReplaceNamesDeps {
  readonly repo: ReplaceRepository;
  readonly localeIn: LocaleReader;
  readonly prompts: PromptRegistry;
}

export const createReplaceNamesFeature = (deps: ReplaceNamesDeps): Feature => {
  const context: ReplaceContext = { repo: deps.repo, localeIn: deps.localeIn, prompts: deps.prompts };

  return {
    commands: [
      {
        command: "replace",
        menuDescription: (locale) => copyIn(locale).commandReplace,
        help: (locale) => copyIn(locale).helpReplace,
        run: (ctx) => onReplace(context, ctx),
      },
    ],

    listen: (listeners: Listeners) => {
      listeners.onText((ctx) => onNamesReply(context, ctx));
      listeners.onTap(REPLACE_TAPS, (ctx) => onTap(context, ctx));
    },
  };
};

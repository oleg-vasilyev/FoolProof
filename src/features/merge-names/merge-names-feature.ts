import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { RosterRepository } from "#shared/repository/repository-contract.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { copyIn } from "#merge-names/copy.ts";
import { onMerge, onTap, type MergeContext } from "#merge-names/bot/merge-handler.ts";
import { MERGE_TAPS } from "#merge-names/render/merge-callback-codec.ts";


export interface MergeNamesDeps {
  readonly repo: RosterRepository;
  readonly localeIn: LocaleReader;
}

export const createMergeNamesFeature = (deps: MergeNamesDeps): Feature => {
  const context: MergeContext = { repo: deps.repo, localeIn: deps.localeIn };

  return {
    commands: [
      {
        command: "merge",
        menuDescription: (locale) => copyIn(locale).commandMerge,
        help: (locale) => copyIn(locale).helpMerge,
        run: (ctx) => onMerge(context, ctx),
      },
    ],

    listen: (listeners: Listeners) => {
      listeners.onTap(MERGE_TAPS, (ctx) => onTap(context, ctx));
    },
  };
};

import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { RosterRepository } from "#shared/repository/repository-contract.ts";
import { copy } from "#merge-names/copy.en.ts";
import { onMerge, onTap, type MergeContext } from "#merge-names/bot/merge-handler.ts";
import { MERGE_TAPS } from "#merge-names/render/merge-callback-codec.ts";


export interface MergeNamesDeps {
  readonly repo: RosterRepository;
}

export const createMergeNamesFeature = (deps: MergeNamesDeps): Feature => {
  const context: MergeContext = { repo: deps.repo };

  return {
    commands: [
      {
        command: "merge",
        menuDescription: copy.commandMerge,
        help: copy.helpMerge,
        run: (ctx) => onMerge(context, ctx),
      },
    ],

    listen: (listeners: Listeners) => {
      listeners.onTap(MERGE_TAPS, (ctx) => onTap(context, ctx));
    },
  };
};

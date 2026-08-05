import type { Feature } from "#shared/telegram/feature-contract.ts";
import type { ScoresheetRepository } from "#shared/repository/repository-contract.ts";
import { copy } from "#scoresheet/copy.en.ts";
import {
  onAwards,
  onChronology,
  onStats,
  type ScoresheetContext,
} from "#scoresheet/bot/stats-handler.ts";
import { requireFonts } from "#scoresheet/bot/rasterizer.ts";


export interface ScoresheetDeps {
  readonly repo: ScoresheetRepository;
}

export const createScoresheetFeature = (deps: ScoresheetDeps): Feature => {
  requireFonts();

  const context: ScoresheetContext = { repo: deps.repo };

  return {
    commands: [
      {
        command: "stats",
        menuDescription: copy.commandStats,
        help: copy.helpStats,
        run: (ctx) => onStats(context, ctx),
      },
      {
        command: "stats_chronology",
        menuDescription: copy.commandChronology,
        help: copy.helpChronology,
        run: (ctx) => onChronology(context, ctx),
      },
      {
        command: "stats_awards",
        menuDescription: copy.commandAwards,
        help: copy.helpAwards,
        run: (ctx) => onAwards(context, ctx),
      },
    ],
  };
};

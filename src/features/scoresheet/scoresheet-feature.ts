import type { Feature } from "#shared/telegram/feature-contract.ts";
import type { ScoresheetRepository } from "#shared/repository/repository-contract.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { copyIn } from "#scoresheet/copy.ts";
import {
  onAwards,
  onChronology,
  onStats,
  type ScoresheetContext,
} from "#scoresheet/bot/stats-handler.ts";
import { requireFonts } from "#scoresheet/bot/rasterizer.ts";


export interface ScoresheetDeps {
  readonly repo: ScoresheetRepository;
  readonly localeIn: LocaleReader;
}

export const createScoresheetFeature = (deps: ScoresheetDeps): Feature => {
  requireFonts();

  const context: ScoresheetContext = { repo: deps.repo, localeIn: deps.localeIn };

  return {
    commands: [
      {
        command: "stats",
        menuDescription: (locale) => copyIn(locale).commandStats,
        help: (locale) => copyIn(locale).helpStats,
        run: (ctx) => onStats(context, ctx),
      },
      {
        command: "stats_chronology",
        menuDescription: (locale) => copyIn(locale).commandChronology,
        help: (locale) => copyIn(locale).helpChronology,
        run: (ctx) => onChronology(context, ctx),
      },
      {
        command: "stats_awards",
        menuDescription: (locale) => copyIn(locale).commandAwards,
        help: (locale) => copyIn(locale).helpAwards,
        run: (ctx) => onAwards(context, ctx),
      },
    ],
  };
};

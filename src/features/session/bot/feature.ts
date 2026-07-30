import type { Feature } from "../../../shared/feature.ts";
import type { SessionRepository } from "../../../shared/repository/types.ts";
import { strings } from "../strings.ts";
import { onStats, type SessionContext } from "./handlers.ts";
import { requireFonts } from "./image.ts";


export interface SessionDeps {
  readonly repo: SessionRepository;
}

export const createSessionFeature = (deps: SessionDeps): Feature => {
  requireFonts();

  const context: SessionContext = { repo: deps.repo };

  return {
    commands: [
      {
        command: "stats",
        menuDescription: strings.commandStats,
        help: strings.helpStats,
        run: (ctx) => onStats(context, ctx),
      },
    ],
  };
};

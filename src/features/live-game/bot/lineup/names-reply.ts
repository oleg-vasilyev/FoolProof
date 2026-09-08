import type { TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { LOCALES } from "#shared/locale/locales.ts";
import { answeredPromptText } from "#shared/telegram/force-reply-prompt.ts";
import { copyIn } from "#live-game/copy.ts";
import { copyFor, refusedBecauseLive, type CardContext } from "#live-game/bot/card-context.ts";
import { openFromNames } from "#live-game/bot/lineup/lineup-from-names.ts";
import { joinFromNames } from "#live-game/bot/lineup/lineup-from-last-game.ts";


const Answered = {
  Lineup: "lineup",
  Joiners: "joiners",
} as const;

type Answered = (typeof Answered)[keyof typeof Answered];

const promptsIn = (locale: (typeof LOCALES)[number]): readonly (readonly [string, Answered])[] => {
  const copy = copyIn(locale);

  return [
    [copy.lineupPrompt, Answered.Lineup],
    [copy.joinersPrompt, Answered.Joiners],
  ];
};

const ANSWERED_BY = new Map<string, Answered>(LOCALES.flatMap(promptsIn));

const askedIn = (text: string | null): Answered | null =>
  text === null ? null : (ANSWERED_BY.get(text) ?? null);

export const onNamesReply = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const answered = askedIn(answeredPromptText(ctx));
  if (answered === null) {
    return;
  }

  context.prompts.forget(ctx.chat.id);

  if (await refusedBecauseLive(copyFor(context, ctx.chat.id), context, ctx)) {
    return;
  }

  switch (answered) {
    case Answered.Lineup:
      await openFromNames(context, ctx, ctx.message.text);

      return;

    case Answered.Joiners:
      await joinFromNames(context, ctx);
  }
};

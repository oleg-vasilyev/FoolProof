import type { TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { LOCALES } from "#shared/locale/locales.ts";
import { copyIn } from "#live-game/copy.ts";
import { copyFor, refusedBecauseLive, type CardContext } from "#live-game/bot/card-context.ts";
import { openFromNames } from "#live-game/bot/lineup/lineup-from-names.ts";
import { joinFromNames, leaveFromNames } from "#live-game/bot/lineup/lineup-from-last-game.ts";


const Answered = {
  Lineup: "lineup",
  Joiners: "joiners",
  Leavers: "leavers",
} as const;

type Answered = (typeof Answered)[keyof typeof Answered];

const promptsIn = (locale: (typeof LOCALES)[number]): readonly (readonly [string, Answered])[] => {
  const copy = copyIn(locale);

  return [
    [copy.lineupPrompt, Answered.Lineup],
    [copy.joinersPrompt, Answered.Joiners],
    [copy.leaversPrompt, Answered.Leavers],
  ];
};

const ANSWERED_BY = new Map<string, Answered>(LOCALES.flatMap(promptsIn));

const askedIn = (text: string | undefined): Answered | null =>
  ANSWERED_BY.get(text ?? "") ?? null;

export const onNamesReply = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const prompt = ctx.message.reply_to_message;
  if (prompt?.from?.id !== ctx.me.id) {
    return;
  }

  const answered = askedIn(prompt.text);
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

      return;

    case Answered.Leavers:
      await leaveFromNames(context, ctx);
  }
};

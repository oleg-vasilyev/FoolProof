import type { TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { copy } from "#live-game/copy.en.ts";
import { refusedBecauseLive, type CardContext } from "#live-game/bot/card-context.ts";
import { openFromNames } from "#live-game/bot/opening/lineup-from-names.ts";
import { joinFromNames, leaveFromNames } from "#live-game/bot/opening/lineup-from-last-game.ts";


type Answered = "lineup" | "joiners" | "leavers";

const PROMPT_OF: Record<Answered, string> = {
  lineup: copy.lineupPrompt,
  joiners: copy.joinersPrompt,
  leavers: copy.leaversPrompt,
};

const ANSWERED_BY = new Map<string, Answered>(
  Object.entries(PROMPT_OF).map(([answered, question]) => [question, answered as Answered])
);

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

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  switch (answered) {
    case "lineup":
      await openFromNames(context, ctx, ctx.message.text);

      return;

    case "joiners":
      await joinFromNames(context, ctx);

      return;

    case "leavers":
      await leaveFromNames(context, ctx);
  }
};

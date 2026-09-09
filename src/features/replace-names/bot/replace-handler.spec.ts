import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionKind, Refusal } from "#replace-names/domain/replace-states.ts";
import { NameProblem } from "#shared/table/name-problems.ts";
import { LONGEST_NAME } from "#shared/table/table-limits.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { InlineKeyboardStub } from "#shared/telegram/inline-keyboard.stub.ts";
import { ForceReplyPromptStub, PROMPT_MESSAGE_ID } from "#shared/telegram/force-reply-prompt.stub.ts";
import { PromptRegistryStub } from "#shared/telegram/prompt-registry.stub.ts";
import { DEFAULT_LOCALE, Locale } from "#shared/locale/locales.ts";
import type { Evening, PlayerRecord, PlayerTally } from "#shared/repository/repository-contract.ts";
import type { Payload, Replacement } from "#replace-names/domain/replace-plan.ts";
import { copy } from "#replace-names/copy.en.ts";
import { copy as russian } from "#replace-names/copy.ru.ts";
import { CHAT_ID, ContextStub } from "#replace-names/bot/grammy-context.stub.ts";


const keyboards = new InlineKeyboardStub();

const prompts = new ForceReplyPromptStub();

vi.mock("#shared/telegram/force-reply-prompt.ts", () => prompts.module);

const parseNameListSpy = vi.fn();

const planReplacementSpy = vi.fn();

const recheckSpy = vi.fn();

const decodeReplaceCallbackSpy = vi.fn();

const renderReplaceKeyboardSpy = vi.fn();

const renderProposalSpy = vi.fn();

const renderReplacedSpy = vi.fn();

const renderCancelledSpy = vi.fn();

const eveningDateSpy = vi.fn();

const copyInSpy = vi.fn();

vi.mock("#shared/table/name-list.ts", () => ({
  parseNameList: (text: unknown) => parseNameListSpy(text),
}));

vi.mock("#replace-names/domain/replace-plan.ts", () => ({
  planReplacement: (evening: unknown, roster: unknown, names: unknown) =>
    planReplacementSpy(evening, roster, names),
  recheck: (evening: unknown, roster: unknown, payload: unknown) =>
    recheckSpy(evening, roster, payload),
}));

vi.mock("#replace-names/render/replace-callback-codec.ts", () => ({
  decodeReplaceCallback: (data: unknown) => decodeReplaceCallbackSpy(data),
}));

vi.mock("#replace-names/render/replace-keyboard.ts", () => ({
  renderReplaceKeyboard: (table: unknown, payload: unknown) =>
    renderReplaceKeyboardSpy(table, payload),
}));

vi.mock("#replace-names/render/replace-message.ts", () => ({
  renderProposal: (table: unknown, plan: unknown) => renderProposalSpy(table, plan),
  renderReplaced: (table: unknown, plan: unknown) => renderReplacedSpy(table, plan),
  renderCancelled: (table: unknown) => renderCancelledSpy(table),
}));

vi.mock("#replace-names/render/evening-date.ts", () => ({
  eveningDate: (table: unknown, isoDate: unknown) => eveningDateSpy(table, isoDate),
}));

vi.mock("#shared/telegram/inline-keyboard.ts", () => keyboards.module);

vi.mock("#replace-names/copy.ts", () => ({
  copyIn: (locale: unknown) => copyInSpy(locale),
}));

const { onNamesReply, onReplace, onTap } = await import("#replace-names/bot/replace-handler.ts");

const ONCE = 1;

const FIRST = 0;

const NEVER = 0;

const FIRST_GAME_ID = 41;

const SECOND_GAME_ID = 42;

const ROMA_ID = 7;

const ROMANI_ID = 13;

const CREATED_ID = 29;

const WRITTEN = "Roma";

const PLAYED = "Romani";

const TYPED = "Roma, Romani";

const NAMES = [WRITTEN, PLAYED];

const TOO_LONG = ["Romanovich-the-longest"];

const STARTED_ON = "2026-09-05";

const DATE = "the-date";

const TAP_DATA = "the-tap-data";

const PROPOSAL = "the-proposal";

const REPLACED = "the-replaced-body";

const CANCELLED = "the-cancelled-body";

const KEYBOARD = [[{ text: "a-button", callback_data: "a" }]];

const MARKUP = { inline_keyboard: [[{ text: "converted", callback_data: "converted" }]] };

const LIVE_CARD = { game: { message_id: 1 } };

const ROMA: PlayerTally = { playerId: ROMA_ID, displayName: WRITTEN, games: 2 };

const ROMANI: PlayerRecord = { id: ROMANI_ID, chat_id: CHAT_ID, display_name: PLAYED };

const CREATED: PlayerRecord = { id: CREATED_ID, chat_id: CHAT_ID, display_name: PLAYED };

const EVENING: Evening = {
  startedOn: STARTED_ON,
  firstGameId: FIRST_GAME_ID,
  gameIds: [FIRST_GAME_ID, SECOND_GAME_ID],
  players: [ROMA],
};

const ROSTER = [ROMANI];

const PAYLOAD: Payload = { firstGameId: FIRST_GAME_ID, fromId: ROMA_ID, toId: ROMANI_ID };

const planWith = (playerId: number | null): Replacement => ({
  evening: EVENING,
  leaving: ROMA,
  arriving: { playerId, displayName: PLAYED },
});

const refusedBy = (because: string) => ({ ok: false, because });

const refusedOnTheEvening = (because: string) => ({
  ok: false,
  because,
  evening: EVENING,
  written: WRITTEN,
  played: PLAYED,
});

describe("replace-handler", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;
  let locales: LocaleReaderStub;
  let registry: PromptRegistryStub;

  const context = () => ({ repo, localeIn: locales.read, prompts: registry.registry });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    ctx = new ContextStub();
    locales = new LocaleReaderStub(Locale.Ru);
    registry = new PromptRegistryStub();

    repo.latestEveningSpy.mockReturnValue(EVENING);
    repo.playersInChatSpy.mockReturnValue(ROSTER);
    repo.createPlayerSpy.mockReturnValue(CREATED);
    parseNameListSpy.mockReturnValue({ ok: true, names: NAMES });
    planReplacementSpy.mockReturnValue({ ok: true, plan: planWith(ROMANI_ID) });
    recheckSpy.mockReturnValue({ ok: true, evening: EVENING, leaving: ROMA, arriving: ROMANI });
    decodeReplaceCallbackSpy.mockReturnValue({ payload: PAYLOAD, action: ActionKind.Confirm });
    copyInSpy.mockReturnValue(copy);
    renderProposalSpy.mockReturnValue(PROPOSAL);
    renderReplacedSpy.mockReturnValue(REPLACED);
    renderCancelledSpy.mockReturnValue(CANCELLED);
    renderReplaceKeyboardSpy.mockReturnValue(KEYBOARD);
    eveningDateSpy.mockReturnValue(DATE);
    keyboards.toMarkupSpy.mockReturnValue(MARKUP);
  });

  describe("onReplace()", () => {
    it("should speak the chat's own language", async () => {
      await onReplace(context(), ctx.command(TYPED));

      expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
      expect(copyInSpy).toHaveBeenCalledWith(Locale.Ru);
    });

    describe("while a game is being played", () => {
      beforeEach(() => {
        repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);
      });

      it("should refuse", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(repo.liveCardInChatSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(ctx.lastReply().text).toBe(copy.gameRunning);
      });

      it("should not even read the names", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.replySpy).toHaveBeenCalledTimes(ONCE);
        expect(parseNameListSpy).not.toHaveBeenCalled();
      });
    });

    describe("names it cannot read", () => {
      it("should hand the text after the command to the parser", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(parseNameListSpy).toHaveBeenCalledWith(TYPED);
      });

      it("should ask for the names with a prompt that opens the reply box when none came", async () => {
        parseNameListSpy.mockReturnValue({ ok: false, problem: NameProblem.Empty });
        const command = ctx.command();

        await onReplace(context(), command);

        expect(prompts.askAsReplySpy).toHaveBeenCalledWith(
          command,
          copy.askNamesPrompt,
          copy.askNamesPlaceholder
        );
        expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should remember the question it asked, so the next command can take it back", async () => {
        parseNameListSpy.mockReturnValue({ ok: false, problem: NameProblem.Empty });

        await onReplace(context(), ctx.command());

        expect(registry.rememberSpy).toHaveBeenCalledWith(CHAT_ID, PROMPT_MESSAGE_ID);
      });

      it("should remember nothing when it did not ask", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(registry.rememberSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should say the same name twice replaces nothing", async () => {
        parseNameListSpy.mockReturnValue({
          ok: false,
          problem: NameProblem.Duplicates,
          names: [WRITTEN],
        });

        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.lastReply().text).toBe(copy.sameName);
      });

      it("should name the names that ran too long, with the limit", async () => {
        parseNameListSpy.mockReturnValue({
          ok: false,
          problem: NameProblem.TooLong,
          names: TOO_LONG,
        });

        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.lastReply().text).toBe(copy.nameTooLong(LONGEST_NAME, TOO_LONG));
      });

      it("should not plan anything on a bad list", async () => {
        parseNameListSpy.mockReturnValue({
          ok: false,
          problem: NameProblem.Duplicates,
          names: [WRITTEN],
        });

        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.replySpy).toHaveBeenCalledTimes(ONCE);
        expect(planReplacementSpy).not.toHaveBeenCalled();
        expect(keyboards.toMarkupSpy).not.toHaveBeenCalled();
      });

      it("should not plan anything when it asked instead", async () => {
        parseNameListSpy.mockReturnValue({ ok: false, problem: NameProblem.Empty });

        await onReplace(context(), ctx.command());

        expect(planReplacementSpy).not.toHaveBeenCalled();
        expect(keyboards.toMarkupSpy).not.toHaveBeenCalled();
      });
    });

    describe("a plan the domain refused", () => {
      it("should plan from the last evening and the chat's roster", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(repo.latestEveningSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(repo.playersInChatSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(planReplacementSpy).toHaveBeenCalledWith(EVENING, ROSTER, NAMES);
      });

      it("should ask for two names when there were not two", async () => {
        planReplacementSpy.mockReturnValue(refusedBy(Refusal.NotTwoNames));

        await onReplace(context(), ctx.command(WRITTEN));

        expect(ctx.lastReply().text).toBe(copy.askNames);
      });

      it("should say there is no evening to correct", async () => {
        planReplacementSpy.mockReturnValue(refusedBy(Refusal.NoEvening));

        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.lastReply().text).toBe(copy.noEvening);
      });

      it("should say the written name was not in that evening, dated", async () => {
        planReplacementSpy.mockReturnValue(refusedOnTheEvening(Refusal.NotThisEvening));

        await onReplace(context(), ctx.command(TYPED));

        expect(eveningDateSpy).toHaveBeenCalledWith(copy, STARTED_ON);
        expect(ctx.lastReply().text).toBe(copy.notThisEvening(WRITTEN, DATE));
      });

      it("should say the real player was there too, both names in their roles", async () => {
        planReplacementSpy.mockReturnValue(refusedOnTheEvening(Refusal.AlsoPlayed));

        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.lastReply().text).toBe(copy.alsoPlayed(WRITTEN, PLAYED, DATE));
      });

      it("should send no screen on a refusal", async () => {
        planReplacementSpy.mockReturnValue(refusedOnTheEvening(Refusal.AlsoPlayed));

        await onReplace(context(), ctx.command(TYPED));

        expect(ctx.replySpy).toHaveBeenCalledTimes(ONCE);
        expect(ctx.lastReply().options).not.toHaveProperty("reply_markup");
        expect(ctx.lastReply().options).not.toHaveProperty("parse_mode");
        expect(repo.createPlayerSpy).not.toHaveBeenCalled();
      });
    });

    describe("a plan it can propose", () => {
      it("should send the proposal as HTML with the keyboard hung on it", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(renderProposalSpy).toHaveBeenCalledWith(copy, planWith(ROMANI_ID));
        expect(keyboards.toMarkupSpy).toHaveBeenCalledWith(KEYBOARD);
        expect(ctx.lastReply()).toEqual({
          text: PROPOSAL,
          options: { parse_mode: "HTML", reply_markup: MARKUP },
        });
      });

      it("should not create a player the chat already knows", async () => {
        await onReplace(context(), ctx.command(TYPED));

        expect(renderReplaceKeyboardSpy).toHaveBeenCalledWith(copy, PAYLOAD);
        expect(repo.createPlayerSpy).not.toHaveBeenCalled();
      });

      it("should create a new arrival and carry its id in the payload", async () => {
        planReplacementSpy.mockReturnValue({ ok: true, plan: planWith(null) });

        await onReplace(context(), ctx.command(TYPED));

        expect(repo.createPlayerSpy).toHaveBeenCalledWith(CHAT_ID, PLAYED);
        expect(renderReplaceKeyboardSpy).toHaveBeenCalledWith(copy, {
          firstGameId: FIRST_GAME_ID,
          fromId: ROMA_ID,
          toId: CREATED_ID,
        });
      });

    });
  });

  describe("onNamesReply()", () => {
    beforeEach(() => {
      prompts.answeredPromptTextSpy.mockReturnValue(copy.askNamesPrompt);
    });

    it("should read the names out of a reply to its own question", async () => {
      const message = ctx.textMessage(TYPED);

      await onNamesReply(context(), message);

      expect(prompts.answeredPromptTextSpy).toHaveBeenCalledWith(message);
      expect(parseNameListSpy).toHaveBeenCalledWith(TYPED);
      expect(ctx.lastReply().text).toBe(PROPOSAL);
    });

    it("should let an answered question stand rather than delete it later", async () => {
      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(registry.forgetSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should not forget a question that was not its own", async () => {
      prompts.answeredPromptTextSpy.mockReturnValue("some other question");

      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(registry.forgetSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should recognise the question it asked in the other language", async () => {
      copyInSpy.mockImplementation((locale) => (locale === Locale.Ru ? russian : copy));
      prompts.answeredPromptTextSpy.mockReturnValue(russian.askNamesPrompt);

      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(ctx.lastReply().text).toBe(PROPOSAL);
    });

    it("should leave a message that answers no question of its own alone", async () => {
      prompts.answeredPromptTextSpy.mockReturnValue(null);

      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(parseNameListSpy).toHaveBeenCalledTimes(NEVER);
      expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should leave a reply to some other question of the bot alone", async () => {
      prompts.answeredPromptTextSpy.mockReturnValue("Who is playing?");

      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(parseNameListSpy).toHaveBeenCalledTimes(NEVER);
      expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse while a game is being played", async () => {
      repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(ctx.lastReply().text).toBe(copy.gameRunning);
      expect(parseNameListSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse in words rather than ask again when the reply names nobody", async () => {
      parseNameListSpy.mockReturnValue({ ok: false, problem: NameProblem.Empty });

      await onNamesReply(context(), ctx.textMessage(""));

      expect(ctx.lastReply().text).toBe(copy.askNames);
      expect(prompts.askAsReplySpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse a plan the domain refused", async () => {
      planReplacementSpy.mockReturnValue(refusedBy(Refusal.NoEvening));

      await onNamesReply(context(), ctx.textMessage(TYPED));

      expect(ctx.lastReply().text).toBe(copy.noEvening);
    });
  });

  describe("onTap()", () => {
    describe("data it cannot read", () => {
      it("should tell the tapper the screen expired", async () => {
        decodeReplaceCallbackSpy.mockReturnValue(null);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(decodeReplaceCallbackSpy).toHaveBeenCalledWith(TAP_DATA);
        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      });

      it("should touch nothing", async () => {
        decodeReplaceCallbackSpy.mockReturnValue(null);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
        expect(ctx.editMessageTextSpy).not.toHaveBeenCalled();
        expect(repo.replaceInGamesSpy).not.toHaveBeenCalled();
        expect(repo.forgetUnplayedPlayersSpy).not.toHaveBeenCalled();
      });

      it("should give up on a tap with no chat behind it, in the default language", async () => {
        await onTap(context(), ctx.tapWithoutChat(TAP_DATA));

        expect(copyInSpy).toHaveBeenCalledWith(DEFAULT_LOCALE);
        expect(locales.readSpy).not.toHaveBeenCalled();
        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      });

      it("should speak the chat's own language when the tap has a chat", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(copyInSpy).toHaveBeenCalledWith(Locale.Ru);
      });

      it("should write nothing for a tap with no chat behind it", async () => {
        await onTap(context(), ctx.tapWithoutChat(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
        expect(ctx.editMessageTextSpy).not.toHaveBeenCalled();
        expect(repo.replaceInGamesSpy).not.toHaveBeenCalled();
      });
    });

    describe("cancelling", () => {
      beforeEach(() => {
        decodeReplaceCallbackSpy.mockReturnValue({ payload: PAYLOAD, action: ActionKind.Cancel });
      });

      it("should say nothing was replaced and drop the buttons", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(renderCancelledSpy).toHaveBeenCalledWith(copy);
        expect(ctx.lastEdit()).toEqual({ text: CANCELLED, options: { parse_mode: "HTML" } });
      });

      it("should sweep the player it may have created for the proposal", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.forgetUnplayedPlayersSpy).toHaveBeenCalledWith(CHAT_ID);
      });

      it("should sweep before touching Telegram, so a failed edit leaves no phantom behind", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.forgetUnplayedPlayersSpy.mock.invocationCallOrder[FIRST] ?? NEVER).toBeLessThan(
          ctx.editMessageTextSpy.mock.invocationCallOrder[FIRST] ?? NEVER
        );
      });

      it("should replace nothing", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.editMessageTextSpy).toHaveBeenCalledTimes(ONCE);
        expect(repo.replaceInGamesSpy).not.toHaveBeenCalled();
      });

      it("should tell the tapper it was cancelled", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.cancelledNotice);
      });
    });

    describe("confirming", () => {
      it("should refuse if a game started while the screen was open", async () => {
        repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith({
          text: copy.gameRunning,
          show_alert: true,
        });
      });

      it("should replace nothing while a game is running", async () => {
        repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
        expect(recheckSpy).not.toHaveBeenCalled();
        expect(repo.replaceInGamesSpy).not.toHaveBeenCalled();
        expect(ctx.editMessageTextSpy).not.toHaveBeenCalled();
      });

      it("should recheck the payload against the evening and roster as they are now", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.latestEveningSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(repo.playersInChatSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(recheckSpy).toHaveBeenCalledWith(EVENING, ROSTER, PAYLOAD);
      });

      it("should call a failed recheck an expired screen", async () => {
        recheckSpy.mockReturnValue({ ok: false, because: Refusal.ScreenStale });

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      });

      it("should write nothing after a failed recheck", async () => {
        recheckSpy.mockReturnValue({ ok: false, because: Refusal.ScreenStale });

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
        expect(repo.replaceInGamesSpy).not.toHaveBeenCalled();
        expect(ctx.editMessageTextSpy).not.toHaveBeenCalled();
      });

      it("should rewrite every game of the evening from the leaving id to the arriving id", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.replaceInGamesSpy).toHaveBeenCalledWith(
          CHAT_ID,
          [FIRST_GAME_ID, SECOND_GAME_ID],
          ROMA_ID,
          ROMANI_ID
        );
      });

      it("should leave the result on screen as HTML with no buttons", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(renderReplacedSpy).toHaveBeenCalledWith(copy, planWith(ROMANI_ID));
        expect(ctx.lastEdit()).toEqual({ text: REPLACED, options: { parse_mode: "HTML" } });
      });

      it("should tell the tapper it happened", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.replacedNotice);
      });
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionKind, Outcome } from "#merge-names/domain/merge-states.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { InlineKeyboardStub } from "#shared/telegram/inline-keyboard.stub.ts";
import { Locale } from "#shared/locale/locales.ts";
import { Role } from "#merge-names/domain/merge-states.ts";
import type { Candidate, Transition } from "#merge-names/domain/merge-selection.ts";
import { copy } from "#merge-names/copy.en.ts";
import { CHAT_ID, ContextStub } from "#merge-names/bot/grammy-context.stub.ts";


const MIN_TO_MERGE = 2;

const keyboards = new InlineKeyboardStub();

const applySpy = vi.fn();

const roleOfSpy = vi.fn();

const decodeMergeCallbackSpy = vi.fn();

const renderMergeKeyboardSpy = vi.fn();

const renderMergeScreenSpy = vi.fn();

const renderMergedSpy = vi.fn();

const renderCancelledSpy = vi.fn();

const joinedNamesSpy = vi.fn();

const copyInSpy = vi.fn();

vi.mock("#merge-names/domain/merge-selection.ts", () => ({
  MIN_TO_MERGE,
  apply: (roster: unknown, selection: unknown, action: unknown) =>
    applySpy(roster, selection, action),
  roleOf: (selection: unknown, playerId: unknown) => roleOfSpy(selection, playerId),
}));

vi.mock("#merge-names/render/merge-callback-codec.ts", () => ({
  decodeMergeCallback: (data: unknown) => decodeMergeCallbackSpy(data),
}));

vi.mock("#merge-names/render/merge-keyboard.ts", () => ({
  renderMergeKeyboard: (table: unknown, roster: unknown, selection: unknown) =>
    renderMergeKeyboardSpy(table, roster, selection),
}));

vi.mock("#shared/telegram/inline-keyboard.ts", () => keyboards.module);

vi.mock("#merge-names/copy.ts", () => ({
  copyIn: (locale: unknown) => copyInSpy(locale),
}));

vi.mock("#merge-names/render/merge-message.ts", () => ({
  renderMergeScreen: (table: unknown, roster: unknown, selection: unknown) =>
    renderMergeScreenSpy(table, roster, selection),
  renderMerged: (table: unknown, keeper: unknown, absorbed: unknown) =>
    renderMergedSpy(table, keeper, absorbed),
  renderCancelled: (table: unknown) => renderCancelledSpy(table),
  joinedNames: (table: unknown, candidates: unknown) => joinedNamesSpy(table, candidates),
}));

const { onMerge, onTap } = await import("#merge-names/bot/merge-handler.ts");

const ANYA_ID = 12;

const ANNA_ID = 7;

const TAP_DATA = "the-tap-data";

const SCREEN = "the-screen";

const KEYBOARD = [[{ text: "a-button", callback_data: "a" }]];

const MARKUP = { inline_keyboard: [[{ text: "converted", callback_data: "converted" }]] };

const RESULT = "the-result";

const CANCELLED = "the-cancelled-body";

const NAMES = "Аня, Анна";

const SELECTION = [ANYA_ID, ANNA_ID];

const LIVE_CARD = { game: { message_id: 1 } };

const candidate = (playerId: number, displayName: string): Candidate => ({
  playerId,
  displayName,
  games: 0,
});

const ANYA = candidate(ANYA_ID, "Аня");

const ANNA = candidate(ANNA_ID, "Анна");

const ROSTER = [ANYA, ANNA];

const confirmedBy = (keeper: Candidate, absorbed: readonly Candidate[]): Transition => ({
  outcome: Outcome.Confirmed,
  keeper,
  absorbed,
});

describe("merge-handler", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;
  let locales: LocaleReaderStub;

  const context = () => ({ repo, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    ctx = new ContextStub();
    locales = new LocaleReaderStub(Locale.Ru);

    repo.rosterInChatSpy.mockReturnValue(ROSTER);
    decodeMergeCallbackSpy.mockReturnValue({ selection: SELECTION, action: { kind: ActionKind.Back } });
    applySpy.mockReturnValue({ outcome: Outcome.Updated, selection: SELECTION, touched: null });
    roleOfSpy.mockReturnValue(Role.Absorbed);
    copyInSpy.mockReturnValue(copy);
    renderMergeScreenSpy.mockReturnValue(SCREEN);
    renderMergeKeyboardSpy.mockReturnValue(KEYBOARD);
    keyboards.toMarkupSpy.mockReturnValue(MARKUP);
    renderMergedSpy.mockReturnValue(RESULT);
    renderCancelledSpy.mockReturnValue(CANCELLED);
    joinedNamesSpy.mockReturnValue(NAMES);
  });

  describe("onMerge()", () => {
    it("should send the screen for the chat's own roster", async () => {
      await onMerge(context(), ctx.command());

      expect(repo.rosterInChatSpy).toHaveBeenCalledWith(CHAT_ID);
      expect(ctx.lastReply().text).toBe(SCREEN);
    });

    it("should open with nothing picked", async () => {
      await onMerge(context(), ctx.command());

      expect(renderMergeScreenSpy).toHaveBeenCalledWith(copy, ROSTER, []);
    });

    it("should hang the keyboard on that message", async () => {
      await onMerge(context(), ctx.command());

      expect(keyboards.toMarkupSpy).toHaveBeenCalledWith(KEYBOARD);
      expect(ctx.lastReply().options).toMatchObject({ reply_markup: MARKUP });
    });

    it("should let Telegram parse the names as HTML", async () => {
      await onMerge(context(), ctx.command());

      expect(ctx.lastReply().options).toMatchObject({ parse_mode: "HTML" });
    });

    it("should refuse while a game is being played", async () => {
      repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

      await onMerge(context(), ctx.command());

      expect(ctx.lastReply().text).toBe(copy.gameRunning);
    });

    it("should not even look at the roster while a game is being played", async () => {
      repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

      await onMerge(context(), ctx.command());

      expect(repo.rosterInChatSpy).not.toHaveBeenCalled();
    });

    it("should say there is nothing to merge with a single name", async () => {
      repo.rosterInChatSpy.mockReturnValue([ANYA]);

      await onMerge(context(), ctx.command());

      expect(ctx.lastReply().text).toBe(copy.nothingToMerge);
    });

    it("should say there is nothing to merge with no names at all", async () => {
      repo.rosterInChatSpy.mockReturnValue([]);

      await onMerge(context(), ctx.command());

      expect(ctx.lastReply().text).toBe(copy.nothingToMerge);
    });
  });

  describe("onTap()", () => {
    describe("data it cannot read", () => {
      it("should tell the tapper the screen expired", async () => {
        decodeMergeCallbackSpy.mockReturnValue(null);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      });

      it("should change nothing", async () => {
        decodeMergeCallbackSpy.mockReturnValue(null);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.editMessageTextSpy).not.toHaveBeenCalled();
      });

      it("should give up on a tap with no chat behind it", async () => {
        await onTap(context(), ctx.tapWithoutChat(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      });
    });

    describe("a pick or a step back", () => {
      it("should rebuild the screen from the roster as it is now", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.rosterInChatSpy).toHaveBeenCalledWith(CHAT_ID);
        expect(renderMergeScreenSpy).toHaveBeenCalledWith(copy, ROSTER, SELECTION);
      });

      it("should hand the decoded tap to the domain", async () => {
        decodeMergeCallbackSpy.mockReturnValue({
          selection: SELECTION,
          action: { kind: ActionKind.Pick, playerId: ANNA_ID },
        });

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(applySpy).toHaveBeenCalledWith(ROSTER, SELECTION, {
          kind: ActionKind.Pick,
          playerId: ANNA_ID,
        });
      });

      it("should edit the message rather than send another", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.lastEdit().text).toBe(SCREEN);
        expect(ctx.replySpy).not.toHaveBeenCalled();
      });

      it("should redraw the keyboard for the new selection", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(keyboards.toMarkupSpy).toHaveBeenCalledWith(KEYBOARD);
        expect(ctx.lastEdit().options).toMatchObject({ reply_markup: MARKUP });
      });

      it("should answer a step back without naming anybody", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapBack);
      });

      it("should answer the keeper by name", async () => {
        applySpy.mockReturnValue({ outcome: Outcome.Updated, selection: [ANYA_ID], touched: ANYA });
        roleOfSpy.mockReturnValue(Role.Keeper);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapKeeper("Аня"));
      });

      it("should answer an absorbed name by name", async () => {
        applySpy.mockReturnValue({ outcome: Outcome.Updated, selection: SELECTION, touched: ANNA });
        roleOfSpy.mockReturnValue(Role.Absorbed);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapAbsorbed("Анна"));
      });

      it("should say so when a name was let go", async () => {
        applySpy.mockReturnValue({ outcome: Outcome.Updated, selection: [], touched: ANNA });
        roleOfSpy.mockReturnValue(Role.Free);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapDropped("Анна"));
      });

      it("should read the role out of the selection the tap produced", async () => {
        applySpy.mockReturnValue({ outcome: Outcome.Updated, selection: [ANNA_ID], touched: ANNA });

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(roleOfSpy).toHaveBeenCalledWith([ANNA_ID], ANNA_ID);
      });
    });

    describe("confirming the merge", () => {
      beforeEach(() => {
        applySpy.mockReturnValue(confirmedBy(ANYA, [ANNA]));
      });

      it("should fold the absorbed names into the keeper", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.mergePlayersSpy).toHaveBeenCalledWith(ANYA_ID, [ANNA_ID]);
      });

      it("should leave the result on screen with no buttons", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.lastEdit().text).toBe(RESULT);
        expect(ctx.lastEdit().options).not.toHaveProperty("reply_markup");
      });

      it("should let Telegram parse the result as HTML, so the keeper stays bold", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.lastEdit().options).toMatchObject({ parse_mode: "HTML" });
      });

      it("should tell the tapper it happened", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.mergedNotice);
      });

      it("should ask whether the names ever sat in one game", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.playedTogetherSpy).toHaveBeenCalledWith([ANYA_ID, ANNA_ID]);
      });

      it("should refuse two names that played the same game", async () => {
        repo.playedTogetherSpy.mockReturnValue(true);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith({
          text: copy.playedTogether(NAMES),
          show_alert: true,
        });
      });

      it("should merge nothing when they played the same game", async () => {
        repo.playedTogetherSpy.mockReturnValue(true);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.mergePlayersSpy).not.toHaveBeenCalled();
      });

      it("should name everybody involved in that refusal", async () => {
        repo.playedTogetherSpy.mockReturnValue(true);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(joinedNamesSpy).toHaveBeenCalledWith(copy, [ANYA, ANNA]);
      });

      it("should refuse if a game started while the screen was open", async () => {
        repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith({
          text: copy.gameRunning,
          show_alert: true,
        });
      });

      it("should merge nothing while a game is running", async () => {
        repo.liveCardInChatSpy.mockReturnValue(LIVE_CARD);

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.mergePlayersSpy).not.toHaveBeenCalled();
      });
    });

    describe("cancelling", () => {
      beforeEach(() => {
        applySpy.mockReturnValue({ outcome: Outcome.Cancelled });
      });

      it("should say nothing was merged and drop the buttons", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.lastEdit().text).toBe(CANCELLED);
        expect(ctx.lastEdit().options).not.toHaveProperty("reply_markup");
      });

      it("should merge nothing", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(repo.mergePlayersSpy).not.toHaveBeenCalled();
      });

      it("should let Telegram parse that body as HTML too", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.lastEdit().options).toMatchObject({ parse_mode: "HTML" });
      });

      it("should tell the tapper it was cancelled", async () => {
        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.cancelledNotice);
      });
    });

    describe("a tap the domain refused", () => {
      const refused = (because: string) => {
        applySpy.mockReturnValue({ outcome: Outcome.Rejected, because });
      };

      it("should say when one name too many was picked", async () => {
        refused("too_many");

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapTooMany);
      });

      it("should call a name that has gone an expired screen", async () => {
        refused("unknown_name");

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      });

      it("should say a control is not available yet", async () => {
        refused("nothing_yet");

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapNotAllowed);
      });

      it("should leave the screen as it was", async () => {
        refused("nothing_yet");

        await onTap(context(), ctx.callbackTap(TAP_DATA));

        expect(ctx.editMessageTextSpy).not.toHaveBeenCalled();
      });
    });
  });
});

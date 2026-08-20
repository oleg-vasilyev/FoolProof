import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { Locale } from "#shared/locale/locales.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { CHAT_ID, ContextStub } from "#scoresheet/bot/grammy-context.stub.ts";
import { InputFileStub } from "#scoresheet/bot/grammy-input-file.stub.ts";


const inputFile = new InputFileStub();

const renderScoresheetSpy = vi.fn();

const rasterizeSpy = vi.fn();

const gameTallySpy = vi.fn();

const chronologyCaptionSpy = vi.fn();

const gamesShortOfAwardsSpy = vi.fn();

const renderAwardsSpy = vi.fn();

const honoursForSpy = vi.fn();

const copyInSpy = vi.fn();

vi.mock("#scoresheet/render/chronology/chronology-svg.ts", () => ({
  renderScoresheet: (table: unknown, chronology: unknown) =>
    renderScoresheetSpy(table, chronology),
}));

vi.mock("#scoresheet/copy.ts", () => ({
  copyIn: (locale: unknown) => copyInSpy(locale),
}));

vi.mock("#scoresheet/render/awards/awards-svg.ts", () => ({
  renderAwards: (table: unknown, chronology: unknown, honours: unknown) =>
    renderAwardsSpy(table, chronology, honours),
}));

vi.mock("#scoresheet/domain/awards/awards.ts", () => ({
  gamesShortOfAwards: (played: number) => gamesShortOfAwardsSpy(played),
  honoursFor: (chronology: unknown) => honoursForSpy(chronology),
}));

vi.mock("#scoresheet/render/chronology/chronology-caption.ts", () => ({
  chronologyCaption: (table: unknown, played: number) => chronologyCaptionSpy(table, played),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/bot/rasterizer.ts", () => ({
  rasterize: (svg: string) => rasterizeSpy(svg),
}));

vi.mock("grammy", () => inputFile.module);

const { onAwards, onChronology, onStats } = await import("#scoresheet/bot/stats-handler.ts");

const ONCE = 1;

const TWICE = 2;

const NEVER = 0;

const FIFTY = 50;

const SHORT_BY = 2;

const CAPTION_MARK = "the-caption";

const SHEET_SVG = "<svg>chronology</svg>";

const AWARDS_SVG = "<svg>awards</svg>";

const SHEET_PNG = Buffer.from("png-bytes");

const AWARDS_PNG = Buffer.from("awards-bytes");

const HONOURS = { awards: [], curse: null };

const SESSION = {
  startedOn: "2026-07-24",
  players: [
    { playerId: 1, displayName: "Oleg" },
    { playerId: 2, displayName: "Anya" },
  ],
  games: [{ gameId: 7, starterId: null, placements: [{ playerId: 1, position: 1 }] }],
};

describe("onStats()", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;
  let locales: LocaleReaderStub;

  const context = () => ({ repo, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    locales = new LocaleReaderStub(Locale.Ru);
    copyInSpy.mockReturnValue(copy);

    repo = new RepositoryStub();
    ctx = new ContextStub();

    renderScoresheetSpy.mockReturnValue(SHEET_SVG);
    renderAwardsSpy.mockReturnValue(AWARDS_SVG);
    rasterizeSpy.mockResolvedValue(SHEET_PNG);
    honoursForSpy.mockReturnValue(null);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
    chronologyCaptionSpy.mockReturnValue(CAPTION_MARK);
  });

  it("should ask the repository for this chat's session", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(repo.seriesChronologySpy).toHaveBeenCalledWith(CHAT_ID);
  });

  it("should draw the sheet from exactly what the repository returned", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(renderScoresheetSpy).toHaveBeenCalledWith(copy, SESSION);
  });

  it("should rasterize the drawing it was given", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(rasterizeSpy).toHaveBeenCalledWith(SHEET_SVG);
  });

  it("should send the rasterized bytes as a photo", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(inputFile.builtSpy).toHaveBeenCalledWith(SHEET_PNG, "chronology.png");
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should ask the caption maker how the session stands", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(chronologyCaptionSpy).toHaveBeenCalledTimes(ONCE);
    expect(chronologyCaptionSpy).toHaveBeenCalledWith(copy, SESSION.games.length);
  });

  it("should caption the photo with whatever the caption maker returned", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
    expect(ctx.lastPhoto().options.caption).toBe(CAPTION_MARK);
  });

  it("should leave the photo uncaptioned when the caption maker had nothing to add", async () => {
    chronologyCaptionSpy.mockReturnValue(undefined);

    await onStats(context(), ctx.command("/stats"));

    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
    expect(ctx.lastPhoto().options.caption).toBeUndefined();
  });

  it("should count every game of the session in the caption, not only the drawn rows", async () => {
    repo.seriesChronologySpy.mockReturnValue({
      ...SESSION,
      games: Array.from({ length: FIFTY }, (_unused, index) => ({
        gameId: index,
        placements: [{ playerId: 1, position: 1 }],
      })),
    });

    await onStats(context(), ctx.command("/stats"));

    expect(chronologyCaptionSpy).toHaveBeenCalledWith(copy, FIFTY);
  });

  it("should say nothing is recorded when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onStats(context(), ctx.command("/stats"));

    expect(ctx.lastReply().text).toBe(copy.statsEmpty);
  });

  it("should not draw anything when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onStats(context(), ctx.command("/stats"));

    expect(renderScoresheetSpy).toHaveBeenCalledTimes(NEVER);
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(NEVER);
  });

  describe("and the awards that follow it", () => {
    it("should judge the awards against the same session it drew", async () => {
      await onStats(context(), ctx.command("/stats"));

      expect(honoursForSpy).toHaveBeenCalledWith(SESSION);
    });

    it("should send the two pictures as two photos rather than one album", async () => {
      honoursForSpy.mockReturnValue(HONOURS);
      rasterizeSpy.mockResolvedValueOnce(SHEET_PNG).mockResolvedValueOnce(AWARDS_PNG);

      await onStats(context(), ctx.command("/stats"));

      expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(TWICE);
    });

    it("should send the chronology first and the awards second", async () => {
      honoursForSpy.mockReturnValue(HONOURS);
      rasterizeSpy.mockResolvedValueOnce(SHEET_PNG).mockResolvedValueOnce(AWARDS_PNG);

      await onStats(context(), ctx.command("/stats"));

      expect(inputFile.builtSpy.mock.calls.map((call) => call[1])).toEqual([
        "chronology.png",
        "awards.png",
      ]);
    });

    it("should draw the awards from the session and the honours it judged", async () => {
      honoursForSpy.mockReturnValue(HONOURS);

      await onStats(context(), ctx.command("/stats"));

      expect(renderAwardsSpy).toHaveBeenCalledWith(copy, SESSION, HONOURS);
    });

    it("should leave the awards photo without a caption, since the picture names itself", async () => {
      honoursForSpy.mockReturnValue(HONOURS);

      await onStats(context(), ctx.command("/stats"));

      expect(ctx.lastPhoto().options.caption).toBeUndefined();
    });

    it("should send the chronology alone when the evening is too short for awards", async () => {
      await onStats(context(), ctx.command("/stats"));

      expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
      expect(renderAwardsSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should say nothing about the missing awards", async () => {
      await onStats(context(), ctx.command("/stats"));

      expect(ctx.replySpy).toHaveBeenCalledTimes(NEVER);
    });
  });
});

describe("onChronology()", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;
  let locales: LocaleReaderStub;

  const context = () => ({ repo, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    locales = new LocaleReaderStub(Locale.Ru);
    copyInSpy.mockReturnValue(copy);

    repo = new RepositoryStub();
    ctx = new ContextStub();

    renderScoresheetSpy.mockReturnValue(SHEET_SVG);
    rasterizeSpy.mockResolvedValue(SHEET_PNG);
    honoursForSpy.mockReturnValue(HONOURS);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
    chronologyCaptionSpy.mockReturnValue(CAPTION_MARK);
  });

  it("should send one photo and never reach for the awards", async () => {
    await onChronology(context(), ctx.command("/stats_chronology"));

    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
    expect(honoursForSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should draw the chronology of the session it was given", async () => {
    await onChronology(context(), ctx.command("/stats_chronology"));

    expect(renderScoresheetSpy).toHaveBeenCalledWith(copy, SESSION);
  });

  it("should say nothing is recorded when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onChronology(context(), ctx.command("/stats_chronology"));

    expect(ctx.lastReply().text).toBe(copy.statsEmpty);
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(NEVER);
  });
});

describe("onAwards()", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;
  let locales: LocaleReaderStub;

  const context = () => ({ repo, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    locales = new LocaleReaderStub(Locale.Ru);
    copyInSpy.mockReturnValue(copy);

    repo = new RepositoryStub();
    ctx = new ContextStub();

    renderAwardsSpy.mockReturnValue(AWARDS_SVG);
    rasterizeSpy.mockResolvedValue(AWARDS_PNG);
    honoursForSpy.mockReturnValue(HONOURS);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
    gameTallySpy.mockImplementation((_table: unknown, games: number) => `tally(${String(games)})`);
    gamesShortOfAwardsSpy.mockReturnValue(SHORT_BY);
  });

  it("should send the awards picture and nothing else", async () => {
    await onAwards(context(), ctx.command("/stats_awards"));

    expect(inputFile.builtSpy).toHaveBeenCalledWith(AWARDS_PNG, "awards.png");
    expect(renderScoresheetSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should rasterize the awards drawing", async () => {
    await onAwards(context(), ctx.command("/stats_awards"));

    expect(rasterizeSpy).toHaveBeenCalledWith(AWARDS_SVG);
  });

  it("should explain itself when the evening is too short for awards", async () => {
    honoursForSpy.mockReturnValue(null);
    gameTallySpy.mockImplementation((_table: unknown, games: number) => `tally(${String(games)})`);

    await onAwards(context(), ctx.command("/stats_awards"));

    expect(ctx.lastReply().text).toBe(copy.awardsTooSoon(`tally(${String(SHORT_BY)})`));
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should name what is still missing rather than the threshold itself", async () => {
    honoursForSpy.mockReturnValue(null);

    await onAwards(context(), ctx.command("/stats_awards"));

    expect(gamesShortOfAwardsSpy).toHaveBeenCalledWith(SESSION.games.length);
    expect(gameTallySpy).toHaveBeenCalledWith(copy, SHORT_BY);
  });

  it("should say nothing is recorded when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onAwards(context(), ctx.command("/stats_awards"));

    expect(ctx.lastReply().text).toBe(copy.statsEmpty);
    expect(honoursForSpy).toHaveBeenCalledTimes(NEVER);
  });
});

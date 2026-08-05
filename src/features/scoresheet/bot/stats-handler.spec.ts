import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { CHAT_ID, ContextStub } from "#scoresheet/bot/grammy-context.stub.ts";


const renderScoresheetSpy = vi.fn();

const rasterizeSpy = vi.fn();

const inputFileSpy = vi.fn();

const gameTallySpy = vi.fn();

const playerTallySpy = vi.fn();

const renderAwardsSpy = vi.fn();

const honoursForSpy = vi.fn();

vi.mock("#scoresheet/render/chronology/chronology-svg.ts", () => ({
  renderScoresheet: (chronology: unknown) => renderScoresheetSpy(chronology),
}));

vi.mock("#scoresheet/render/awards/awards-svg.ts", () => ({
  renderAwards: (chronology: unknown, honours: unknown) => renderAwardsSpy(chronology, honours),
}));

const EVENING_MINIMUM = 5;

vi.mock("#scoresheet/domain/awards/awards.ts", () => ({
  EVENING_MINIMUM,
  honoursFor: (chronology: unknown) => honoursForSpy(chronology),
}));

vi.mock("#scoresheet/render/session-tally.ts", () => ({
  gameTally: (games: number) => gameTallySpy(games),
  playerTally: (players: number) => playerTallySpy(players),
}));

vi.mock("#scoresheet/bot/rasterizer.ts", () => ({
  rasterize: (svg: string) => rasterizeSpy(svg),
}));

vi.mock("grammy", () => ({
  InputFile: class {
    public constructor(source: unknown, filename: string) {
      inputFileSpy(source, filename);
    }
  },
}));

const { onAwards, onChronology, onStats } = await import("#scoresheet/bot/stats-handler.ts");

const ONCE = 1;

const TWICE = 2;

const NEVER = 0;

const FIFTY = 50;

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

  const context = () => ({ repo });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    ctx = new ContextStub();

    renderScoresheetSpy.mockReturnValue(SHEET_SVG);
    renderAwardsSpy.mockReturnValue(AWARDS_SVG);
    rasterizeSpy.mockReturnValue(SHEET_PNG);
    honoursForSpy.mockReturnValue(null);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
    gameTallySpy.mockImplementation((games: number) => `tally(${String(games)})`);
    playerTallySpy.mockImplementation((players: number) => `roster(${String(players)})`);
  });

  it("should ask the repository for this chat's session", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(repo.seriesChronologySpy).toHaveBeenCalledWith(CHAT_ID);
  });

  it("should draw the sheet from exactly what the repository returned", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(renderScoresheetSpy).toHaveBeenCalledWith(SESSION);
  });

  it("should rasterize the drawing it was given", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(rasterizeSpy).toHaveBeenCalledWith(SHEET_SVG);
  });

  it("should send the rasterized bytes as a photo", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(inputFileSpy).toHaveBeenCalledWith(SHEET_PNG, "chronology.png");
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should ask the tally renderers for the session's size", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(gameTallySpy).toHaveBeenCalledWith(SESSION.games.length);
    expect(playerTallySpy).toHaveBeenCalledWith(SESSION.players.length);
  });

  it("should caption the photo by joining the two finished tallies", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(ctx.lastPhoto().options.caption).toBe(
      copy.sheetSubtitle(
        gameTallySpy.mock.results[0]?.value as string,
        playerTallySpy.mock.results[0]?.value as string
      )
    );
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

    expect(gameTallySpy).toHaveBeenCalledWith(FIFTY);
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
      rasterizeSpy.mockReturnValueOnce(SHEET_PNG).mockReturnValueOnce(AWARDS_PNG);

      await onStats(context(), ctx.command("/stats"));

      expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(TWICE);
    });

    it("should send the chronology first and the awards second", async () => {
      honoursForSpy.mockReturnValue(HONOURS);
      rasterizeSpy.mockReturnValueOnce(SHEET_PNG).mockReturnValueOnce(AWARDS_PNG);

      await onStats(context(), ctx.command("/stats"));

      expect(inputFileSpy.mock.calls.map((call) => call[1])).toEqual([
        "chronology.png",
        "awards.png",
      ]);
    });

    it("should draw the awards from the session and the honours it judged", async () => {
      honoursForSpy.mockReturnValue(HONOURS);

      await onStats(context(), ctx.command("/stats"));

      expect(renderAwardsSpy).toHaveBeenCalledWith(SESSION, HONOURS);
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

  const context = () => ({ repo });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    ctx = new ContextStub();

    renderScoresheetSpy.mockReturnValue(SHEET_SVG);
    rasterizeSpy.mockReturnValue(SHEET_PNG);
    honoursForSpy.mockReturnValue(HONOURS);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
    gameTallySpy.mockImplementation((games: number) => `tally(${String(games)})`);
    playerTallySpy.mockImplementation((players: number) => `roster(${String(players)})`);
  });

  it("should send one photo and never reach for the awards", async () => {
    await onChronology(context(), ctx.command("/stats_chronology"));

    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
    expect(honoursForSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should draw the chronology of the session it was given", async () => {
    await onChronology(context(), ctx.command("/stats_chronology"));

    expect(renderScoresheetSpy).toHaveBeenCalledWith(SESSION);
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

  const context = () => ({ repo });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    ctx = new ContextStub();

    renderAwardsSpy.mockReturnValue(AWARDS_SVG);
    rasterizeSpy.mockReturnValue(AWARDS_PNG);
    honoursForSpy.mockReturnValue(HONOURS);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
  });

  it("should send the awards picture and nothing else", async () => {
    await onAwards(context(), ctx.command("/stats_awards"));

    expect(inputFileSpy).toHaveBeenCalledWith(AWARDS_PNG, "awards.png");
    expect(renderScoresheetSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should rasterize the awards drawing", async () => {
    await onAwards(context(), ctx.command("/stats_awards"));

    expect(rasterizeSpy).toHaveBeenCalledWith(AWARDS_SVG);
  });

  it("should explain itself when the evening is too short for awards", async () => {
    honoursForSpy.mockReturnValue(null);
    gameTallySpy.mockImplementation((games: number) => `tally(${String(games)})`);

    await onAwards(context(), ctx.command("/stats_awards"));

    expect(ctx.lastReply().text).toBe(copy.awardsTooSoon("tally(5)"));
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should quote the threshold the domain holds, not one of its own", async () => {
    honoursForSpy.mockReturnValue(null);

    await onAwards(context(), ctx.command("/stats_awards"));

    expect(gameTallySpy).toHaveBeenCalledWith(EVENING_MINIMUM);
  });

  it("should say nothing is recorded when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onAwards(context(), ctx.command("/stats_awards"));

    expect(ctx.lastReply().text).toBe(copy.statsEmpty);
    expect(honoursForSpy).toHaveBeenCalledTimes(NEVER);
  });
});

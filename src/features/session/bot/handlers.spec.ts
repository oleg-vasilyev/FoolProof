import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "../../../shared/repository/repository.stub.ts";
import { strings } from "../strings.ts";
import { CHAT_ID, ContextStub } from "./context.stub.ts";


const renderScoresheetSpy = vi.fn();

const rasterizeSpy = vi.fn();

const inputFileSpy = vi.fn();

vi.mock("../render/scoresheet.ts", () => ({
  renderScoresheet: (chronology: unknown) => renderScoresheetSpy(chronology),
}));

vi.mock("./image.ts", () => ({
  rasterize: (svg: string) => rasterizeSpy(svg),
}));

vi.mock("grammy", () => ({
  InputFile: class {
    public constructor(source: unknown, filename: string) {
      inputFileSpy(source, filename);
    }
  },
}));

const { onStats } = await import("./handlers.ts");

const ONCE = 1;

const NEVER = 0;

const FIFTY = 50;

const SHEET_SVG = "<svg>chronology</svg>";

const SHEET_PNG = Buffer.from("png-bytes");

const SESSION = {
  startedOn: "2026-07-24",
  players: [
    { playerId: 1, displayName: "Oleg" },
    { playerId: 2, displayName: "Anya" },
  ],
  games: [{ gameId: 7, placements: [{ playerId: 1, position: 1 }] }],
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
    rasterizeSpy.mockReturnValue(SHEET_PNG);
    repo.seriesChronologySpy.mockReturnValue(SESSION);
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

  it("should caption the photo with the session's size", async () => {
    await onStats(context(), ctx.command("/stats"));

    expect(ctx.lastPhoto().options.caption).toBe(
      strings.sheetSubtitle(SESSION.games.length, SESSION.players.length)
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

    expect(ctx.lastPhoto().options.caption).toBe(
      strings.sheetSubtitle(FIFTY, SESSION.players.length)
    );
  });

  it("should say nothing is recorded when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onStats(context(), ctx.command("/stats"));

    expect(ctx.lastReply().text).toBe(strings.statsEmpty);
  });

  it("should not draw anything when the chat has no session yet", async () => {
    repo.seriesChronologySpy.mockReturnValue(null);

    await onStats(context(), ctx.command("/stats"));

    expect(renderScoresheetSpy).toHaveBeenCalledTimes(NEVER);
    expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(NEVER);
  });
});

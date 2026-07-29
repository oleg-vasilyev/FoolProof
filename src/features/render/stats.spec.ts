import { describe, expect, it, vi } from "vitest";
import type { PlayerTally } from "../../shared/repository/types.ts";


const escapeHtmlSpy = vi.fn((value: string) => value);

vi.mock("./html.ts", () => ({
  escapeHtml: (value: string) => escapeHtmlSpy(value),
}));

const { renderStats } = await import("./stats.ts");

const tally = (displayName: string, wins: number, fools: number): PlayerTally => ({
  playerId: 1,
  displayName,
  games: 9,
  wins,
  fools,
});

const linesOf = (rendered: string): readonly string[] => rendered.split("\n");

describe("renderStats()", () => {
  it("should invite a first game when nothing is recorded", () => {
    expect(renderStats({ games: 0, players: [] })).toBe(
      "Nothing recorded yet. Start a game with /game."
    );
  });

  it("should use the singular for one game", () => {
    const rendered = renderStats({ games: 1, players: [tally("Oleg", 1, 0)] });

    expect(rendered).toContain("<b>Session</b> · 1 game");
  });

  it("should use the plural beyond one", () => {
    const rendered = renderStats({ games: 4, players: [tally("Oleg", 1, 0)] });

    expect(rendered).toContain("<b>Session</b> · 4 games");
  });

  it("should draw one cell per game while the leader is small", () => {
    const rendered = renderStats({ games: 3, players: [tally("Roma", 0, 2)] });

    expect(linesOf(rendered)).toContain("██ 2 — Roma");
  });

  it("should not inflate a single game into a full width bar", () => {
    const rendered = renderStats({
      games: 2,
      players: [tally("Oleg", 1, 0), tally("Anya", 1, 0)],
    });

    expect(linesOf(rendered)).toContain("█ 1 — Anya");
  });

  it("should scale down once the leader passes the bar width", () => {
    const bigLeader = 24;
    const rendered = renderStats({ games: 30, players: [tally("Roma", 0, bigLeader)] });
    const bar = linesOf(rendered).find((line) => line.includes("Roma")) ?? "";

    expect(bar.startsWith("████████████ ")).toBe(true);
  });

  it("should keep a small tally visible when scaled", () => {
    const bigLeader = 40;
    const rendered = renderStats({
      games: 41,
      players: [tally("Roma", 0, bigLeader), tally("Anya", 0, 1)],
    });

    expect(linesOf(rendered)).toContain("█ 1 — Anya");
  });

  it("should sort a section by value descending", () => {
    const rendered = renderStats({
      games: 6,
      players: [tally("Anya", 0, 1), tally("Roma", 0, 3), tally("Oleg", 0, 2)],
    });
    const names = linesOf(rendered)
      .filter((line) => line.includes("—"))
      .map((line) => line.split("— ")[1]);

    expect(names).toEqual(["Roma", "Oleg", "Anya"]);
  });

  it("should break ties by name so the order never wobbles", () => {
    const rendered = renderStats({
      games: 3,
      players: [tally("Roma", 1, 0), tally("Anya", 1, 0), tally("Oleg", 1, 0)],
    });
    const names = linesOf(rendered)
      .filter((line) => line.includes("—"))
      .map((line) => line.split("— ")[1]);

    expect(names).toEqual(["Anya", "Oleg", "Roma"]);
  });

  it("should omit players with nothing to show", () => {
    const rendered = renderStats({
      games: 2,
      players: [tally("Roma", 0, 2), tally("Ghost", 0, 0)],
    });

    expect(rendered).not.toContain("Ghost");
  });

  it("should drop a section entirely when nobody scored in it", () => {
    const rendered = renderStats({ games: 2, players: [tally("Roma", 0, 2)] });

    expect(rendered).not.toContain("<b>Wins</b>");
  });

  it("should say so when every game ended in a draw", () => {
    const rendered = renderStats({ games: 2, players: [tally("Roma", 0, 0)] });

    expect(rendered).toContain("Every game ended in a draw.");
  });

});

describe("renderStats() and user data", () => {
  it("should route every player name through the escaper", () => {
    escapeHtmlSpy.mockClear();

    renderStats({ games: 2, players: [tally("Аня & Оля", 1, 1)] });

    expect(escapeHtmlSpy).toHaveBeenCalledWith("Аня & Оля");
  });

  it("should print what the escaper returned, not the raw name", () => {
    escapeHtmlSpy.mockReturnValueOnce("ESCAPED");

    const rendered = renderStats({ games: 2, players: [tally("Аня & Оля", 0, 1)] });

    expect(rendered).toContain("ESCAPED");
  });
});

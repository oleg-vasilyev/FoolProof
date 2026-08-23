import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award, Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ChatLocaleStub } from "#shared/locale/chat-locale.stub.ts";
import { RepositoryInstanceStub } from "#shared/repository/repository-instance.stub.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";


const repository = new RepositoryInstanceStub();

const locales = new ChatLocaleStub();

const copyInSpy = vi.fn();

const honoursForSpy = vi.fn();

const awardTitleSpy = vi.fn();

const awardWinnerSpy = vi.fn();

const awardReasonSpy = vi.fn();

const gameTallySpy = vi.fn();

vi.mock("#shared/repository/repository-instance.ts", () => repository.module);

vi.mock("#shared/locale/chat-locale.ts", () => locales.module);

vi.mock("#scoresheet/copy.ts", () => ({
  copyIn: (locale: unknown) => copyInSpy(locale),
}));

vi.mock("#scoresheet/domain/awards/awards.ts", () => ({
  honoursFor: (chronology: unknown) => honoursForSpy(chronology),
}));

vi.mock("#scoresheet/render/awards/award-lines.ts", () => ({
  awardTitle: (table: unknown, award: unknown) => awardTitleSpy(table, award),
  awardWinner: (table: unknown, names: unknown, wholeTable: unknown) =>
    awardWinnerSpy(table, names, wholeTable),
  awardReason: (table: unknown, award: unknown) => awardReasonSpy(table, award),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

const { reportOnTheNewestEvening } = await import("#scoresheet/bot/evening-report.ts");

const CHAT_ID = -100_500;

const OPENED_ON = "2026-08-06";

const OLEG = 1;

const ANYA = 2;

const A_STRANGER = 99;

const BURNS = 7;

const GAMES = 12;

const PREDICTED = 3;

const FIRST_LINE = 0;

const SECOND_LINE = 1;

const THIRD_LINE = 2;

const LAST_LINE = -1;

const WHOLE_TABLE_GIVEN = 2;

const NONE = 0;

const eveningOf = (games: number): SeriesChronology => ({
  startedOn: OPENED_ON,
  players: [
    { playerId: OLEG, displayName: "Oleg" },
    { playerId: ANYA, displayName: "Anya" },
  ],
  games: Array.from({ length: games }, (_unused, index) => ({
    gameId: index + 1,
    starterId: OLEG,
    placements: [],
  })),
});

const awardWonBy = (winners: readonly number[]): Award =>
  ({ name: AwardName.King, winners, percent: NONE, games: GAMES, passed: false }) as Award;

const honoursOf = (awards: readonly Award[], curse: Honours["curse"] = null): Honours => ({
  awards,
  curse,
});

describe("reportOnTheNewestEvening", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    repository.stub.seriesChronologySpy.mockReturnValue(eveningOf(GAMES));
    locales.createLocaleReaderSpy.mockReturnValue(locales.reader.read);
    copyInSpy.mockReturnValue(copy);
    honoursForSpy.mockReturnValue(honoursOf([awardWonBy([OLEG])]));
    awardTitleSpy.mockReturnValue("King");
    awardWinnerSpy.mockReturnValue("Oleg");
    awardReasonSpy.mockReturnValue("won most of them");
    gameTallySpy.mockReturnValue("12 games");
  });

  it("should say plainly that a chat with nothing finished has nothing to report", () => {
    repository.stub.seriesChronologySpy.mockReturnValue(null);

    expect(reportOnTheNewestEvening(CHAT_ID)).toEqual([`chat ${String(CHAT_ID)}: nothing finished here yet`]);
  });

  it("should ask the repository for the newest evening of the chat it was given", () => {
    reportOnTheNewestEvening(CHAT_ID);

    expect(repository.stub.seriesChronologySpy).toHaveBeenCalledWith(CHAT_ID);
  });

  it("should open with the date, the games and the players before anything else", () => {
    expect(reportOnTheNewestEvening(CHAT_ID)[FIRST_LINE]).toBe(
      `${OPENED_ON} — ${String(GAMES)} games, 2 players`
    );
  });

  it("should read the awards in the chat's own language rather than the bot's default", () => {
    reportOnTheNewestEvening(CHAT_ID);

    expect(locales.reader.readSpy).toHaveBeenCalledWith(CHAT_ID);
    expect(copyInSpy).toHaveBeenCalledWith(locales.reader.readSpy.mock.results[FIRST_LINE]?.value);
  });

  it("should stop after the opening when the evening was too short to earn anything", () => {
    honoursForSpy.mockReturnValue(null);

    const said = reportOnTheNewestEvening(CHAT_ID);

    expect(said).toHaveLength(2);
    expect(said[SECOND_LINE]).toBe("too few games for awards");
  });

  it("should give every award a title line and an indented reason under it", () => {
    const said = reportOnTheNewestEvening(CHAT_ID);

    expect(said[SECOND_LINE]).toBe("King — Oleg");
    expect(said[THIRD_LINE]).toBe("    won most of them");
  });

  it("should name the winners rather than their ids", () => {
    reportOnTheNewestEvening(CHAT_ID);

    expect(awardWinnerSpy.mock.calls[FIRST_LINE]?.[SECOND_LINE]).toEqual(["Oleg"]);
  });

  it("should fall back to the id when a winner has no column on the sheet", () => {
    honoursForSpy.mockReturnValue(honoursOf([awardWonBy([A_STRANGER])]));

    reportOnTheNewestEvening(CHAT_ID);

    expect(awardWinnerSpy.mock.calls[FIRST_LINE]?.[SECOND_LINE]).toEqual([String(A_STRANGER)]);
  });

  it("should tell the line whether the whole table won it, so it can be phrased as one", () => {
    honoursForSpy.mockReturnValue(honoursOf([awardWonBy([OLEG, ANYA])]));

    reportOnTheNewestEvening(CHAT_ID);

    expect(awardWinnerSpy.mock.calls[FIRST_LINE]?.[WHOLE_TABLE_GIVEN]).toBe(true);
  });

  it("should not claim a whole table when only some of it won", () => {
    reportOnTheNewestEvening(CHAT_ID);

    expect(awardWinnerSpy.mock.calls[FIRST_LINE]?.[WHOLE_TABLE_GIVEN]).toBe(false);
  });

  it("should end by saying the table went uncursed when it did", () => {
    expect(reportOnTheNewestEvening(CHAT_ID).at(LAST_LINE)).toBe("no table curse tonight");
  });

  it("should end on the curse itself when there was one, counted in games", () => {
    honoursForSpy.mockReturnValue(
      honoursOf([awardWonBy([OLEG])], { burns: BURNS, games: GAMES, predicted: PREDICTED })
    );

    expect(reportOnTheNewestEvening(CHAT_ID).at(LAST_LINE)).toBe(
      `${copy.awardsCurseLabel}: ${copy.curseFact(BURNS, "12 games", PREDICTED)}`
    );
    expect(gameTallySpy).toHaveBeenCalledWith(copy, GAMES);
  });
});

import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import type { Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";


const DB_FILE = join(tmpdir(), `foolproof-chain-spec-${process.pid}.db`);

process.env.DB_PATH = DB_FILE;

const { sqliteRepository: repo } = await import("#shared/repository/sqlite-repository.ts");
const { db } = await import("#shared/repository/sqlite-connection.ts");

const CHRONOLOGY_CHAT = -100777;

const SHORT_EVENING_CHAT = -100888;

const AWARDS_CHAT = -100999;

const ACTOR_ID = 777;

const MESSAGE_ID = 500;

const RECORDING = "RECORDING";

const FIRST_VERSION = 1;

const FIRST_POSITION = 1;

const TEXT_BODY = 1;

const NEXT_TEXT = 1;

const TEXT_AFTER_NEXT = 2;

const FULL_PERCENT = 100;

const SHORT_EVENING = 4;

const ENOUGH_EVENING = 5;

const OLEG = "Oleg";

const ANYA = "Anya";

const ROMA = "Roma";

const EVERYONE = [OLEG, ANYA, ROMA];

const TEXT_ELEMENT = /<text[^>]*>([^<]*)<\/text>/g;

const A_PERCENT = /^\d+%$/;

const SIDECARS = ["", "-wal", "-shm"];

interface LegendEntry {
  readonly name: string;
  readonly share: string;
  readonly games: string;
}

const textsIn = (svg: string): readonly string[] =>
  [...svg.matchAll(TEXT_ELEMENT)].map((found) => found[TEXT_BODY] ?? "");

const legendIn = (texts: readonly string[]): readonly LegendEntry[] =>
  texts.flatMap((value, index) => {
    const name = texts[index + NEXT_TEXT] ?? "";

    return A_PERCENT.test(value) && EVERYONE.includes(name)
      ? [{ name, share: value, games: texts[index + TEXT_AFTER_NEXT] ?? "" }]
      : [];
  });

const byName = (
  legend: readonly LegendEntry[],
  reading: (entry: LegendEntry) => string
): Record<string, string> =>
  Object.fromEntries(legend.map((entry) => [entry.name, reading(entry)]));

const idFor = (chatId: number, name: string): number =>
  repo.playersInChat(chatId).find((player) => player.display_name === name)?.id ??
  repo.createPlayer(chatId, name).id;

const playGame = (
  chatId: number,
  names: readonly string[],
  exits: readonly string[],
  starter: string
): void => {
  const playerIds = names.map((name) => idFor(chatId, name));
  const exitIds = exits.map((name) => idFor(chatId, name));
  const gameId = repo.openGame(chatId, playerIds);

  repo.attachMessage(gameId, MESSAGE_ID);
  repo.updateCard(gameId, RECORDING, FIRST_VERSION, idFor(chatId, starter));

  exitIds.forEach((playerId, index) => {
    repo.appendExit(gameId, playerId, index + FIRST_POSITION, ACTOR_ID);
  });

  const foolPosition = exitIds.length + FIRST_POSITION;

  repo.confirmGame(
    gameId,
    playerIds
      .filter((playerId) => !exitIds.includes(playerId))
      .map((playerId) => ({ playerId, position: foolPosition })),
    ACTOR_ID,
    foolPosition
  );
};

const foolEveryTime = (chatId: number, games: number): void => {
  Array.from({ length: games }).forEach(() => {
    playGame(chatId, EVERYONE, [OLEG, ANYA], OLEG);
  });
};

const seriesIn = (chatId: number): SeriesChronology => {
  const found = repo.seriesChronology(chatId);

  if (found === null) {
    throw new Error("the evening that was just played left no chronology to draw");
  }

  return found;
};

const honoursIn = (chatId: number): Honours => {
  const found = honoursFor(seriesIn(chatId));

  if (found === null) {
    throw new Error("the evening that was just played earned no honours");
  }

  return found;
};

afterAll(() => {
  db.close();

  for (const sidecar of SIDECARS) {
    rmSync(DB_FILE + sidecar, { force: true });
  }
});

describe("an evening reaching the chronology", () => {
  let texts: readonly string[];
  let legend: readonly LegendEntry[];

  beforeAll(() => {
    playGame(CHRONOLOGY_CHAT, EVERYONE, [OLEG, ANYA], OLEG);
    playGame(CHRONOLOGY_CHAT, EVERYONE, [ANYA, ROMA], ANYA);
    playGame(CHRONOLOGY_CHAT, [OLEG, ANYA], [OLEG], ANYA);

    texts = textsIn(renderScoresheet(copy, seriesIn(CHRONOLOGY_CHAT)));
    legend = legendIn(texts);
  });

  it("should work out each player's table share from the positions on record", () => {
    expect(byName(legend, (entry) => entry.share)).toEqual({
      [OLEG]: "67%",
      [ANYA]: "50%",
      [ROMA]: "25%",
    });
  });

  it("should order the legend by share, best first", () => {
    expect(legend.map((entry) => entry.name)).toEqual([OLEG, ANYA, ROMA]);
  });

  it("should count a player against the games they actually sat", () => {
    expect(byName(legend, (entry) => entry.games)).toEqual({
      [OLEG]: "3 games",
      [ANYA]: "3 games",
      [ROMA]: "2 games",
    });
  });

  it("should say somebody sat out, which only a missing row can tell it", () => {
    expect(texts).toContain(copy.sheetKeyAbsent);
  });
});

describe("an evening reaching the awards", () => {
  beforeAll(() => {
    foolEveryTime(SHORT_EVENING_CHAT, SHORT_EVENING);
    foolEveryTime(AWARDS_CHAT, ENOUGH_EVENING);
  });

  it("should refuse to hand out anything while the evening is short", () => {
    expect(honoursFor(seriesIn(SHORT_EVENING_CHAT))).toBeNull();
  });

  it("should hand the fool to whoever the recorded positions left last", () => {
    expect(honoursIn(AWARDS_CHAT).awards).toContainEqual({
      name: AwardName.FoolOfTheNight,
      winners: [idFor(AWARDS_CHAT, ROMA)],
      fools: ENOUGH_EVENING,
      games: ENOUGH_EVENING,
    });
  });

  it("should crown whoever the shares put highest, with the share it worked out", () => {
    expect(honoursIn(AWARDS_CHAT).awards).toContainEqual({
      name: AwardName.King,
      winners: [idFor(AWARDS_CHAT, OLEG)],
      percent: FULL_PERCENT,
      games: ENOUGH_EVENING,
    });
  });

  it("should carry the winners' names onto the picture", () => {
    const texts = textsIn(renderAwards(copy, seriesIn(AWARDS_CHAT), honoursIn(AWARDS_CHAT)));

    expect(texts).toContain(copy.awardTitles.foolOfTheNight);
    expect(texts).toContain(ROMA);
    expect(texts).toContain(OLEG);
  });
});

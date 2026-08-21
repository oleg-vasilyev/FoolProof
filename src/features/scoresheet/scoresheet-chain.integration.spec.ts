import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import type { Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";


const A_HANDLE = "@a_handle";

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

const TEXT_TAG = /<text([^>]*)>([^<]*)<\/text>/g;

const ATTRIBUTES = 1;

const BODY = 2;

const FIRST_GROUP = 1;

const A_FONT_SIZE = /font-size="([^"]+)"/;

const A_BARE_NUMBER = /^\d+$/;

const ELLIPSIS = "…";

const ONE_SIZE = 1;

const ONE_GAME = 1;

const FROM_THE_START = 0;

const NONE_CUT = 0;

const THE_FOOL = 1;

const CROWDED_CHAT = -100666;

const A_CROWDED_TABLE = [
  "Александра-Константиновна",
  "Владимир-Вячеславович",
  "Екатерина",
  "Роман",
  "Вероника",
  "Анастасия",
  "Дмитрий",
  "Ольга",
  "Святослав",
  "Аня",
];

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

interface Heading {
  readonly text: string;
  readonly size: string;
}

const headingsIn = (svg: string): readonly Heading[] =>
  [...svg.matchAll(TEXT_TAG)]
    .filter((found) => {
      const attributes = found[ATTRIBUTES] ?? "";

      return (
        attributes.includes('text-anchor="middle"') &&
        attributes.includes('font-weight="bold"') &&
        !A_BARE_NUMBER.test(found[BODY] ?? "") &&
        found[BODY] !== A_HANDLE
      );
    })
    .map((found) => ({
      text: found[BODY] ?? "",
      size: A_FONT_SIZE.exec(found[ATTRIBUTES] ?? "")?.[FIRST_GROUP] ?? "",
    }));

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

    texts = textsIn(renderScoresheet(copy, seriesIn(CHRONOLOGY_CHAT), A_HANDLE));
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

describe("a table too crowded for the names it seated", () => {
  let headings: readonly Heading[];

  beforeAll(() => {
    playGame(
      CROWDED_CHAT,
      A_CROWDED_TABLE,
      A_CROWDED_TABLE.slice(FROM_THE_START, A_CROWDED_TABLE.length - THE_FOOL),
      A_CROWDED_TABLE[FROM_THE_START] ?? ""
    );

    headings = headingsIn(renderScoresheet(copy, seriesIn(CROWDED_CHAT), A_HANDLE));
  });

  it("should head every column the table seated", () => {
    expect(headings).toHaveLength(A_CROWDED_TABLE.length);
  });

  it("should set every heading at one size, however long the name behind it was", () => {
    expect(new Set(headings.map((heading) => heading.size)).size).toBe(ONE_SIZE);
  });

  it("should cut the names that cannot fit rather than shrink them", () => {
    const cut = headings.filter((heading) => heading.text.endsWith(ELLIPSIS));

    expect(cut.length).toBeGreaterThan(NONE_CUT);
  });

  it("should leave a name that fits whole and unmarked", () => {
    expect(headings.map((heading) => heading.text)).toContain("Аня");
  });

  it("should cut a long name down to the same length as every other cut one", () => {
    const cut = headings.filter((heading) => heading.text.endsWith(ELLIPSIS));

    expect(new Set(cut.map((heading) => heading.text.length)).size).toBe(ONE_SIZE);
  });

  it("should count that table in the form its own language gives ten", () => {
    const texts = textsIn(renderScoresheet(russian, seriesIn(CROWDED_CHAT), A_HANDLE));

    expect(texts).toContain(
      russian.sheetSubtitle(
        `${String(ONE_GAME)} ${russian.sheetGameForms.one}`,
        `${String(A_CROWDED_TABLE.length)} ${russian.sheetPlayerForms.many}`
      )
    );
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
      passed: false,
    });
  });

  it("should carry the winners' names onto the picture", () => {
    const texts = textsIn(renderAwards(copy, seriesIn(AWARDS_CHAT), honoursIn(AWARDS_CHAT), A_HANDLE));

    expect(texts).toContain(copy.awardTitles.foolOfTheNight);
    expect(texts).toContain(ROMA);
    expect(texts).toContain(OLEG);
  });
});

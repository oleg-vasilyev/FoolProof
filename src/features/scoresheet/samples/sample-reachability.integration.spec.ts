import { describe, expect, it } from "vitest";
import { careerHistories } from "#scoresheet/samples/career-edges.ts";
import { gallery, galleryEvenings } from "#scoresheet/samples/gallery-edges.ts";
import { sampleCareer, sampleEvening } from "#scoresheet/samples/sample-table.ts";
import { posters } from "#scoresheet/samples/site-set.ts";
import type { Finalist, PlayerColumn } from "#shared/repository/repository-contract.ts";
import { LONGEST_NAME, MIN_PLAYERS, MOST_PLAYERS } from "#shared/table/table-limits.ts";


interface Sitting {
  readonly what: string;
  readonly playedOn: string;
  readonly starterId: number | null;
  readonly placements: readonly Finalist[];
}

interface Subject {
  readonly what: string;
  readonly players: readonly PlayerColumn[];
  readonly sittings: readonly Sitting[];
}

const A_DATE_ALONE = /^\d{4}-\d{2}-\d{2}$/;

const PLAYERS_SHARING_A_DRAW = 2;

const FIRST_PLACE = 1;

const ONE_PLACE = 1;

const NONE = 0;

const ascending = (one: number, other: number): number => one - other;

const everyPlaceUpTo = (last: number): readonly number[] =>
  Array.from({ length: Math.max(last, NONE) }, (_unused, index) => index + FIRST_PLACE);

const outrightFinish = (seated: number): readonly number[] => everyPlaceUpTo(seated);

const drawnFinish = (seated: number): readonly number[] => [
  ...everyPlaceUpTo(seated - PLAYERS_SHARING_A_DRAW),
  seated - ONE_PLACE,
  seated - ONE_PLACE,
];

const evenings = (): readonly Subject[] =>
  [
    { what: "the sample evening every mockup is drawn from", evening: sampleEvening() },
    ...galleryEvenings().map((evening, index) => ({
      what: `gallery evening ${String(index + FIRST_PLACE)}, started ${evening.startedOn}`,
      evening,
    })),
  ].map(({ what, evening }) => ({
    what,
    players: evening.players,
    sittings: evening.games.map((game) => ({
      what: `${what}, game ${String(game.gameId)}`,
      playedOn: evening.startedOn,
      starterId: game.starterId,
      placements: game.placements,
    })),
  }));

const careers = (): readonly Subject[] =>
  [
    { what: "the sample career the personal card is drawn from", career: sampleCareer() },
    ...careerHistories().map((career, index) => ({
      what: `career edge ${String(index + FIRST_PLACE)}`,
      career,
    })),
  ].map(({ what, career }) => ({
    what,
    players: career.players,
    sittings: career.games.map((game, index) => ({
      what: `${what}, night ${String(game.seriesNo)}, game ${String(index + FIRST_PLACE)}`,
      playedOn: game.playedOn,
      starterId: game.starterId,
      placements: game.placements,
    })),
  }));

const everySubject = (): readonly Subject[] => [...evenings(), ...careers()];

const everySitting = (): readonly Sitting[] => everySubject().flatMap((subject) => subject.sittings);

describe("the states the samples draw", () => {
  describe("the roster of each one", () => {
    it("should give every player a name a player could actually have entered", () => {
      for (const subject of everySubject()) {
        for (const player of subject.players) {
          const written = [...player.displayName].length;

          expect(player.displayName, `${subject.what}: a name with space around it`).toBe(
            player.displayName.trim()
          );
          expect(written, `${subject.what}: "${player.displayName}" is ${String(written)} long`)
            .toBeGreaterThan(NONE);
          expect(written, `${subject.what}: "${player.displayName}" is ${String(written)} long`)
            .toBeLessThanOrEqual(LONGEST_NAME);
        }
      }
    });

    it("should not seat one player twice, by name or by id", () => {
      for (const subject of everySubject()) {
        const names = subject.players.map((player) => player.displayName);
        const ids = subject.players.map((player) => player.playerId);

        expect([...new Set(names)].length, `${subject.what}: two columns share a name`).toBe(
          names.length
        );
        expect([...new Set(ids)].length, `${subject.what}: two columns share an id`).toBe(ids.length);
      }
    });

    it("should give every column at least one game to show, so no column is one the bot could not have", () => {
      for (const subject of everySubject()) {
        const played = new Set(
          subject.sittings.flatMap((sitting) => sitting.placements.map((one) => one.playerId))
        );

        expect(
          subject.players.filter((player) => !played.has(player.playerId)).map((one) => one.displayName),
          `${subject.what}: a column nobody ever played in`
        ).toEqual([]);
      }
    });
  });

  describe("each game in them", () => {
    it("should seat a table the product would have let a chat open", () => {
      for (const sitting of everySitting()) {
        const seated = sitting.placements.length;

        expect(seated, `${sitting.what}: ${String(seated)} at the table`).toBeGreaterThanOrEqual(
          MIN_PLAYERS
        );
        expect(seated, `${sitting.what}: ${String(seated)} at the table`).toBeLessThanOrEqual(
          MOST_PLAYERS
        );
      }
    });

    it("should place each seated player once and nobody who is not on the sheet", () => {
      for (const subject of everySubject()) {
        const roster = new Set(subject.players.map((player) => player.playerId));

        for (const sitting of subject.sittings) {
          const placed = sitting.placements.map((one) => one.playerId);

          expect([...new Set(placed)].length, `${sitting.what}: somebody finished twice`).toBe(
            placed.length
          );
          expect(
            placed.filter((playerId) => !roster.has(playerId)),
            `${sitting.what}: a finisher who has no column`
          ).toEqual([]);
        }
      }
    });

    it("should end on a finish the card can reach — every place taken, or the last two shared", () => {
      for (const sitting of everySitting()) {
        const finished = sitting.placements.map((one) => one.position).sort(ascending);
        const seated = sitting.placements.length;

        expect(
          [outrightFinish(seated), drawnFinish(seated)].some(
            (allowed) => allowed.join() === finished.join()
          ),
          `${sitting.what}: finished ${finished.join(", ")}, which no evening could record`
        ).toBe(true);
      }
    });

    it("should let whoever opened be somebody who sat down", () => {
      for (const sitting of everySitting()) {
        const seated = sitting.placements.map((one) => one.playerId);

        expect(
          sitting.starterId === null || seated.includes(sitting.starterId),
          `${sitting.what}: opened by ${String(sitting.starterId)}, who never sat down`
        ).toBe(true);
      }
    });

    it("should be dated the way the database stores a date", () => {
      for (const sitting of everySitting()) {
        expect(A_DATE_ALONE.test(sitting.playedOn), `${sitting.what}: ${sitting.playedOn}`).toBe(
          true
        );
      }
    });
  });

  describe("what the tools then write out", () => {
    it("should give every gallery drawing its own file, so none is overwritten by the next", () => {
      const files = gallery().map((drawing) => drawing.file);

      expect([...new Set(files)].sort(), "two drawings claim one file name").toEqual(
        [...files].sort()
      );
    });

    it("should say what every gallery drawing is asking to be looked at for", () => {
      expect(
        gallery()
          .filter((drawing) => drawing.asks.trim().length === NONE)
          .map((drawing) => drawing.file)
      ).toEqual([]);
    });

    it("should draw all three posters, in both languages, from one set", () => {
      const drawn = posters();

      expect(Object.keys(drawn)).toEqual([
        "chronology-en",
        "awards-en",
        "personal-en",
        "chronology-ru",
        "awards-ru",
        "personal-ru",
      ]);

      for (const [name, svg] of Object.entries(drawn)) {
        expect(svg.startsWith("<svg"), `${name} is not a drawing`).toBe(true);
      }
    });

    it("should leave no name the sample was written with on an English poster", () => {
      const english = posters()["chronology-en"] ?? "";
      const asWritten = sampleEvening().players.map((player) => player.displayName);

      expect(asWritten.filter((name) => english.includes(name))).toEqual([]);
    });
  });
});

import { copyIn } from "#scoresheet/copy.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { pastBefore } from "#scoresheet/domain/awards/evening-past.ts";
import { awardReason, awardTitle, awardWinner } from "#scoresheet/render/awards/award-lines.ts";
import { gameTally } from "#scoresheet/render/tally-phrases.ts";
import { createLocaleReader } from "#shared/locale/chat-locale.ts";
import { repository } from "#shared/repository/repository-instance.ts";


const EVERY_WINNER = true;

const SOME_WINNERS = false;

const INDENT = "    ";

export const reportOnTheNewestEvening = (chatId: number): readonly string[] => {
  const chronology = repository.seriesChronology(chatId);

  if (chronology === null) {
    return [`chat ${String(chatId)}: nothing finished here yet`];
  }

  const copy = copyIn(createLocaleReader(repository)(chatId));
  const history = repository.careerHistory(chatId);
  const honours = honoursFor(chronology, pastBefore(history));
  const nameOf = new Map(chronology.players.map((one) => [one.playerId, one.displayName]));
  const opening = `${chronology.startedOn} — ${String(chronology.games.length)} games, ${String(chronology.players.length)} players`;

  if (honours === null) {
    return [opening, "too few games for awards"];
  }

  const awards = honours.awards.flatMap((award) => {
    const names = award.winners.map((one) => nameOf.get(one) ?? String(one));
    const everybody = names.length === chronology.players.length ? EVERY_WINNER : SOME_WINNERS;

    return [
      `${awardTitle(copy, award)} — ${awardWinner(copy, names, everybody)}`,
      `${INDENT}${awardReason(copy, award)}`,
    ];
  });

  return [
    opening,
    ...awards,
    honours.curse === null
      ? "no table curse tonight"
      : `${copy.awardsCurseLabel}: ${copy.curseFact(honours.curse.burns, gameTally(copy, honours.curse.games), honours.curse.predicted)}`,
  ];
};

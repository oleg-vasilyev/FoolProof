import { A_LINE, FIRST_GROUP, SECOND_GROUP } from "../markdown-text.ts";


const ONE = 1;

const FIRST = 0;

const NOT_FOUND = -1;

const NOWHERE = "";

const A_FENCE = /^\s*```/;

const A_FIELD = /^([A-Z][A-Za-z-]*):[ \t]*(.*)$/;

const A_HEDGE_BEFORE_A_NUMBER = /(?:[~≈]|\b(?:about|roughly|around|approx[a-z]*)\b\s+)\d/i;

const A_NUMBER_LEFT_VAGUE = /\d\s*-?ish\b/i;

interface Fields {
  readonly standing: string;
  readonly said: ReadonlyMap<string, string>;
}

const NOTHING_READ: Fields = { standing: NOWHERE, said: new Map() };

export const afterLogLine = (fields: Fields, line: string): Fields => {
  const started = A_FIELD.exec(line);

  if (started) {
    const field = started[FIRST_GROUP] ?? NOWHERE;

    return {
      standing: field,
      said: new Map(fields.said).set(field, started[SECOND_GROUP]?.trim() ?? NOWHERE),
    };
  }

  const carried = fields.said.get(fields.standing);

  if (carried === undefined || line.trim() === NOWHERE) {
    return fields;
  }

  return {
    ...fields,
    said: new Map(fields.said).set(fields.standing, `${carried} ${line.trim()}`.trim()),
  };
};

export const theLogBlockIn = (log: string): readonly string[] => {
  const lines = log.split(A_LINE);
  const opens = lines.findIndex((line) => A_FENCE.test(line));

  if (opens === NOT_FOUND) {
    return [];
  }

  const body = lines.slice(opens + ONE);
  const closes = body.findIndex((line) => A_FENCE.test(line));

  return closes === NOT_FOUND ? body : body.slice(FIRST, closes);
};

export const fieldsIn = (log: string): ReadonlyMap<string, string> =>
  theLogBlockIn(log).reduce(afterLogLine, NOTHING_READ).said;

export const estimateComplaints = (
  file: string,
  fields: ReadonlyMap<string, string>
): readonly string[] =>
  [...fields]
    .filter(([, said]) => A_HEDGE_BEFORE_A_NUMBER.test(said) || A_NUMBER_LEFT_VAGUE.test(said))
    .map(
      ([field, said]) =>
        `${file}: "${field}: ${said}" hedges a number. A log read a week later cannot tell a ` +
        `measurement from a guess, and a guess averaged with four real numbers poisons all ` +
        `five — so a number nobody measured is written "not measured", never estimated`
    );

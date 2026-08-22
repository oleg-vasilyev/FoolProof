const NOTHING = 0;

const CERTAIN = 1;

const ONE_STEP = 1;

const AT_THE_MODE = 1;

interface Walked {
  readonly mass: number;
  readonly all: number;
  readonly counted: number;
}

const AT_REST: Walked = { mass: AT_THE_MODE, all: NOTHING, counted: NOTHING };

const modeOf = (trials: number, chance: number): number =>
  Math.floor((trials + ONE_STEP) * chance);

const walk = (
  steps: number,
  ratioAt: (step: number) => number,
  countAt: (step: number) => boolean
): Walked =>
  Array.from({ length: steps }, () => NOTHING).reduce<Walked>((walked, _, index) => {
    const step = index + ONE_STEP;
    const mass = walked.mass * ratioAt(step);

    return {
      mass,
      all: walked.all + mass,
      counted: walked.counted + (countAt(step) ? mass : NOTHING),
    };
  }, AT_REST);

const shareOfTail = (
  trials: number,
  chance: number,
  counts: (seen: number) => boolean
): number => {
  const mode = modeOf(trials, chance);
  const odds = chance / (CERTAIN - chance);

  const above = walk(
    trials - mode,
    (step) => ((trials - mode - step + ONE_STEP) / (mode + step)) * odds,
    (step) => counts(mode + step)
  );

  const below = walk(
    mode,
    (step) => ((mode - step + ONE_STEP) / (trials - mode + step)) / odds,
    (step) => counts(mode - step)
  );

  const total = AT_THE_MODE + above.all + below.all;
  const tail =
    (counts(mode) ? AT_THE_MODE : NOTHING) + above.counted + below.counted;

  return tail / total;
};

const certainWhen = (holds: boolean): number => (holds ? CERTAIN : NOTHING);

const tailOf = (
  trials: number,
  chance: number,
  counts: (seen: number) => boolean,
  whenNeverHappens: boolean,
  whenAlwaysHappens: boolean
): number => {
  if (trials <= NOTHING || chance <= NOTHING) {
    return certainWhen(whenNeverHappens);
  }

  if (chance >= CERTAIN) {
    return certainWhen(whenAlwaysHappens);
  }

  return shareOfTail(trials, chance, counts);
};

export const usualOver = (chance: number, trials: number): number =>
  Math.round(chance * trials);

export const atLeast = (wanted: number, trials: number, chance: number): number =>
  tailOf(
    trials,
    chance,
    (seen) => seen >= wanted,
    wanted <= NOTHING,
    wanted <= trials
  );

export const atMost = (wanted: number, trials: number, chance: number): number =>
  tailOf(
    trials,
    chance,
    (seen) => seen <= wanted,
    wanted >= NOTHING,
    wanted >= trials
  );

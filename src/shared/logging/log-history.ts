const KEPT = 8;

const NONE = 0;

const ONE = 1;

export interface Problem {
  readonly at: string;
  readonly level: string;
  readonly message: string;
}

export interface ProblemTally {
  readonly warn: number;
  readonly error: number;
}

const recent: Problem[] = [];

const seen = { warn: NONE, error: NONE };

export const recordProblem = (level: "warn" | "error", message: string): void => {
  seen[level] = seen[level] + ONE;

  recent.push({ at: new Date().toISOString(), level, message });

  if (recent.length > KEPT) {
    recent.shift();
  }
};

export const problemsSeen = (): readonly Problem[] => [...recent];

export const problemTally = (): ProblemTally => ({ warn: seen.warn, error: seen.error });

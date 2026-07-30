const ZERO = 0;

export const numberOr = (value: unknown, fallback: number): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return fallback;
};

export const num = (value: unknown): number => numberOr(value, ZERO);

export const nullableNum = (value: unknown): number | null =>
  value === null || value === undefined ? null : num(value);

export const text = (value: unknown): string => (typeof value === "string" ? value : "");

export const nullableText = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

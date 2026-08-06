const kindOf = (value: unknown): string => (value === null ? "null" : typeof value);

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return null;
};

export const numberOr = (value: unknown, fallback: number): number => asNumber(value) ?? fallback;

export const requireNum = (value: unknown): number => {
  const found = asNumber(value);

  if (found === null) {
    throw new Error(`expected a number from the database, found ${kindOf(value)}`);
  }

  return found;
};

export const nullableNum = (value: unknown): number | null =>
  value === null || value === undefined ? null : requireNum(value);

export const requireText = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  throw new Error(`expected text from the database, found ${kindOf(value)}`);
};

export const nullableText = (value: unknown): string | null =>
  value === null || value === undefined ? null : requireText(value);

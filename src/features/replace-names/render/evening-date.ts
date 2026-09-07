import type { Copy } from "#replace-names/copy.ts";


const FIRST_MONTH = 1;

const BETWEEN_PARTS = "-";

export const eveningDate = (copy: Copy, isoDate: string): string => {
  const [, month, day] = isoDate.split(BETWEEN_PARTS);
  const name = copy.months[Number(month) - FIRST_MONTH];

  return name === undefined || day === undefined
    ? isoDate
    : copy.eveningDate(String(Number(day)), name);
};

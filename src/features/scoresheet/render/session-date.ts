import type { Copy } from "#scoresheet/copy.ts";


const FIRST_MONTH = 1;

export const sessionDate = (copy: Copy, isoDate: string): string => {
  const [year = "", month, day] = isoDate.split("-");
  const name = copy.months[Number(month) - FIRST_MONTH];

  return name === undefined || day === undefined
    ? isoDate
    : copy.sheetDate(String(Number(day)), name, year);
};

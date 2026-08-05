const MS_PER_SECOND = 1000;

const SECONDS_PER_MINUTE = 60;

const MINUTES_PER_HOUR = 60;

const HOURS_PER_DAY = 24;

const BYTES_PER_KB = 1024;

const NONE = 0;

const ONE_DECIMAL = 1;

export interface UnitLabels {
  readonly days: string;
  readonly hours: string;
  readonly minutes: string;
  readonly kilobytes: string;
  readonly megabytes: string;
}

export const humanDuration = (ms: number, units: UnitLabels): string => {
  const minutes = Math.floor(ms / MS_PER_SECOND / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const days = Math.floor(hours / HOURS_PER_DAY);

  if (days > NONE) {
    return `${days}${units.days} ${hours % HOURS_PER_DAY}${units.hours}`;
  }

  if (hours > NONE) {
    return `${hours}${units.hours} ${minutes % MINUTES_PER_HOUR}${units.minutes}`;
  }

  return `${minutes}${units.minutes}`;
};

export const humanSize = (bytes: number, units: UnitLabels): string => {
  const kb = bytes / BYTES_PER_KB;

  if (kb < BYTES_PER_KB) {
    return `${Math.round(kb)} ${units.kilobytes}`;
  }

  return `${(kb / BYTES_PER_KB).toFixed(ONE_DECIMAL)} ${units.megabytes}`;
};

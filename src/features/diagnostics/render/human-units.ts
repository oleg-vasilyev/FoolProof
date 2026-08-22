const MS_PER_SECOND = 1000;

const SECONDS_PER_MINUTE = 60;

const MINUTES_PER_HOUR = 60;

const HOURS_PER_DAY = 24;

const BYTES_PER_KB = 1024;

const NONE = 0;

const TENTHS_PER_UNIT = 10;

export interface UnitLabels {
  readonly days: string;
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
  readonly kilobytes: string;
  readonly megabytes: string;
  readonly decimal: string;
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

const toOneDecimal = (value: number, decimal: string, unit: string): string => {
  const tenths = Math.round(value * TENTHS_PER_UNIT);

  return `${Math.floor(tenths / TENTHS_PER_UNIT)}${decimal}${tenths % TENTHS_PER_UNIT} ${unit}`;
};

export const humanSeconds = (ms: number, units: UnitLabels): string =>
  toOneDecimal(ms / MS_PER_SECOND, units.decimal, units.seconds);

export const humanSize = (bytes: number, units: UnitLabels): string => {
  const kb = bytes / BYTES_PER_KB;

  return kb < BYTES_PER_KB
    ? `${Math.round(kb)} ${units.kilobytes}`
    : toOneDecimal(kb / BYTES_PER_KB, units.decimal, units.megabytes);
};

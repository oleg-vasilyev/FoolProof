const MS_PER_SECOND = 1000;

const SECONDS_PER_MINUTE = 60;

const MINUTES_PER_HOUR = 60;

const HOURS_PER_DAY = 24;

const BYTES_PER_KB = 1024;

const NONE = 0;

const ONE = 1;

const ONE_DECIMAL = 1;

export const counted = (count: number, one: string, many: string): string =>
  `${count} ${count === ONE ? one : many}`;

export const humanDuration = (ms: number): string => {
  const minutes = Math.floor(ms / MS_PER_SECOND / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const days = Math.floor(hours / HOURS_PER_DAY);

  if (days > NONE) {
    return `${days}d ${hours % HOURS_PER_DAY}h`;
  }

  if (hours > NONE) {
    return `${hours}h ${minutes % MINUTES_PER_HOUR}m`;
  }

  return `${minutes}m`;
};

export const humanSize = (bytes: number): string => {
  const kb = bytes / BYTES_PER_KB;

  if (kb < BYTES_PER_KB) {
    return `${Math.round(kb)} KB`;
  }

  return `${(kb / BYTES_PER_KB).toFixed(ONE_DECIMAL)} MB`;
};

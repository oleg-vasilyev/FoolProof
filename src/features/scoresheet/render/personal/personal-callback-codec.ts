export const PERSONAL_TAPS = /^pc:([0-9]+)$/;

const PREFIX = "pc";

const BETWEEN = ":";

const FIRST_GROUP = 1;

export const encodePersonalCallback = (playerId: number): string =>
  [PREFIX, String(playerId)].join(BETWEEN);

export const decodePersonalCallback = (data: string): number | null => {
  const match = PERSONAL_TAPS.exec(data);

  return match === null ? null : Number(match[FIRST_GROUP]);
};

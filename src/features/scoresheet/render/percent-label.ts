const PERCENT = 100;

export const percentLabel = (share: number): string => `${String(Math.round(share * PERCENT))}%`;

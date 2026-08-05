export const Locale = {
  En: "en",
  Ru: "ru",
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const LOCALES: readonly Locale[] = [Locale.En, Locale.Ru];

export const DEFAULT_LOCALE: Locale = Locale.En;

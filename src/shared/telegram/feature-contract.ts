import type { CallbackTap, Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { Locale } from "#shared/locale/locales.ts";


export interface CommandRoute {
  readonly command: string;
  readonly menuDescription: (locale: Locale) => string;
  readonly help: (locale: Locale) => string;
  readonly hidden?: boolean;
  readonly run: (ctx: Command) => Promise<void>;
}

export interface Listeners {
  readonly onText: (run: (ctx: TextMessage) => Promise<void>) => void;
  readonly onTap: (owns: RegExp, run: (ctx: CallbackTap) => Promise<void>) => void;
}

export interface Feature {
  readonly commands: readonly CommandRoute[];
  readonly notes?: (locale: Locale) => readonly string[];
  readonly listen?: (listeners: Listeners) => void;
  readonly resume?: () => Promise<void>;
  readonly stop?: () => Promise<void>;
}

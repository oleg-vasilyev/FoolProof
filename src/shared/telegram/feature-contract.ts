import type { CallbackTap, Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";


export interface CommandRoute {
  readonly command: string;
  readonly menuDescription: string;
  readonly help: string;
  readonly hidden?: boolean;
  readonly run: (ctx: Command) => Promise<void>;
}

export interface Listeners {
  readonly onText: (run: (ctx: TextMessage) => Promise<void>) => void;
  readonly onTap: (owns: RegExp, run: (ctx: CallbackTap) => Promise<void>) => void;
}

export interface Feature {
  readonly commands: readonly CommandRoute[];
  readonly notes?: readonly string[];
  readonly listen?: (listeners: Listeners) => void;
  readonly resume?: () => Promise<void>;
  readonly stop?: () => Promise<void>;
}

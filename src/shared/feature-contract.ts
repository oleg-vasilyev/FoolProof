import type { CallbackTap, Command, TextMessage } from "#shared/telegram-contexts.ts";


export interface CommandRoute {
  readonly command: string;
  readonly menuDescription: string;
  readonly help: string;
  readonly run: (ctx: Command) => Promise<void>;
}

export interface Listeners {
  readonly onText: (run: (ctx: TextMessage) => Promise<void>) => void;
  readonly onTap: (run: (ctx: CallbackTap) => Promise<void>) => void;
}

export interface Feature {
  readonly commands: readonly CommandRoute[];
  readonly notes?: readonly string[];
  readonly listen?: (listeners: Listeners) => void;
  readonly stop?: () => Promise<void>;
}

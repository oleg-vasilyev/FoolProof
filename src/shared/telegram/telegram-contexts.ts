import type { CommandContext, Context, Filter } from "grammy";


export type Command = CommandContext<Context>;

export type TextMessage = Filter<Context, "message:text">;

export type CallbackTap = Filter<Context, "callback_query:data">;

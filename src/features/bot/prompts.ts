import type { Api } from "grammy";
import type { Logger } from "../../shared/logger.ts";


export interface PromptRegistry {
  remember(chatId: number, messageId: number): void;
  forget(chatId: number): void;
  dropUnanswered(chatId: number): Promise<void>;
}

export const createPromptRegistry = (api: Api, log: Logger): PromptRegistry => {
  const open = new Map<number, number>();

  return {
    remember: (chatId, messageId) => void open.set(chatId, messageId),

    forget: (chatId) => void open.delete(chatId),

    async dropUnanswered(chatId) {
      const messageId = open.get(chatId);
      if (messageId === undefined) {
        return;
      }

      open.delete(chatId);

      try {
        await api.deleteMessage(chatId, messageId);
      } catch (error) {
        log.debug(`could not delete message ${messageId}: ${String(error)}`);
      }
    },
  };
};

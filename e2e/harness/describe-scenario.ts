import { afterAll, afterEach, beforeAll, beforeEach, describe } from "vitest";
import { createChat, type Chat } from "./scenario-chat.ts";


const FAILED = "fail";

export const describeScenario = (name: string, cases: (chat: Chat) => void): void => {
  describe(name, () => {
    const chat = createChat();

    let firstFailure: string | null = null;

    beforeAll(async () => {
      await chat.open(name);
    });

    afterAll(async () => {
      chat.verdict(firstFailure === null ? "passed" : "failed", firstFailure);
      await chat.close();
    });

    beforeEach((context) => {
      chat.step(context.task.name);
    });

    afterEach((context) => {
      if (context.task.result?.state !== FAILED) {
        return;
      }

      firstFailure ??= context.task.result.errors?.[0]?.message ?? context.task.name;
      chat.verdict("failed", firstFailure);
    });

    cases(chat);
  });
};

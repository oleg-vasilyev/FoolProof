import { afterAll, afterEach, beforeAll, beforeEach, describe } from "vitest";
import { createChat, type Chat } from "./scenario-chat.ts";


const FAILED = "fail";

export const describeScenario = (
  name: string,
  cases: (chat: Chat) => void
): void => {
  describe(name, () => {
    const chat = createChat();

    beforeAll(async () => {
      await chat.open(name);
    });

    afterAll(async () => {
      await chat.close();
    });

    beforeEach((context) => {
      chat.step(context.task.name);
      chat.verdict("running", null);
    });

    afterEach((context) => {
      const failure = context.task.result?.errors?.[0]?.message ?? null;

      chat.verdict(
        context.task.result?.state === FAILED ? "failed" : "running",
        failure
      );
    });

    cases(chat);
  });
};

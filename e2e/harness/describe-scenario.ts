import { afterAll, afterEach, beforeAll, beforeEach, describe } from "vitest";
import { captionsOf, type ChatMessage } from "../fake-telegram/chat-log.ts";
import { createChat, type Chat } from "./scenario-chat.ts";


const FAILED = "fail";

const NOTHING = 0;

const BETWEEN_SCREENS = "; ";

// A real evening leaves no keyboard behind: a card ends on Confirm or Cancel, and a
// /merge screen ends the same way. A scenario that walks off mid-card leaves the
// chat looking like something a player could still tap, which is the one thing the
// harness is meant to show truthfully.
const screensLeftOpen = (open: readonly ChatMessage[]): string => {
  const listed = open
    .map((message) => `#${String(message.messageId)} [${captionsOf(message).join(", ")}]`)
    .join(BETWEEN_SCREENS);

  return `the chat was left with a screen still open: ${listed}. End it the way an evening does — Confirm or Cancel.`;
};

export const describeScenario = (name: string, cases: (chat: Chat) => void): void => {
  describe(name, () => {
    const chat = createChat();

    let firstFailure: string | null = null;

    beforeAll(async () => {
      await chat.open(name);
    });

    afterAll(async () => {
      const open = chat.messages().filter(
        (message) => message.fromBot && message.buttons.length > NOTHING
      );

      const leftOpen = open.length === NOTHING ? null : screensLeftOpen(open);
      const alreadyFailed = firstFailure !== null;

      firstFailure ??= leftOpen;
      chat.verdict(firstFailure === null ? "passed" : "failed", firstFailure);
      await chat.close();

      if (leftOpen !== null && !alreadyFailed) {
        throw new Error(leftOpen);
      }
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

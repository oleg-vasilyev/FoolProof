import { vi } from "vitest";


type ForceReplyPromptModule = typeof import("#shared/telegram/force-reply-prompt.ts");

export const PROMPT_MESSAGE_ID = 9001;

export class ForceReplyPromptStub {
  public askAsReplySpy = vi.fn<ForceReplyPromptModule["askAsReply"]>();
  public answeredPromptTextSpy = vi.fn<ForceReplyPromptModule["answeredPromptText"]>();

  public readonly module: ForceReplyPromptModule;

  public constructor() {
    this.askAsReplySpy.mockResolvedValue({ message_id: PROMPT_MESSAGE_ID } as never);
    this.answeredPromptTextSpy.mockReturnValue(null);

    this.module = {
      askAsReply: (ctx, question, placeholder) => this.askAsReplySpy(ctx, question, placeholder),
      answeredPromptText: (ctx) => this.answeredPromptTextSpy(ctx),
    };
  }
}

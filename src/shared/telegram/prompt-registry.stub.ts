import { vi } from "vitest";
import type { PromptRegistry } from "#shared/telegram/prompt-registry.ts";


export class PromptRegistryStub {
  public rememberSpy = vi.fn();
  public forgetSpy = vi.fn();
  public dropUnansweredSpy = vi.fn();

  public readonly registry: PromptRegistry;

  public constructor() {
    this.dropUnansweredSpy.mockResolvedValue(undefined);

    this.registry = {
      remember: this.rememberSpy,
      forget: this.forgetSpy,
      dropUnanswered: this.dropUnansweredSpy,
    };
  }
}

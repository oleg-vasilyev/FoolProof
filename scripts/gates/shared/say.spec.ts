import { afterEach, describe, expect, it, vi } from "vitest";
import { say } from "./say.ts";


const ONE_LINE = 1;

describe("say", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should put the line on standard output, which is the whole of its job", () => {
    const printed = vi.spyOn(console, "log").mockImplementation(() => undefined);

    say("check-docs: green in 0.8s");

    expect(printed).toHaveBeenCalledTimes(ONE_LINE);
    expect(printed).toHaveBeenCalledWith("check-docs: green in 0.8s");
  });

  it("should pass a blank line through rather than swallowing it", () => {
    const printed = vi.spyOn(console, "log").mockImplementation(() => undefined);

    say("");

    expect(printed).toHaveBeenCalledWith("");
  });
});

import { describe, expect, it } from "vitest";
import { lastAssistantTextOf, textOf } from "./the-last-thing-said.ts";


const said = (text: string): string =>
  JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text }] } });

const asked = (text: string): string =>
  JSON.stringify({ type: "user", message: { content: [{ type: "text", text }] } });

describe("textOf", () => {
  it("should join the text parts of an entry, which is what was actually said", () => {
    const content = [
      { type: "text", text: "Первое." },
      { type: "text", text: "Второе." },
    ];

    expect(textOf(content)).toBe("Первое.\nВторое.");
  });

  it("should take a plain string, because a transcript format may hand one over", () => {
    expect(textOf("  Просто строка.  ")).toBe("Просто строка.");
  });

  it("should ignore a part that is not text, so a tool call is not read as speech", () => {
    const content = [
      { type: "tool_use", text: "rm -rf" },
      { type: "text", text: "Готово." },
    ];

    expect(textOf(content)).toBe("Готово.");
  });

  it("should say nothing for an entry with no content at all", () => {
    expect(textOf(undefined)).toBe("");
  });
});

describe("lastAssistantTextOf", () => {
  it("should take the newest thing the assistant said", () => {
    const transcript = [said("Начинаю."), said("Продолжаю.")].join("\n");

    expect(lastAssistantTextOf(transcript)).toBe("Продолжаю.");
  });

  it("should ignore what the user said, however recently", () => {
    const transcript = [said("Продолжаю."), asked("окей")].join("\n");

    expect(lastAssistantTextOf(transcript)).toBe("Продолжаю.");
  });

  it("should skip an entry that says nothing, so a tool-only turn is not the answer", () => {
    const toolOnly = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "tool_use", id: "x" }] },
    });

    expect(lastAssistantTextOf([said("Продолжаю."), toolOnly].join("\n"))).toBe("Продолжаю.");
  });

  it("should step over a line that is not JSON rather than giving up on the file", () => {
    const transcript = ["{ broken", said("Продолжаю.")].join("\n");

    expect(lastAssistantTextOf(transcript)).toBe("Продолжаю.");
  });

  it("should read a transcript written with carriage returns", () => {
    expect(lastAssistantTextOf(`${said("Начинаю.")}\r\n${said("Продолжаю.")}\r\n`)).toBe(
      "Продолжаю."
    );
  });

  it("should say nothing for a transcript with nothing in it", () => {
    expect(lastAssistantTextOf("")).toBe("");
  });
});

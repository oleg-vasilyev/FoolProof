import { describe, expect, it } from "vitest";
import {
  THE_REFUSAL,
  endsOnAPromise,
  handsTheTurnBack,
  lastSentenceOf,
} from "./a-turn-ending-on-a-promise.ts";


const AS_LONG_AS_ALLOWED = 8;

const ONE_WORD_TOO_MANY = 9;

const BETWEEN_WORDS = /\s+/u;

describe("lastSentenceOf", () => {
  it("should take the closing sentence, which is where an intention is stated", () => {
    expect(lastSentenceOf("Осталось три файла и ревью. Продолжаю.")).toBe("Продолжаю.");
  });

  it("should let a fenced block be the last thing said, not the words introducing it", () => {
    const message = "Запускаю проверку:\n\n```\n3711 passed\n```";

    expect(lastSentenceOf(message)).toBe("…");
  });

  it("should not swallow the words between two fences by reading them as one block", () => {
    const message = "```\nfirst\n```\n\nВсё сошлось.\n\n```\nsecond\n```";

    expect(lastSentenceOf(message)).toBe("…");
    expect(lastSentenceOf(`${message}\n\nГотово.`)).toBe("Готово.");
  });

  it("should strip the ornament a bullet or a bold run leaves around a sentence", () => {
    expect(lastSentenceOf("- **Продолжаю.**")).toBe("Продолжаю.");
  });

  it("should strip an ornament that trails a sentence with none in front of it", () => {
    expect(lastSentenceOf("Продолжаю.**")).toBe("Продолжаю.");
  });

  it("should treat a line break as the end of a sentence that carried no full stop", () => {
    expect(lastSentenceOf("Первое\nВторое")).toBe("Второе");
  });

  it("should read past however much space was left between two sentences", () => {
    expect(lastSentenceOf("Первое.   Второе.")).toBe("Второе.");
  });

  it("should drop a line that is nothing but ornament rather than calling it the ending", () => {
    expect(lastSentenceOf("Готово.\n\n---\n")).toBe("Готово.");
  });

  it("should say nothing for a message with nothing in it", () => {
    expect(lastSentenceOf("   \n\n  ")).toBe("");
  });
});

describe("handsTheTurnBack", () => {
  it("should read a question as handing the turn back", () => {
    expect(handsTheTurnBack("Начинаю?")).toBe(true);
  });

  it("should read a fullwidth question mark the same way", () => {
    expect(handsTheTurnBack("Начинаю？")).toBe(true);
  });

  it("should read a colon as introducing what follows rather than closing", () => {
    expect(handsTheTurnBack("Запускаю проверку:")).toBe(true);
  });

  it("should read a promise conditioned on the owner as waiting, not as intent", () => {
    expect(handsTheTurnBack("Продолжу после твоего ответа.")).toBe(true);
    expect(handsTheTurnBack("Начну по твоей команде.")).toBe(true);
    expect(handsTheTurnBack("I'll continue once you confirm.")).toBe(true);
  });

  it("should not read an ordinary finished sentence as a handback", () => {
    expect(handsTheTurnBack("Продолжаю.")).toBe(false);
  });
});

describe("endsOnAPromise", () => {
  it("should catch the message that cost a phase: a list of what is left, then a word of intent", () => {
    const message =
      "Осталось: две зоны линтера, тесты на samples/, документы, ревью, ретро. Продолжаю.";

    expect(endsOnAPromise(message)).toBe(true);
  });

  it("should catch the same shape in English", () => {
    expect(endsOnAPromise("Three files left to write. Continuing.")).toBe(true);
  });

  it("should let a promise the owner has to answer through", () => {
    expect(endsOnAPromise("Готово по первой части. Продолжу, когда дашь добро.")).toBe(false);
  });

  it("should let a turn that ends in the output it just produced through", () => {
    expect(endsOnAPromise("Запускаю проверку:\n\n```\n3711 passed\n```")).toBe(false);
  });

  it("should let a finished report through", () => {
    const message = "Фаза закрыта и запушена, CI зелёный. Тега нет: бот не менялся.";

    expect(endsOnAPromise(message)).toBe(false);
  });

  it("should not fire on a sentence that merely opens with a time word", () => {
    expect(endsOnAPromise("Сейчас в репозитории 3697 тестов в 162 файлах.")).toBe(false);
  });

  it("should not fire on a word that merely starts with an intention", () => {
    expect(endsOnAPromise("Начинающий разработчик.")).toBe(false);
  });

  it("should not fire when the intention is not what the sentence opens with", () => {
    expect(endsOnAPromise("Всё готово, продолжаю не я.")).toBe(false);
  });

  it("should still fire on an announcement exactly as long as one is allowed to be", () => {
    const eight = "Продолжаю со второго файла и до конца списка.";

    expect(eight.split(BETWEEN_WORDS)).toHaveLength(AS_LONG_AS_ALLOWED);
    expect(endsOnAPromise(eight)).toBe(true);
  });

  it("should stop firing one word past that, where a sentence is explaining rather than announcing", () => {
    const nine = "Продолжаю со второго файла и до самого конца списка.";

    expect(nine.split(BETWEEN_WORDS)).toHaveLength(ONE_WORD_TOO_MANY);
    expect(endsOnAPromise(nine)).toBe(false);
  });

  it("should not fire when the intention was stated and the work then followed", () => {
    const message = "Начинаю. Размер: восемь файлов. Готово, гейты зелёные.";

    expect(endsOnAPromise(message)).toBe(false);
  });

  it("should not fire on an intention quoted inside a code fence", () => {
    expect(endsOnAPromise("Вывод:\n\n```\nПродолжаю.\n```\n\nВот и всё.")).toBe(false);
  });

  it("should say nothing about an empty message rather than blocking it", () => {
    expect(endsOnAPromise("")).toBe(false);
  });
});

describe("THE_REFUSAL", () => {
  it("should ask whether the announced work is done, which is the whole point of blocking", () => {
    expect(THE_REFUSAL).toContain("is the work you just announced done");
    expect(THE_REFUSAL).toContain("The announcement is not the deliverable");
  });

  it("should say plainly that stopping with a reason is allowed, so it cannot read as a ban", () => {
    expect(THE_REFUSAL).toContain("say why in a sentence the owner can act on");
    expect(THE_REFUSAL).toContain("a stop that reads as a promise is not");
  });

  it("should carry the incident that earned it, so nobody deletes it as boilerplate", () => {
    expect(THE_REFUSAL).toContain("left a phase of this project half-finished");
  });
});

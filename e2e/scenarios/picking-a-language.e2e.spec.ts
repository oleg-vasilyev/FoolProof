import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


describeScenario("picking the language a chat is played in", (chat) => {
  it("should open a screen with one button per language", async () => {
    await chat.say("/language");

    expect(chat.captions()).toEqual(["✅ English", "Русский"]);
  });

  it("should ask the question in the language the chat speaks today", () => {
    expect(chat.cardText()).toContain("Language");
    expect(chat.cardText()).toContain("Which language should the bot speak");
  });

  it("should answer the tap in the language just chosen", async () => {
    await chat.tap("Русский");

    expect(chat.lastAnswer()).toBe("Выбрано: Русский");
  });

  it("should replace the screen with a confirmation, and take the buttons away", () => {
    expect(chat.lastText()).toContain("Теперь бот говорит здесь так: Русский");
    expect(chat.captions()).toEqual([]);
  });

  it("should republish the command menu in that language", () => {
    expect(chat.menuDescriptions()).toContain("Открыть партию — /game Олег, Аня, Рома");
  });

  it("should speak Russian from the next command onwards", async () => {
    await chat.say("/next");

    expect(chat.lastText()).toBe("Здесь ещё не было составов. Начни с /game и имён.");
  });

  it("should draw the card in Russian too", async () => {
    await chat.say("/game Олег, Аня, Рома");

    expect(chat.cardText()).toContain("Партия 1");
    expect(chat.cardText()).toContain("Кто ходил первым?");
    expect(chat.captions()).toContain("❌ Отмена");
  });

  it("should name the seat in Russian when a name is tapped", async () => {
    await chat.tap("Олег");

    expect(chat.lastAnswer()).toBe("Олег ходит первым");
  });

  it("should say so in Russian when the card is cancelled", async () => {
    await chat.tap("❌ Отмена");

    expect(chat.lastAnswer()).toBe("Отменено");
    expect(chat.lastText()).toBe("Отменено — ничего не записано.");
  });

  it("should ask for the names in Russian when the command carries none", async () => {
    await chat.say("/game");

    expect(chat.lastText()).toBe("Кто играет? Пришли имена в порядке посадки.");
  });

  it("should recognise the answer to a question it asked in Russian", async () => {
    await chat.replyToPrompt("Олег, Аня");

    expect(chat.cardText()).toContain("Партия 1");
    expect(chat.captions()).toContain("Олег");
  });

  it("should leave that card closed", async () => {
    await chat.tap("❌ Отмена");

    expect(chat.captions()).toEqual([]);
  });

  it("should offer the screen in Russian the second time it is opened", async () => {
    await chat.say("/language");

    expect(chat.cardText()).toContain("Язык");
    expect(chat.captions()).toEqual(["English", "✅ Русский"]);
  });

  it("should switch back, marking the language the chat now speaks", async () => {
    await chat.tap("English");

    expect(chat.lastAnswer()).toBe("English it is");
    expect(chat.lastText()).toContain("The bot now speaks English here.");
  });

  it("should have the menu back in English as well", () => {
    expect(chat.menuDescriptions()).toContain("Open a game — /game Oleg, Anya, Roma");
  });

  it("should remember the choice across a restart", async () => {
    await chat.say("/language");
    await chat.tap("Русский");
    await chat.restartBot();

    await chat.say("/language");

    expect(chat.captions()).toEqual(["English", "✅ Русский"]);
  });

  it("should leave the screen closed on English again", async () => {
    await chat.tap("English");

    expect(chat.captions()).toEqual([]);
  });
});

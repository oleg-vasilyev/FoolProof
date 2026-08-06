import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";
import type { Chat } from "../harness/scenario-chat.ts";


const PNG_MAGIC = "89504e47";

const MAGIC_LENGTH = 4;

const NOTHING = 0;

const BOTH_PICTURES = 2;

const CONFIRM = "✅ Записать";

const FULL_TABLE = [
  "Александра-Константиновна",
  "Владимир-Вячеславович",
  "Екатерина",
  "Роман",
  "Вероника",
  "Анастасия",
  "Дмитрий",
  "Ольга",
  "Святослав",
  "Аня",
];

const speakRussian = async (chat: Chat): Promise<void> => {
  await chat.say("/language");
  await chat.tap("Русский");
};

const playAnotherGame = async (chat: Chat, exits: readonly string[]): Promise<void> => {
  await chat.say("/next");

  for (const name of exits) {
    await chat.tap(name);
  }

  await chat.tap(CONFIRM);
};

const captionOfLastPhoto = (chat: Chat): string =>
  chat
    .messages()
    .filter((message) => message.photo !== null)
    .at(-1)?.text ?? "";

describeScenario("the pictures a Russian chat gets back", (chat) => {
  it("should refuse the awards in Russian while the evening is still short", async () => {
    await speakRussian(chat);

    await chat.say("/game Олег, Аня, Рома");
    await chat.tap("Олег");
    await chat.tap("Аня");
    await chat.tap("Рома");
    await chat.tap(CONFIRM);

    await chat.say("/stats_awards");

    expect(chat.lastText()).toContain("Для наград ещё рано");
    expect(chat.lastText()).toContain("5 партий");
  });

  it("should draw the chronology as a PNG", async () => {
    await chat.say("/stats_chronology");

    const picture = chat.photoBytes();

    expect(picture?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
  });

  it("should caption it in Russian, with the forms a count of one takes", () => {
    expect(captionOfLastPhoto(chat)).toBe("1 партия · 3 игрока");
  });

  it("should send both pictures once the evening is long enough", async () => {
    await playAnotherGame(chat, ["Рома", "Олег"]);
    await playAnotherGame(chat, ["Олег", "Аня"]);
    await playAnotherGame(chat, ["Аня", "Рома"]);
    await playAnotherGame(chat, ["Рома", "Аня"]);

    const before = chat.photosSent();

    await chat.say("/stats");

    expect(chat.photosSent()).toBe(before + BOTH_PICTURES);
  });

  it("should leave the awards picture without a caption of its own", () => {
    expect(captionOfLastPhoto(chat)).toBe("");
  });

  it("should caption the chronology of that pair, not the awards", () => {
    const captions = chat
      .messages()
      .filter((message) => message.photo !== null)
      .map((message) => message.text);

    expect(captions.at(-BOTH_PICTURES)).toBe("5 партий · 3 игрока");
  });
});

describeScenario("the pictures a full table gets back", (chat) => {
  it("should seat every player a table may hold", async () => {
    await speakRussian(chat);

    await chat.say(`/game ${FULL_TABLE.join(", ")}`);

    expect(chat.captions()).toHaveLength(FULL_TABLE.length + 1);
  });

  it("should record a game between all of them", async () => {
    await chat.tap(FULL_TABLE[0] ?? "");

    for (const name of FULL_TABLE.slice(NOTHING, FULL_TABLE.length - 1)) {
      await chat.tap(name);
    }

    await chat.tap(CONFIRM);

    expect(chat.captions()).toEqual([]);
  });

  it("should draw a chronology ten columns wide", async () => {
    await chat.say("/stats_chronology");

    expect(chat.photoBytes()?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
  });

  it("should say how many sat down, in the form Russian gives ten", () => {
    expect(captionOfLastPhoto(chat)).toBe("1 партия · 10 игроков");
  });
});

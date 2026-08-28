import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";
import type { Chat } from "../harness/scenario-chat.ts";


const PNG_MAGIC = "89504e47";

const MAGIC_LENGTH = 4;

const NOTHING = 0;

const BOTH_PICTURES = 2;

const PICTURES_SO_FAR = 3;

const WIDTH_AT = 16;

const HEIGHT_AT = 20;

const POSTER_WIDTH = 1620;

const TELEGRAM_HEIGHT_LIMIT = 2560;

const CONFIRM = "🟢 Записать";

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
  it("should refuse the awards in Russian and name what the evening still owes", async () => {
    await speakRussian(chat);

    await chat.say("/game Олег, Аня, Рома");
    await chat.tap("Олег");
    await chat.tap("Аня");
    await chat.tap("Рома");
    await chat.tap(CONFIRM);

    await chat.say("/stats_awards");

    expect(chat.lastText()).toContain("Ещё 4 партии");
    expect(chat.lastText()).toContain("награды появятся");
  });

  it("should draw the chronology as a PNG", async () => {
    await chat.say("/stats_chronology");

    const picture = chat.photoBytes();

    expect(picture?.subarray(NOTHING, MAGIC_LENGTH).toString("hex")).toBe(PNG_MAGIC);
  });

  it("should caption it in Russian with the games the awards are still owed", () => {
    expect(captionOfLastPhoto(chat)).toBe("Отыграйте ещё 4 партии — и у вечера будут награды.");
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

  it("should stop captioning the chronology once the awards speak for themselves", () => {
    const captions = chat
      .messages()
      .filter((message) => message.photo !== null)
      .map((message) => message.text);

    expect(captions).toHaveLength(PICTURES_SO_FAR);
    expect(captions.at(-BOTH_PICTURES)).toBe("");
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

  it("should caption a ten-column picture in Russian like any other", () => {
    expect(captionOfLastPhoto(chat)).toBe("Отыграйте ещё 4 партии — и у вечера будут награды.");
  });

  it("should draw it at the poster's own width, whatever the names did to the headings", () => {
    expect(chat.photoBytes()?.readUInt32BE(WIDTH_AT)).toBe(POSTER_WIDTH);
  });

  it("should keep it inside the height Telegram will send without shrinking", () => {
    expect(chat.photoBytes()?.readUInt32BE(HEIGHT_AT) ?? NOTHING).toBeLessThanOrEqual(
      TELEGRAM_HEIGHT_LIMIT
    );
  });
});

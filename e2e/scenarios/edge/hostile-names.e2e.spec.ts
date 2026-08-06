import { expect, it } from "vitest";
import { describeScenario } from "../../harness/describe-scenario.ts";


const INJECTION = "Oleg'); DROP TABLE players;--";

const MARKUP = "<b>Anya</b>";

const ZERO_WIDTH = "​";

const BYTE_ORDER_MARK = "﻿";

const OVERLONG = "L".repeat(33);

const AT_THE_CAP = "L".repeat(32);

describeScenario("a name the bot was never meant to be given", (chat) => {
  it("should keep a name that reads like SQL as a name, not as SQL", async () => {
    await chat.say(`/game Roma, ${INJECTION}`);

    expect(chat.captions()).toEqual(["Roma", INJECTION, "❌ Cancel"]);
  });

  it("should still be able to answer about itself afterwards", async () => {
    await chat.tap("Roma");
    await chat.tap(INJECTION);
    await chat.tap("✅ Confirm");

    await chat.say("/stats");

    expect(chat.lastText()).not.toContain("error");
    expect(chat.photoBytes()).toBeDefined();
  });

  it("should have written the name down whole, quotes and all", async () => {
    await chat.say("/merge");

    expect(chat.captions()).toContain(`${INJECTION} · 1`);

    await chat.tap("❌ Cancel");
  });

  it("should split a name on the angle bracket, which is a seating separator", async () => {
    await chat.say(`/game Roma, ${MARKUP}`);

    expect(chat.captions()).toEqual(["Roma", "<b", "Anya</b", "❌ Cancel"]);
  });

  it("should escape markup reaching the message body rather than obey it", async () => {
    await chat.tap("<b");

    expect(chat.cardText()).toContain("Went first: <b>&lt;b</b>");
    expect(chat.cardText()).not.toContain("Went first: <b><b</b>");
  });

  it("should refuse a name too long for a button, without echoing the whole thing", async () => {
    await chat.tap("❌ Cancel");
    await chat.say(`/game Roma, ${OVERLONG}`);

    expect(chat.lastText()).toContain("Too long for a button");
    expect(chat.lastText().length).toBeLessThan(OVERLONG.length + 100);
    expect(chat.captions()).toEqual([]);
  });

  it("should accept a name of exactly the length it allows", async () => {
    await chat.say(`/game Roma, ${AT_THE_CAP}`);

    expect(chat.captions()).toEqual(["Roma", AT_THE_CAP, "❌ Cancel"]);

    await chat.tap("❌ Cancel");
  });

  it("should not seat a player nobody can see", async () => {
    await chat.say(`/game Roma, ${ZERO_WIDTH}, Kim`);

    expect(chat.captions()).toEqual(["Roma", "Kim", "❌ Cancel"]);
  });

  it("should treat a name that is nothing but invisibles as no name at all", async () => {
    await chat.tap("❌ Cancel");
    await chat.say(`/game ${ZERO_WIDTH}${BYTE_ORDER_MARK}`);

    expect(chat.lastText()).toContain("Who is playing?");
    expect(chat.captions()).toEqual([]);
  });

  it("should not let an invisible character smuggle in a second Roma", async () => {
    await chat.say(`/game Roma, Ro${ZERO_WIDTH}ma`);

    expect(chat.lastText()).toContain("appear twice");
    expect(chat.captions()).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { QUIET_MS, lateEffectComplaint, workedOnAfterSettling } from "./settling.ts";


const NEVER_SETTLED = null;

const SETTLED_AT = 10_000;

const ONE_UPDATE = 1;

const NOTHING_PENDING = 0;

const A_MOMENT = 40;

describe("workedOnAfterSettling", () => {
  it("should accuse when an effect landed after the previous settle and the new update is still pending", () => {
    expect(workedOnAfterSettling(SETTLED_AT, SETTLED_AT + A_MOMENT, ONE_UPDATE)).toStrictEqual({
      late: true,
      afterQuiet: A_MOMENT,
    });
  });

  it("should stay silent on the first settle, when nothing has been believed finished yet", () => {
    expect(workedOnAfterSettling(NEVER_SETTLED, SETTLED_AT + A_MOMENT, ONE_UPDATE).late).toBe(false);
  });

  it("should stay silent once the bot has taken the update, since the effect may be its own", () => {
    expect(workedOnAfterSettling(SETTLED_AT, SETTLED_AT + A_MOMENT, NOTHING_PENDING).late).toBe(
      false
    );
  });

  it("should stay silent when the newest effect is older than the settle it followed", () => {
    expect(workedOnAfterSettling(SETTLED_AT, SETTLED_AT - A_MOMENT, ONE_UPDATE).late).toBe(false);
  });

  it("should stay silent on an effect landing in the same millisecond the settle returned", () => {
    expect(workedOnAfterSettling(SETTLED_AT, SETTLED_AT, ONE_UPDATE).late).toBe(false);
  });
});

describe("lateEffectComplaint", () => {
  it("should say how far past the window the bot was still working", () => {
    expect(lateEffectComplaint(A_MOMENT)).toContain(`${String(A_MOMENT)}ms after`);
  });

  it("should name the window it is accusing, so the number to change is in the message", () => {
    expect(lateEffectComplaint(A_MOMENT)).toContain(String(QUIET_MS));
  });

  it("should point at the file the window lives in", () => {
    expect(lateEffectComplaint(A_MOMENT)).toContain("e2e/harness/settling.ts");
  });
});

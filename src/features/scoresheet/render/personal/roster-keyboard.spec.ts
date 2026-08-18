import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerColumn } from "#shared/repository/repository-contract.ts";


const encodePersonalCallbackSpy = vi.fn();

vi.mock("#scoresheet/render/personal/personal-callback-codec.ts", () => ({
  encodePersonalCallback: (playerId: number) => encodePersonalCallbackSpy(playerId),
}));

const { renderRosterKeyboard } = await import("#scoresheet/render/personal/roster-keyboard.ts");

const NOBODY = 0;

const ONE_BUTTON = 1;

const OLEG_ID = 4;

const ANNA_ID = 9;

const ROSTER: readonly PlayerColumn[] = [
  { playerId: OLEG_ID, displayName: "Oleg" },
  { playerId: ANNA_ID, displayName: "Anna" },
];

describe("renderRosterKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    encodePersonalCallbackSpy.mockImplementation((playerId: number) => `tap(${String(playerId)})`);
  });

  it("should give every player a row of their own", () => {
    expect(renderRosterKeyboard(ROSTER)).toHaveLength(ROSTER.length);
  });

  it("should put exactly one button in each row", () => {
    const rows = renderRosterKeyboard(ROSTER);

    expect(rows.map((row) => row.length)).toEqual([ONE_BUTTON, ONE_BUTTON]);
  });

  it("should caption each button with the player's display name", () => {
    const rows = renderRosterKeyboard(ROSTER);

    expect(rows.map((row) => row[0]?.text)).toEqual(["Oleg", "Anna"]);
  });

  it("should keep the roster's own order", () => {
    const rows = renderRosterKeyboard([...ROSTER].reverse());

    expect(rows.map((row) => row[0]?.text)).toEqual(["Anna", "Oleg"]);
  });

  it("should ask the codec for a payload once per player", () => {
    renderRosterKeyboard(ROSTER);

    expect(encodePersonalCallbackSpy).toHaveBeenCalledTimes(ROSTER.length);
  });

  it("should ask the codec for the player's own id, not their place in the roster", () => {
    renderRosterKeyboard(ROSTER);

    expect(encodePersonalCallbackSpy).toHaveBeenCalledWith(OLEG_ID);
    expect(encodePersonalCallbackSpy).toHaveBeenCalledWith(ANNA_ID);
  });

  it("should carry whatever the codec wrote as the button's callback_data", () => {
    const rows = renderRosterKeyboard(ROSTER);

    expect(rows.map((row) => row[0]?.callback_data)).toEqual([
      `tap(${String(OLEG_ID)})`,
      `tap(${String(ANNA_ID)})`,
    ]);
  });

  it("should build no rows at all for an empty roster", () => {
    expect(renderRosterKeyboard([])).toHaveLength(NOBODY);
  });

  it("should ask the codec for nothing when there is nobody to ask about", () => {
    renderRosterKeyboard([]);

    expect(encodePersonalCallbackSpy).not.toHaveBeenCalled();
  });
});

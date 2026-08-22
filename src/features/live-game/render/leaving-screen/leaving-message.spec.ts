import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";


const escapeHtmlSpy = vi.fn();

vi.mock("#shared/text/html-escape.ts", () => ({
  escapeHtml: (text: string) => escapeHtmlSpy(text),
}));

const { renderLeavingCancelled, renderLeavingScreen, renderPlaying } = await import(
  "#live-game/render/leaving-screen/leaving-message.ts"
);


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const escaped = (name: string): string => `<escaped ${name}>`;

describe("leaving-message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escapeHtmlSpy.mockImplementation((name: string) => escaped(name));
  });

  describe("renderLeavingScreen()", () => {
    it("should head the screen and ask who is sitting out", () => {
      expect(renderLeavingScreen(copy)).toBe(`${copy.leavingHeader}\n${copy.leavingAsk}`);
    });
  });

  describe("renderPlaying()", () => {
    it("should show who is still playing, in the order they are seated", () => {
      expect(renderPlaying(copy, [OLEG, ANYA])).toBe(
        `${copy.leavingHeader}\n${copy.playingBody(
          `${escaped(OLEG.displayName)}${copy.betweenSeats}${escaped(ANYA.displayName)}`
        )}`
      );
    });

    it("should route every name through the escaper, since a name is user data", () => {
      renderPlaying(copy, [OLEG, ANYA]);

      expect(escapeHtmlSpy).toHaveBeenCalledWith(OLEG.displayName);
      expect(escapeHtmlSpy).toHaveBeenCalledWith(ANYA.displayName);
    });
  });

  describe("renderLeavingCancelled()", () => {
    it("should say that the table is unchanged", () => {
      expect(renderLeavingCancelled(copy)).toBe(
        `${copy.leavingHeader}\n${copy.leavingCancelledBody}`
      );
    });
  });
});

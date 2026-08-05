import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";


const escapeHtmlSpy = vi.fn();

vi.mock("#shared/text/html-escape.ts", () => ({
  escapeHtml: (text: string) => escapeHtmlSpy(text),
}));

const { renderSeated, renderSeatingCancelled, renderSeatingScreen } = await import(
  "#live-game/render/seating-screen/seating-message.ts"
);


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const escaped = (name: string): string => `<escaped ${name}>`;

describe("seating-message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escapeHtmlSpy.mockImplementation((name: string) => escaped(name));
  });

  describe("renderSeatingScreen()", () => {
    it("should head the screen and ask for the order", () => {
      expect(renderSeatingScreen(copy)).toBe(`${copy.seatingHeader}\n${copy.seatingAsk}`);
    });
  });

  describe("renderSeated()", () => {
    it("should show the ring in the order it was tapped, not in any other", () => {
      expect(renderSeated(copy, [OLEG, ANYA])).toBe(
        `${copy.seatingHeader}\n${copy.seatedBody(
          `${escaped(OLEG.displayName)}${copy.betweenSeats}${escaped(ANYA.displayName)}`
        )}`
      );
    });

    it("should route every name through the escaper, since a name is user data", () => {
      renderSeated(copy, [OLEG, ANYA]);

      expect(escapeHtmlSpy).toHaveBeenCalledWith(OLEG.displayName);
      expect(escapeHtmlSpy).toHaveBeenCalledWith(ANYA.displayName);
    });
  });

  describe("renderSeatingCancelled()", () => {
    it("should say that no game was started", () => {
      expect(renderSeatingCancelled(copy)).toBe(
        `${copy.seatingHeader}\n${copy.seatingCancelledBody}`
      );
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";


const escapeHtmlSpy = vi.fn();

vi.mock("#shared/text/html-escape.ts", () => ({
  escapeHtml: (text: string) => escapeHtmlSpy(text),
}));

const { renderSeated, renderSeatingCancelled, renderSeatingScreen } = await import(
  "#live-game/render/seating-message.ts"
);


const OLEG = { playerId: 3, displayName: "Oleg" };

const ANYA = { playerId: 7, displayName: "Anya" };

const SAFE = "safe";

describe("seating-message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escapeHtmlSpy.mockReturnValue(SAFE);
  });

  describe("renderSeatingScreen()", () => {
    it("should head the screen and ask for the order", () => {
      expect(renderSeatingScreen()).toBe(`${copy.seatingHeader}\n${copy.seatingAsk}`);
    });
  });

  describe("renderSeated()", () => {
    it("should show the ring in the order it was tapped", () => {
      escapeHtmlSpy.mockImplementation(() => SAFE);

      expect(renderSeated([OLEG, ANYA])).toBe(
        `${copy.seatingHeader}\n${copy.seatedBody(`${SAFE} → ${SAFE}`)}`
      );
    });

    it("should route every name through the escaper, since a name is user data", () => {
      renderSeated([OLEG, ANYA]);

      expect(escapeHtmlSpy).toHaveBeenCalledWith(OLEG.displayName);
      expect(escapeHtmlSpy).toHaveBeenCalledWith(ANYA.displayName);
    });
  });

  describe("renderSeatingCancelled()", () => {
    it("should say that no game was started", () => {
      expect(renderSeatingCancelled()).toBe(
        `${copy.seatingHeader}\n${copy.seatingCancelledBody}`
      );
    });
  });
});

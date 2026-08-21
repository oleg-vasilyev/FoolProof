import { beforeEach, describe, expect, it, vi } from "vitest";


const IMAGE_WIDTH = 900;

const BASEBOARD_BAR = 40;

const FONT_FAMILY = "Test Sans";

const rectSpy = vi.fn();

const textSpy = vi.fn();

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  BASEBOARD_BAR,
  FONT_FAMILY,
  IMAGE_WIDTH,
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { plateShade: "bar fill", inkKey: "handle ink" },
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { handleOf, posterBaseboard } = await import("#scoresheet/render/poster-baseboard.ts");

const ONCE = 1;

const ORIGIN = 0;

const A_TALL_SHEET = 2000;

const A_SHORT_SHEET = 723;

const A_HANDLE = "@a_handle";

const A_USERNAME = "a_handle";

const barOf = (): Record<string, unknown> =>
  (rectSpy.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;

const handleAttributes = (): Record<string, unknown> =>
  (textSpy.mock.calls[0]?.[1] ?? {}) as Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();

  rectSpy.mockReturnValue("<rect/>");
  textSpy.mockReturnValue("<text/>");
});

describe("handleOf()", () => {
  it("should make a username into the handle a player can type", () => {
    expect(handleOf(A_USERNAME)).toBe(A_HANDLE);
  });

  it("should leave the username itself untouched behind the mark", () => {
    expect(handleOf(A_USERNAME).slice(ONCE)).toBe(A_USERNAME);
    expect(handleOf(A_USERNAME)).toHaveLength(A_USERNAME.length + ONCE);
  });
});

describe("posterBaseboard()", () => {
  it("should draw the bar and the handle, and nothing else", () => {
    expect(posterBaseboard(A_HANDLE, A_TALL_SHEET)).toHaveLength(ONCE + ONCE);
    expect(rectSpy).toHaveBeenCalledTimes(ONCE);
    expect(textSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should run the bar the whole width of the sheet", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    expect(barOf().x).toBe(ORIGIN);
    expect(barOf().width).toBe(IMAGE_WIDTH);
  });

  it("should sit the bar flush against the foot of the sheet", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    expect(barOf().y).toBe(A_TALL_SHEET - BASEBOARD_BAR);
    expect(barOf().height).toBe(BASEBOARD_BAR);
  });

  it("should follow the foot wherever the sheet ends", () => {
    posterBaseboard(A_HANDLE, A_SHORT_SHEET);

    expect(barOf().y).toBe(A_SHORT_SHEET - BASEBOARD_BAR);
  });

  it("should print the handle it was handed, untouched", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    expect(textSpy).toHaveBeenCalledWith(A_HANDLE, expect.anything());
  });

  it("should centre the handle across the sheet rather than anchor it to an edge", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    expect(handleAttributes()["text-anchor"]).toBe("middle");
    expect(handleAttributes().x).toBe(IMAGE_WIDTH / (ONCE + ONCE));
  });

  it("should sit the handle inside the bar, not below it", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    const baseline = Number(handleAttributes().y);

    expect(baseline).toBeLessThan(A_TALL_SHEET);
    expect(baseline).toBeGreaterThan(A_TALL_SHEET - BASEBOARD_BAR);
  });

  it("should draw the bar in the shade the palette keeps for a plate", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    expect(barOf().fill).toBe("bar fill");
  });

  it("should draw the handle in the key ink, bold, so it reads as the sheet's own mark", () => {
    posterBaseboard(A_HANDLE, A_TALL_SHEET);

    expect(handleAttributes().fill).toBe("handle ink");
    expect(handleAttributes()["font-weight"]).toBe("bold");
    expect(handleAttributes()["font-family"]).toBe(FONT_FAMILY);
  });

  it("should set the widest handle on the shortest sheet at the same size as the shortest", () => {
    const WIDEST = `@${"W".repeat(32)}`;

    const SHORTEST = "@ab";

    posterBaseboard(WIDEST, A_SHORT_SHEET);

    const widest = handleAttributes()["font-size"];

    vi.clearAllMocks();
    posterBaseboard(SHORTEST, A_TALL_SHEET);

    expect(textSpy).toHaveBeenCalledWith(SHORTEST, expect.anything());
    expect(handleAttributes()["font-size"]).toBe(widest);
  });
});

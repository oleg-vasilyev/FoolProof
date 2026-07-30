import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#scoresheet/copy.en.ts";


const requireFontsSpy = vi.fn();

const onStatsSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

vi.mock("#scoresheet/bot/rasterizer.ts", () => ({
  requireFonts: () => requireFontsSpy(),
}));

vi.mock("#scoresheet/bot/stats-handler.ts", () => ({
  onStats: (context: unknown, ctx: unknown) => onStatsSpy(context, ctx),
}));

const { createScoresheetFeature } = await import("#scoresheet/scoresheet-feature.ts");

const ONCE = 1;

const NEVER = 0;

describe("createScoresheetFeature()", () => {
  let repo: RepositoryStub;

  const build = () => createScoresheetFeature({ repo });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    requireFontsSpy.mockImplementation(() => undefined);
  });

  describe("what it checks before anything else", () => {
    it("should confirm the fonts are there as it is built", () => {
      build();

      expect(requireFontsSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should refuse to be built at all when a font is missing", () => {
      requireFontsSpy.mockImplementation(() => {
        throw new Error("no font");
      });

      expect(() => build()).toThrow("no font");
    });

    it("should fail before it registers anything, not on the first /stats", () => {
      requireFontsSpy.mockImplementation(() => {
        throw new Error("no font");
      });

      expect(() => build()).toThrow();
      expect(onStatsSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("the command it declares", () => {
    it("should offer stats and nothing else", () => {
      expect(build().commands.map((route) => route.command)).toEqual(["stats"]);
    });

    it("should take its menu description from its own copy", () => {
      expect(build().commands[0]?.menuDescription).toBe(copy.commandStats);
    });

    it("should take its help line from its own copy", () => {
      expect(build().commands[0]?.help).toBe(copy.helpStats);
    });

    it("should route stats to its own handler", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onStatsSpy).toHaveBeenCalledWith({ repo }, "the-context");
    });
  });

  describe("what it does not do", () => {
    it("should listen to nothing, since it only answers a command", () => {
      expect(build().listen).toBeUndefined();
    });

    it("should have nothing to stop, since it holds no timers", () => {
      expect(build().stop).toBeUndefined();
    });

    it("should contribute no notes to the help text", () => {
      expect(build().notes).toBeUndefined();
    });
  });
});

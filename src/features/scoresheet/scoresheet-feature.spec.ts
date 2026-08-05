import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { copy } from "#scoresheet/copy.en.ts";


const requireFontsSpy = vi.fn();

const onStatsSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onChronologySpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onAwardsSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

vi.mock("#scoresheet/bot/rasterizer.ts", () => ({
  requireFonts: () => requireFontsSpy(),
}));

vi.mock("#scoresheet/bot/stats-handler.ts", () => ({
  onStats: (context: unknown, ctx: unknown) => onStatsSpy(context, ctx),
  onChronology: (context: unknown, ctx: unknown) => onChronologySpy(context, ctx),
  onAwards: (context: unknown, ctx: unknown) => onAwardsSpy(context, ctx),
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

  describe("the commands it declares", () => {
    const routeFor = (command: string) =>
      build().commands.find((route) => route.command === command);

    it("should offer the pair and each picture on its own, and nothing else", () => {
      expect(build().commands.map((route) => route.command)).toEqual([
        "stats",
        "stats_chronology",
        "stats_awards",
      ]);
    });

    it("should take every menu description from its own copy", () => {
      expect(build().commands.map((route) => route.menuDescription)).toEqual([
        copy.commandStats,
        copy.commandChronology,
        copy.commandAwards,
      ]);
    });

    it("should take every help line from its own copy", () => {
      expect(build().commands.map((route) => route.help)).toEqual([
        copy.helpStats,
        copy.helpChronology,
        copy.helpAwards,
      ]);
    });

    it("should route stats to the handler that sends both pictures", async () => {
      await routeFor("stats")?.run("the-context" as never);

      expect(onStatsSpy).toHaveBeenCalledWith({ repo }, "the-context");
    });

    it("should route the chronology to its own handler", async () => {
      await routeFor("stats_chronology")?.run("the-context" as never);

      expect(onChronologySpy).toHaveBeenCalledWith({ repo }, "the-context");
      expect(onStatsSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should route the awards to its own handler", async () => {
      await routeFor("stats_awards")?.run("the-context" as never);

      expect(onAwardsSpy).toHaveBeenCalledWith({ repo }, "the-context");
      expect(onChronologySpy).toHaveBeenCalledTimes(NEVER);
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

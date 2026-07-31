import { beforeAll, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { LoggingStub } from "#shared/logging/logger.stub.ts";


const ROOT_FOLDER = "repo";

const env = new EnvStub();

const logging = new LoggingStub();

const superviseChildSpy = vi.fn(async (_supervised: unknown): Promise<void> => undefined);

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("#shared/logging/logger.ts", () => logging.module);

vi.mock("#shared/lifecycle/child-supervisor.ts", () => ({
  superviseChild: (supervised: unknown) => superviseChildSpy(supervised),
}));

describe("supervisor.ts", () => {
  beforeAll(async () => {
    await import("#app/supervisor.ts");
  });

  it("should supervise the bot's own entry point", () => {
    expect(superviseChildSpy).toHaveBeenCalledWith(
      expect.objectContaining({ entry: expect.stringContaining("main.ts") as string })
    );
  });

  it("should resolve the entry against the project root, not the working directory", () => {
    const supervised = superviseChildSpy.mock.calls[0]?.[0] as { entry: string } | undefined;

    expect(supervised?.entry).toContain(ROOT_FOLDER);
  });

  it("should give the supervisor its own log scope", () => {
    expect(logging.scopeGiven()).toBe("supervisor");
  });

  it("should hand over that logger", () => {
    expect(superviseChildSpy).toHaveBeenCalledWith(
      expect.objectContaining({ log: logging.logger })
    );
  });
});

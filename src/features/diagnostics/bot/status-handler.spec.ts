import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { Locale } from "#shared/locale/locales.ts";
import { CHAT_ID, CommandContextStub } from "#diagnostics/bot/grammy-context.stub.ts";


const ONCE = 1;

const REPORT = "the rendered report";

const OPERATOR_TG_ID = "777";

const SOMEONE_ELSE = 999;

const SNAPSHOT = { marker: "the-snapshot" };

const COPY = { marker: "the-copy" };

const renderHealthReportSpy = vi.fn();

const copyInSpy = vi.fn();

vi.mock("#diagnostics/render/health-report.ts", () => ({
  renderHealthReport: (copy: unknown, snapshot: unknown) => renderHealthReportSpy(copy, snapshot),
}));

vi.mock("#diagnostics/copy.ts", () => ({
  copyIn: (locale: unknown) => copyInSpy(locale),
}));

const { onStatus } = await import("#diagnostics/bot/status-handler.ts");


describe("onStatus()", () => {
  let log: LoggerStub;
  let ctx: CommandContextStub;
  let locales: LocaleReaderStub;
  let takeSnapshot: ReturnType<typeof vi.fn>;

  const contextWith = (operatorTgId: string | null) => ({
    takeSnapshot: takeSnapshot as unknown as () => never,
    operatorTgId,
    log,
    localeIn: locales.read,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    log = new LoggerStub();
    ctx = new CommandContextStub(Number(OPERATOR_TG_ID));
    locales = new LocaleReaderStub(Locale.Ru);
    takeSnapshot = vi.fn(() => SNAPSHOT);
    renderHealthReportSpy.mockReturnValue(REPORT);
    copyInSpy.mockReturnValue(COPY);
  });

  it("should answer with the rendered report", async () => {
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(ctx.replySpy).toHaveBeenCalledWith(REPORT);
  });

  it("should render the snapshot it was handed", async () => {
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(renderHealthReportSpy).toHaveBeenCalledWith(COPY, SNAPSHOT);
  });

  it("should ask which language this chat chose", async () => {
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
  });

  it("should render in the copy of that language", async () => {
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(copyInSpy).toHaveBeenCalledWith(Locale.Ru);
  });

  it("should take a fresh snapshot per call, not one from build time", async () => {
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(takeSnapshot).toHaveBeenCalledTimes(2);
  });

  it("should send it as plain text, since a log line may contain anything", async () => {
    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(ctx.replySpy.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("should answer anyone when no operator was named", async () => {
    ctx = new CommandContextStub(SOMEONE_ELSE);

    await onStatus(contextWith(null), ctx.context);

    expect(ctx.replySpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should stay silent for anyone but the operator", async () => {
    ctx = new CommandContextStub(SOMEONE_ELSE);

    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(ctx.replySpy).not.toHaveBeenCalled();
  });

  it("should not even gather the numbers for someone it will not answer", async () => {
    ctx = new CommandContextStub(SOMEONE_ELSE);

    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(takeSnapshot).not.toHaveBeenCalled();
  });

  it("should leave a trace in the log when it refuses, since the chat shows nothing", async () => {
    ctx = new CommandContextStub(SOMEONE_ELSE);

    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(log.infoSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should name who asked, so the line is worth having", async () => {
    ctx = new CommandContextStub(SOMEONE_ELSE);

    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(log.infoSpy.mock.calls[0]?.[0]).toContain(String(SOMEONE_ELSE));
  });

  it("should not count a refusal as something that went wrong", async () => {
    ctx = new CommandContextStub(SOMEONE_ELSE);

    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(log.warnSpy).not.toHaveBeenCalled();
  });

  it("should refuse a command from nobody at all", async () => {
    ctx = new CommandContextStub(undefined);

    await onStatus(contextWith(OPERATOR_TG_ID), ctx.context);

    expect(ctx.replySpy).not.toHaveBeenCalled();
  });
});

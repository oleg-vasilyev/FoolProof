import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy } from "#language/copy.en.ts";
import { copy as russian } from "#language/copy.ru.ts";


const encodeLanguageCallbackSpy = vi.fn();

vi.mock("#language/render/language-callback-codec.ts", () => ({
  encodeLanguageCallback: (locale: unknown) => encodeLanguageCallbackSpy(locale),
}));

const { renderLanguageKeyboard } = await import("#language/render/language-keyboard.ts");

const ONE_PER_ROW = 1;

const captions = (spoken: Locale): readonly string[] =>
  renderLanguageKeyboard(copy, spoken).flatMap((row) => row.map((button) => button.text));

describe("renderLanguageKeyboard()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    encodeLanguageCallbackSpy.mockImplementation((locale: string) => `data(${locale})`);
  });

  it("should offer every language the bot speaks", () => {
    expect(renderLanguageKeyboard(copy, Locale.En)).toHaveLength(LOCALES.length);
  });

  it("should put each language on a row of its own", () => {
    for (const row of renderLanguageKeyboard(copy, Locale.En)) {
      expect(row).toHaveLength(ONE_PER_ROW);
    }
  });

  it("should name each language in its own tongue, whatever the chat speaks", () => {
    expect(captions(Locale.En).join(" ")).toContain(copy.languageNames.ru);
  });

  it("should mark the language the chat is already speaking", () => {
    const marked = captions(Locale.Ru).filter((caption) => caption.startsWith(copy.markChosen));

    expect(marked).toHaveLength(ONE_PER_ROW);
    expect(marked[0]).toContain(copy.languageNames.ru);
  });

  it("should move the mark when the chat speaks the other language", () => {
    const marked = captions(Locale.En).find((caption) => caption.startsWith(copy.markChosen));

    expect(marked).toContain(copy.languageNames.en);
  });

  it("should take the mark from the copy it was given", () => {
    const marked = renderLanguageKeyboard(russian, Locale.Ru)
      .flat()
      .map((button) => button.text)
      .find((caption) => caption.startsWith(russian.markChosen));

    expect(marked).toBeDefined();
  });

  it("should carry the data the codec made for each language", () => {
    const data = renderLanguageKeyboard(copy, Locale.En)
      .flat()
      .map((button) => button.callback_data);

    expect(data).toEqual(LOCALES.map((locale) => `data(${locale})`));
  });

  it("should ask the codec for every language it offers", () => {
    renderLanguageKeyboard(copy, Locale.En);

    for (const locale of LOCALES) {
      expect(encodeLanguageCallbackSpy).toHaveBeenCalledWith(locale);
    }
  });
});

import { describe, expect, it } from "vitest";
import { Locale } from "#shared/locale/locales.ts";
import { copy } from "#language/copy.en.ts";
import { copy as russian } from "#language/copy.ru.ts";
import {
  renderLanguageChosen,
  renderLanguageScreen,
} from "#language/render/language-message.ts";


describe("renderLanguageScreen()", () => {
  it("should head the screen and ask the question", () => {
    expect(renderLanguageScreen(copy)).toBe(`${copy.header}\n${copy.ask}`);
  });

  it("should speak in the copy it was given", () => {
    expect(renderLanguageScreen(russian)).toBe(`${russian.header}\n${russian.ask}`);
  });
});

describe("renderLanguageChosen()", () => {
  it("should keep the same heading, so the screen does not jump", () => {
    expect(renderLanguageChosen(copy, Locale.Ru).startsWith(copy.header)).toBe(true);
  });

  it("should name the language that was chosen", () => {
    expect(renderLanguageChosen(copy, Locale.Ru)).toContain(copy.languageNames.ru);
  });

  it("should name the other one when that is what was chosen", () => {
    expect(renderLanguageChosen(copy, Locale.En)).toContain(copy.languageNames.en);
  });

  it("should say it in the copy it was given", () => {
    expect(renderLanguageChosen(russian, Locale.Ru)).toBe(
      `${russian.header}\n${russian.chosenBody(russian.languageNames.ru)}`
    );
  });
});

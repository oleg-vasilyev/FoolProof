import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy as english } from "#language/copy.en.ts";
import { copy as russian } from "#language/copy.ru.ts";
import { copyIn } from "#language/copy.ts";


describe("copyIn()", () => {
  it("should hand back the English table for English", () => {
    expect(copyIn(Locale.En)).toBe(english);
  });

  it("should hand back the Russian table for Russian", () => {
    expect(copyIn(Locale.Ru)).toBe(russian);
  });
});

describe.each(LOCALES)("the %s copy table", (locale) => {
  const copy = copyIn(locale);

  it("should leave no key without copy, however deep the table goes", () => {
    const walk = (value: unknown, path: string): void => {
      if (typeof value === "string") {
        expect(value, path).not.toBe("");

        return;
      }

      if (typeof value === "object" && value !== null) {
        for (const [key, nested] of Object.entries(value)) {
          walk(nested, `${path}.${key}`);
        }
      }
    };

    walk(copy, "copy");
  });

  it("should name every language the bot speaks", () => {
    expect(copy.languageNames).toEqual(
      expect.objectContaining(
        Object.fromEntries(LOCALES.map((offered) => [offered, expect.any(String)]))
      )
    );
  });

  it("should name each language the same way whatever the chat speaks", () => {
    expect(copy.languageNames).toEqual(english.languageNames);
  });

  it("should say which language was chosen rather than a fixed one", () => {
    expect(copy.chosenBody(copy.languageNames.ru)).toContain(copy.languageNames.ru);
    expect(copy.chosenBody(copy.languageNames.en)).toContain(copy.languageNames.en);
  });

  it("should name the language in the tap notice too", () => {
    expect(copy.tapChosen(copy.languageNames.ru)).toContain(copy.languageNames.ru);
  });
});

import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy as english } from "#merge-names/copy.en.ts";
import { copy as russian } from "#merge-names/copy.ru.ts";
import { copyIn } from "#merge-names/copy.ts";


const MARKER = "«marker»";

const argumentsFor = (arity: number): readonly (readonly string[])[] =>
  Array.from({ length: arity }, (_unused, index) => [`${MARKER}${String(index)}`]);

describe("copyIn()", () => {
  it("should hand back the English table for English", () => {
    expect(copyIn(Locale.En)).toBe(english);
  });

  it("should hand back the Russian table for Russian", () => {
    expect(copyIn(Locale.Ru)).toBe(russian);
  });
});

describe.each(LOCALES)("the %s copy table", (locale) => {
  const copy: Record<string, unknown> = copyIn(locale);

  it("should know which language it is", () => {
    expect(copy.locale).toBe(locale);
  });

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

  it("should interpolate every argument every copy function is given", () => {
    for (const [key, value] of Object.entries(copy)) {
      if (typeof value !== "function") {
        continue;
      }

      const shapes: Record<string, unknown> = english;
      const master = shapes[key];
      const arity = typeof master === "function" ? master.length : 0;
      const given = argumentsFor(arity);
      const written = String((value as (...args: unknown[]) => string)(...given));

      expect(written, `${key} wrote nothing`).not.toBe("");
      expect(written, `${key} wrote nothing`).not.toBe("undefined");

      for (const [index] of given.entries()) {
        expect(written, `${key} dropped argument ${String(index)}`).toContain(
          `${MARKER}${String(index)}`
        );
      }
    }
  });

  it("should give the counted noun all three forms", () => {
    expect(copy.gameForms).toEqual(
      expect.objectContaining({
        one: expect.any(String),
        few: expect.any(String),
        many: expect.any(String),
      })
    );
  });
});

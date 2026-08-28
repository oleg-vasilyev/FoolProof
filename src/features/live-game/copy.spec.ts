import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy as english } from "#live-game/copy.en.ts";
import { copy as russian } from "#live-game/copy.ru.ts";
import { copyIn } from "#live-game/copy.ts";


const MARKER = "«marker»";

const THE_WAY_OFF = "🔴";

const A_STEP_BACK = "↩️";

const THE_WAY_ON = "🟢";

const opensWith = (caption: unknown, mark: string): string => String(caption).slice(0, mark.length);

const FIRST_OF_A_PAIR = "a";

const SECOND_OF_A_PAIR = "b";

const halfOf = (index: number, half: string): string => `${MARKER}${String(index)}${half}`;

const argumentsFor = (arity: number): readonly (readonly string[])[] =>
  Array.from({ length: arity }, (_unused, index) => [
    halfOf(index, FIRST_OF_A_PAIR),
    halfOf(index, SECOND_OF_A_PAIR),
  ]);

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

  it("should open the way off the screen with the one red mark", () => {
    expect(opensWith(copy.buttonCancel, THE_WAY_OFF)).toBe(THE_WAY_OFF);
  });

  it("should open the step back with the one arrow", () => {
    expect(opensWith(copy.buttonBack, A_STEP_BACK)).toBe(A_STEP_BACK);
  });

  it("should open every way on with the one green mark, whichever screen draws it", () => {
    for (const caption of [copy.buttonConfirm, copy.buttonPlay, copy.buttonDraw]) {
      expect(opensWith(caption, THE_WAY_ON)).toBe(THE_WAY_ON);
    }
  });

  it("should keep the green mark off the tick that says a player is out", () => {
    expect(copy.markExit).not.toBe(THE_WAY_ON);
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
          halfOf(index, FIRST_OF_A_PAIR)
        );
        expect(written, `${key} dropped argument ${String(index)}`).toContain(
          halfOf(index, SECOND_OF_A_PAIR)
        );

        expect(
          written,
          `${key} ran the two halves of argument ${String(index)} together`
        ).not.toContain(`${halfOf(index, FIRST_OF_A_PAIR)}${halfOf(index, SECOND_OF_A_PAIR)}`);
      }
    }
  });

  it("should keep the card's help to three lines, so /help stays readable", () => {
    expect(copy.helpCard).toHaveLength(3);
  });

  it("should leave no line of that help empty", () => {
    for (const line of copy.helpCard as readonly string[]) {
      expect(line).not.toBe("");
    }
  });

  it("should keep every button caption short enough to sit beside another", () => {
    const LONGEST_CAPTION = 24;

    for (const caption of [
      copy.buttonDraw,
      copy.buttonConfirm,
      copy.buttonBack,
      copy.buttonCancel,
      copy.buttonPlay,
    ]) {
      expect(String(caption).length).toBeLessThanOrEqual(LONGEST_CAPTION);
    }
  });
});

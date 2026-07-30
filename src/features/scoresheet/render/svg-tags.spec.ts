import { beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlEscapeStub } from "#shared/text/html-escape.stub.ts";


const html = new HtmlEscapeStub();

vi.mock("#shared/text/html-escape.ts", () => html.module);

const { line, path, polyline, rect, svgOf, text } = await import("#scoresheet/render/svg-tags.ts");

const ESCAPED = "escaped";

describe("svg primitives", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    html.escapeHtmlSpy.mockReturnValue(ESCAPED);
  });

  describe("rect()", () => {
    it("should emit a self-closing rect with its attributes", () => {
      expect(rect({ x: 1, y: 2, fill: "#000" })).toBe(`<rect x="1" y="2" fill="#000"/>`);
    });

    it("should keep the attribute order it was given", () => {
      expect(rect({ y: 2, x: 1 })).toBe(`<rect y="2" x="1"/>`);
    });
  });

  describe("line()", () => {
    it("should emit a self-closing line", () => {
      expect(line({ x1: 0, x2: 10 })).toBe(`<line x1="0" x2="10"/>`);
    });
  });

  describe("path()", () => {
    it("should emit a self-closing path", () => {
      expect(path({ d: "M0 0", fill: "none" })).toBe(`<path d="M0 0" fill="none"/>`);
    });
  });

  describe("number formatting", () => {
    it("should round a long fraction to two decimals", () => {
      expect(rect({ x: 1.23456 })).toBe(`<rect x="1.23"/>`);
    });

    it("should not leave a trailing zero on a whole number", () => {
      expect(rect({ x: 12.0 })).toBe(`<rect x="12"/>`);
    });

    it("should keep a negative value negative", () => {
      expect(rect({ x: -3.5 })).toBe(`<rect x="-3.5"/>`);
    });

    it("should leave a string attribute untouched", () => {
      expect(rect({ fill: "#1c1c1c" })).toBe(`<rect fill="#1c1c1c"/>`);
    });
  });

  describe("text()", () => {
    it("should escape the value it prints", () => {
      text("Аня & Оля", { x: 0 });

      expect(html.escapeHtmlSpy).toHaveBeenCalledWith("Аня & Оля");
    });

    it("should print what the escaper returned, never the raw value", () => {
      expect(text("Аня & Оля", { x: 0 })).toBe(`<text x="0">${ESCAPED}</text>`);
    });

    it("should carry its attributes", () => {
      expect(text("x", { fill: "#fff", "text-anchor": "middle" })).toBe(
        `<text fill="#fff" text-anchor="middle">${ESCAPED}</text>`
      );
    });
  });

  describe("polyline()", () => {
    it("should move to the first point and line to the rest", () => {
      expect(
        polyline([
          [0, 1],
          [2, 3],
          [4, 5],
        ])
      ).toBe("M0 1 L2 3 L4 5");
    });

    it("should round the points like every other number", () => {
      expect(polyline([[1.23456, 2.9999]])).toBe("M1.23 3");
    });

    it("should produce nothing for no points", () => {
      expect(polyline([])).toBe("");
    });
  });

  describe("svgOf()", () => {
    it("should declare the namespace so the file stands alone", () => {
      expect(svgOf(10, 20, [])).toContain(`xmlns="http://www.w3.org/2000/svg"`);
    });

    it("should set width, height and a matching viewBox", () => {
      const document = svgOf(10, 20, []);

      expect(document).toContain(`width="10" height="20"`);
      expect(document).toContain(`viewBox="0 0 10 20"`);
    });

    it("should put the body between the tags, in order", () => {
      expect(svgOf(1, 1, ["<a/>", "<b/>"])).toContain("<a/><b/></svg>");
    });

    it("should close the root element", () => {
      expect(svgOf(1, 1, [])).toMatch(/<\/svg>$/);
    });
  });
});

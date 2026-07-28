const ESCAPES: readonly (readonly [string, string])[] = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
];

export const escapeHtml = (value: string): string =>
  ESCAPES.reduce((escaped, [from, to]) => escaped.replaceAll(from, to), value);

export const quoteBlock = (lines: readonly string[]): string =>
  `<blockquote>${lines.join("\n")}</blockquote>`;

const ESCAPES: readonly (readonly [string, string])[] = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
];

export const escapeHtml = (value: string): string =>
  ESCAPES.reduce((escaped, [from, to]) => escaped.replaceAll(from, to), value);

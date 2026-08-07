import { escapeHtml } from "#shared/text/html-escape.ts";


export type AttributeValue = string | number;

export interface Attributes {
  readonly [name: string]: AttributeValue;
}

const PRECISION = 100;

const format = (value: AttributeValue): string =>
  typeof value === "number" ? String(Math.round(value * PRECISION) / PRECISION) : value;

const attributesOf = (attributes: Attributes): string =>
  Object.entries(attributes)
    .map(([name, value]) => `${name}="${format(value)}"`)
    .join(" ");

export const rect = (attributes: Attributes): string => `<rect ${attributesOf(attributes)}/>`;

export const line = (attributes: Attributes): string => `<line ${attributesOf(attributes)}/>`;

export const path = (attributes: Attributes): string => `<path ${attributesOf(attributes)}/>`;

export const circle = (attributes: Attributes): string => `<circle ${attributesOf(attributes)}/>`;

export const text = (value: string, attributes: Attributes): string =>
  `<text ${attributesOf(attributes)}>${escapeHtml(value)}</text>`;

export const polyline = (points: readonly (readonly [number, number])[]): string =>
  points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${format(x)} ${format(y)}`).join(" ");

export const svgOf = (width: number, height: number, body: readonly string[]): string =>
  [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${format(width)}" height="${format(height)}"`,
    ` viewBox="0 0 ${format(width)} ${format(height)}">`,
    ...body,
    "</svg>",
  ].join("");

import { describe, expect, it } from "vitest";
import { sizeOfDrawing } from "./the-website.ts";


const A_HEADER = 64;

const PNG_WIDTH_AT = 16;

const PNG_HEIGHT_AT = 20;

const WEBP_FOURCC_AT = 12;

const WEBP_VP8_WIDTH_AT = 26;

const WIDE = 1400;

const TALL = 2100;

const TOO_SHORT = 8;

const pngOf = (wide: number, tall: number): Buffer => {
  const bytes = Buffer.alloc(A_HEADER);

  Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(bytes);
  bytes.writeUInt32BE(wide, PNG_WIDTH_AT);
  bytes.writeUInt32BE(tall, PNG_HEIGHT_AT);

  return bytes;
};

const lossyWebpOf = (wide: number, tall: number): Buffer => {
  const bytes = Buffer.alloc(A_HEADER);

  bytes.write("RIFF", 0, "ascii");
  bytes.write("VP8 ", WEBP_FOURCC_AT, "ascii");
  bytes.writeUInt16LE(wide, WEBP_VP8_WIDTH_AT);
  bytes.writeUInt16LE(tall, WEBP_VP8_WIDTH_AT + 2);

  return bytes;
};

describe("sizeOfDrawing", () => {
  it("should read the size a PNG states in its header", () => {
    expect(sizeOfDrawing(pngOf(WIDE, TALL))).toEqual([WIDE, TALL]);
  });

  it("should read the size a lossy WebP states in its frame", () => {
    expect(sizeOfDrawing(lossyWebpOf(WIDE, TALL))).toEqual([WIDE, TALL]);
  });

  it("should refuse a file too short to hold either header rather than reading past its end", () => {
    expect(sizeOfDrawing(Buffer.alloc(TOO_SHORT))).toBeNull();
  });

  it("should refuse a shape it was never taught, rather than reporting a number it invented", () => {
    const jpeg = Buffer.alloc(A_HEADER);

    jpeg.write("JFIF", 6, "ascii");

    expect(sizeOfDrawing(jpeg)).toBeNull();
  });

  it("should refuse a lossless WebP, which states its size somewhere else entirely", () => {
    const lossless = Buffer.alloc(A_HEADER);

    lossless.write("RIFF", 0, "ascii");
    lossless.write("VP8L", WEBP_FOURCC_AT, "ascii");

    expect(sizeOfDrawing(lossless)).toBeNull();
  });

  it("should ignore the two flag bits a WebP keeps above its fourteen-bit width", () => {
    const flagged = lossyWebpOf(WIDE, TALL);

    flagged.writeUInt16LE(WIDE + 0xc000, WEBP_VP8_WIDTH_AT);

    expect(sizeOfDrawing(flagged)).toEqual([WIDE, TALL]);
  });
});

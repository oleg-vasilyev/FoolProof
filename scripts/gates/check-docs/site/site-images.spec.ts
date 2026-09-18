import { describe, expect, it } from "vitest";
import { imageComplaints, sizeOfDrawing } from "./site-images.ts";


const A_HEADER = 64;

const ONE_COMPLAINT = 1;

const FIRST = 0;

const PAGE = "docs/index.html";

const KILOBYTE = 1024;

const THE_BUDGET = 220 * KILOBYTE;

const ONE_BYTE = 1;

const PAST_THE_BUDGET = 300 * KILOBYTE;

const DRAWN_WIDE = 200;

const DRAWN_TALL = 100;

const PNG_WIDTH_AT = 16;

const PNG_HEIGHT_AT = 20;

const WEBP_FOURCC_AT = 12;

const WEBP_VP8_WIDTH_AT = 26;

const NEXT_TWO_BYTES = 2;

const THE_FLAG_BITS = 0xc000;

const A_JFIF_AT = 6;

const AT_THE_START = 0;

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

  bytes.write("RIFF", AT_THE_START, "ascii");
  bytes.write("VP8 ", WEBP_FOURCC_AT, "ascii");
  bytes.writeUInt16LE(wide, WEBP_VP8_WIDTH_AT);
  bytes.writeUInt16LE(tall, WEBP_VP8_WIDTH_AT + NEXT_TWO_BYTES);

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

    jpeg.write("JFIF", A_JFIF_AT, "ascii");

    expect(sizeOfDrawing(jpeg)).toBeNull();
  });

  it("should refuse a lossless WebP, which states its size somewhere else entirely", () => {
    const lossless = Buffer.alloc(A_HEADER);

    lossless.write("RIFF", AT_THE_START, "ascii");
    lossless.write("VP8L", WEBP_FOURCC_AT, "ascii");

    expect(sizeOfDrawing(lossless)).toBeNull();
  });

  it("should ignore the two flag bits a WebP keeps above its fourteen-bit width", () => {
    const flagged = lossyWebpOf(WIDE, TALL);

    flagged.writeUInt16LE(WIDE + THE_FLAG_BITS, WEBP_VP8_WIDTH_AT);

    expect(sizeOfDrawing(flagged)).toEqual([WIDE, TALL]);
  });
});

describe("imageComplaints", () => {
  const found = (bytes: Buffer) => () => bytes;

  const missing = () => null;

  it("should pass an image drawn at the shape it actually is", () => {
    const tag = '<img src="a.png" width="200" height="100">';

    expect(imageComplaints(PAGE, tag, found(pngOf(DRAWN_WIDE, DRAWN_TALL)))).toEqual([]);
  });

  it("should say what a wrong shape costs a reader, not merely that it is wrong", () => {
    const tag = '<img src="a.png" width="200" height="400">';
    const said = imageComplaints(PAGE, tag, found(pngOf(DRAWN_WIDE, DRAWN_TALL)));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("200×400");
    expect(said[FIRST]).toContain("200×100");
    expect(said[FIRST]).toContain("browser reserves the");
    expect(said[FIRST]).toContain("page jumps as it loads");
  });

  it("should refuse an image tag it cannot read rather than passing it in silence", () => {
    const said = imageComplaints(PAGE, '<img src="a.png" width="200">', found(pngOf(DRAWN_WIDE, DRAWN_TALL)));

    expect(said[FIRST]).toContain("without a src, a width and a height");
    expect(said[FIRST]).toContain("pass in silence");
  });

  it("should read an image tag whose attributes come in any order", () => {
    const tag = '<img class="hero" height="100" src="a.png" width="200">';

    expect(imageComplaints(PAGE, tag, found(pngOf(DRAWN_WIDE, DRAWN_TALL)))).toEqual([]);
  });

  it("should say a missing file would show as a gap on the page", () => {
    const said = imageComplaints(PAGE, '<img src="a.png" width="200" height="100">', missing);

    expect(said[FIRST]).toContain("which is not there");
    expect(said[FIRST]).toContain("show a gap");
  });

  it("should refuse a format it cannot measure rather than trusting the page", () => {
    const said = imageComplaints(
      PAGE,
      '<img src="a.gif" width="200" height="100">',
      found(Buffer.alloc(A_HEADER))
    );

    expect(said[FIRST]).toContain("neither a PNG nor the plain WebP");
    expect(said[FIRST]).toContain("trusting the page's own numbers");
  });

  const weighing = (bytes: number): Buffer =>
    Buffer.concat([pngOf(DRAWN_WIDE, DRAWN_TALL), Buffer.alloc(bytes - A_HEADER)]);

  it("should let a page sitting exactly on the picture budget through", () => {
    const tag = '<img src="a.png" width="200" height="100">';

    expect(imageComplaints(PAGE, tag, found(weighing(THE_BUDGET)))).toEqual([]);
  });

  it("should complain about the very next byte, which is where the budget is", () => {
    const tag = '<img src="a.png" width="200" height="100">';
    const said = imageComplaints(PAGE, tag, found(weighing(THE_BUDGET + ONE_BYTE)));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("KB of pictures, past the");
  });

  it("should say what to do about a page that spends past the budget", () => {
    const tag = '<img src="a.png" width="200" height="100">';
    const said = imageComplaints(PAGE, tag, found(weighing(PAST_THE_BUDGET)));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("KB of pictures, past the");
    expect(said[FIRST]).toContain("220KB a page of the site may spend");
    expect(said[FIRST]).toContain("rather than raising this");
  });
});

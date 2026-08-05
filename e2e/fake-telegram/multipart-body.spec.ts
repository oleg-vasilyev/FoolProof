import { describe, expect, it } from "vitest";
import { boundaryOf, parseMultipart } from "./multipart-body.ts";


const BOUNDARY = "----FoolProofBoundary";

const CONTENT_TYPE = `multipart/form-data; boundary=${BOUNDARY}`;

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const field = (name: string, value: string): string =>
  `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;

const bodyOf = (...parts: readonly (string | Buffer)[]): Buffer =>
  Buffer.concat([
    ...parts.map((part) => (Buffer.isBuffer(part) ? part : Buffer.from(part))),
    Buffer.from(`--${BOUNDARY}--\r\n`),
  ]);

const filePart = (filename: string, bytes: Buffer): Buffer =>
  Buffer.concat([
    Buffer.from(
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="photo"; filename=${filename}\r\n` +
        `Content-Type: image/png\r\n\r\n`
    ),
    bytes,
    Buffer.from("\r\n"),
  ]);

describe("boundaryOf()", () => {
  it("should read the boundary a sender declared", () => {
    expect(boundaryOf(CONTENT_TYPE)).toBe(BOUNDARY);
  });

  it("should trim what follows the boundary marker", () => {
    expect(boundaryOf(`multipart/form-data; boundary= ${BOUNDARY} `)).toBe(BOUNDARY);
  });

  it("should give nothing back for a content type with no boundary", () => {
    expect(boundaryOf("application/json")).toBeNull();
  });
});

describe("parseMultipart()", () => {
  it("should read a single field", () => {
    const parsed = parseMultipart(bodyOf(field("chat_id", "-100777")), CONTENT_TYPE);

    expect(parsed.fields).toEqual({ chat_id: "-100777" });
    expect(parsed.file).toBeNull();
  });

  it("should read every field, not only the first", () => {
    const parsed = parseMultipart(
      bodyOf(field("chat_id", "-100777"), field("caption", "Friday")),
      CONTENT_TYPE
    );

    expect(parsed.fields).toEqual({ chat_id: "-100777", caption: "Friday" });
  });

  it("should keep a value that has line breaks inside it", () => {
    const parsed = parseMultipart(bodyOf(field("caption", "one\r\ntwo")), CONTENT_TYPE);

    expect(parsed.fields.caption).toBe("one\r\ntwo");
  });

  it("should take the uploaded file out of the fields", () => {
    const parsed = parseMultipart(
      bodyOf(field("chat_id", "-100777"), filePart("sheet.png", PNG_BYTES)),
      CONTENT_TYPE
    );

    expect(parsed.fields).toEqual({ chat_id: "-100777" });
    expect(parsed.file).toEqual({ filename: "sheet.png", bytes: PNG_BYTES });
  });

  it("should keep the file's bytes exactly, since a PNG is not text", () => {
    const parsed = parseMultipart(bodyOf(filePart("sheet.png", PNG_BYTES)), CONTENT_TYPE);

    expect(parsed.file?.bytes.equals(PNG_BYTES)).toBe(true);
  });

  it("should give nothing back when the content type declares no boundary", () => {
    const parsed = parseMultipart(bodyOf(field("chat_id", "-100777")), "application/json");

    expect(parsed).toEqual({ fields: {}, file: null });
  });

  it("should give nothing back for a body with no parts in it", () => {
    const parsed = parseMultipart(Buffer.alloc(0), CONTENT_TYPE);

    expect(parsed).toEqual({ fields: {}, file: null });
  });
});

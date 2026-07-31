export interface UploadedFile {
  readonly filename: string;
  readonly bytes: Buffer;
}

export interface MultipartBody {
  readonly fields: Record<string, string>;
  readonly file: UploadedFile | null;
}

const HEADER_BREAK = "\r\n\r\n";

const LINE_BREAK_LENGTH = 2;

const NOT_FOUND = -1;

const NAME_PATTERN = /name="([^"]*)"/;

const FILENAME_PATTERN = /filename=([^\r\n;]*)/;

export const boundaryOf = (contentType: string): string | null =>
  contentType.split("boundary=")[1]?.trim() ?? null;

const partsOf = (body: Buffer, boundary: string): readonly Buffer[] => {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];

  let cursor = body.indexOf(delimiter);

  while (cursor !== NOT_FOUND) {
    const start = cursor + delimiter.length + LINE_BREAK_LENGTH;
    const next = body.indexOf(delimiter, start);

    if (next === NOT_FOUND) {
      break;
    }

    parts.push(body.subarray(start, next - LINE_BREAK_LENGTH));
    cursor = next;
  }

  return parts;
};

const splitPart = (part: Buffer): { headers: string; value: Buffer } => {
  const break_ = part.indexOf(HEADER_BREAK);

  return {
    headers: part.subarray(0, break_).toString("utf8"),
    value: part.subarray(break_ + HEADER_BREAK.length),
  };
};

export const parseMultipart = (body: Buffer, contentType: string): MultipartBody => {
  const boundary = boundaryOf(contentType);

  if (boundary === null) {
    return { fields: {}, file: null };
  }

  const fields: Record<string, string> = {};
  let file: UploadedFile | null = null;

  for (const part of partsOf(body, boundary)) {
    const { headers, value } = splitPart(part);
    const name = NAME_PATTERN.exec(headers)?.[1] ?? "";
    const filename = FILENAME_PATTERN.exec(headers)?.[1];

    if (filename === undefined) {
      fields[name] = value.toString("utf8");
    } else {
      file = { filename, bytes: value };
    }
  }

  return { fields, file };
};

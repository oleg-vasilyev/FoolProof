const LAST = -1;

const BETWEEN_ENTRIES = /\r?\n/;

const AN_ASSISTANT = "assistant";

const SOME_TEXT = "text";

const BETWEEN_PARTS = "\n";

const NOTHING_SAID = "";

interface Part {
  readonly type?: string;
  readonly text?: string;
}

interface Entry {
  readonly type?: string;
  readonly message?: { readonly content?: readonly Part[] | string };
}

const parsed = (line: string): Entry | null => {
  try {
    return JSON.parse(line) as Entry;
  } catch {
    return null;
  }
};

export const textOf = (content: readonly Part[] | string | undefined): string => {
  if (typeof content === "string") {
    return content.trim();
  }

  return (content ?? [])
    .filter((part) => part.type === SOME_TEXT)
    .map((part) => part.text ?? NOTHING_SAID)
    .join(BETWEEN_PARTS)
    .trim();
};

export const lastAssistantTextOf = (transcript: string): string => {
  const spoken = transcript
    .split(BETWEEN_ENTRIES)
    .map(parsed)
    .filter((entry) => entry !== null)
    .filter((entry) => entry.type === AN_ASSISTANT)
    .map((entry) => textOf(entry.message?.content))
    .filter((said) => said !== NOTHING_SAID);

  return spoken.at(LAST) ?? NOTHING_SAID;
};

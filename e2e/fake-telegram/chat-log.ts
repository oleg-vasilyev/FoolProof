export interface ChatButton {
  readonly text: string;
  readonly data: string;
}

export type ButtonRows = readonly (readonly ChatButton[])[];

export interface ChatMessage {
  readonly messageId: number;
  readonly scenario: number;
  readonly author: string;
  readonly fromBot: boolean;
  readonly text: string;
  readonly buttons: ButtonRows;
  readonly photo: number | null;
  readonly edits: number;
  readonly editAttempts: number;
  readonly deleted: boolean;
}

export interface PostedMessage {
  readonly scenario: number;
  readonly author: string;
  readonly fromBot: boolean;
  readonly text: string;
  readonly buttons?: ButtonRows;
  readonly photo?: number | null;
}

const FIRST_MESSAGE_ID = 100;

const NOTHING = 0;

export const emptyLog: readonly ChatMessage[] = [];

export const nextMessageId = (log: readonly ChatMessage[]): number =>
  log.length === NOTHING ? FIRST_MESSAGE_ID : (log[log.length - 1]?.messageId ?? NOTHING) + 1;

export const withMessage = (
  log: readonly ChatMessage[],
  posted: PostedMessage
): readonly ChatMessage[] => [
  ...log,
  {
    messageId: nextMessageId(log),
    scenario: posted.scenario,
    author: posted.author,
    fromBot: posted.fromBot,
    text: posted.text,
    buttons: posted.buttons ?? [],
    photo: posted.photo ?? null,
    edits: NOTHING,
    editAttempts: NOTHING,
    deleted: false,
  },
];

export const withEditAttempt = (
  log: readonly ChatMessage[],
  messageId: number
): readonly ChatMessage[] =>
  log.map((message) =>
    message.messageId === messageId
      ? { ...message, editAttempts: message.editAttempts + 1 }
      : message
  );

export const withEdit = (
  log: readonly ChatMessage[],
  messageId: number,
  text: string,
  buttons: ButtonRows
): readonly ChatMessage[] =>
  log.map((message) =>
    message.messageId === messageId
      ? { ...message, text, buttons, edits: message.edits + 1 }
      : message
  );

export const withDeletion = (
  log: readonly ChatMessage[],
  messageId: number
): readonly ChatMessage[] =>
  log.map((message) =>
    message.messageId === messageId ? { ...message, deleted: true } : message
  );

export const messageWithId = (
  log: readonly ChatMessage[],
  messageId: number
): ChatMessage | undefined => log.find((message) => message.messageId === messageId);

export const visibleMessages = (log: readonly ChatMessage[]): readonly ChatMessage[] =>
  log.filter((message) => !message.deleted);

export const messagesIn = (
  log: readonly ChatMessage[],
  scenario: number
): readonly ChatMessage[] =>
  visibleMessages(log).filter((message) => message.scenario === scenario);

export const liveCard = (
  log: readonly ChatMessage[],
  scenario: number
): ChatMessage | undefined =>
  messagesIn(log, scenario)
    .filter((message) => message.fromBot && message.buttons.length > NOTHING)
    .at(-1);

export const captionsOf = (message: ChatMessage | undefined): readonly string[] =>
  (message?.buttons ?? []).flatMap((row) => row.map((button) => button.text));

export const buttonWithCaption = (
  message: ChatMessage | undefined,
  caption: string
): ChatButton | undefined =>
  (message?.buttons ?? [])
    .flatMap((row) => row)
    .find((button) => button.text === caption);

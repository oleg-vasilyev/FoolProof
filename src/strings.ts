export const strings = {
  commandHelp: "What the bot does",

  helpLead: "FoolProof keeps score for games of Durak.",
  helpSelf: "/help — this message",

  updateFailed: (updateId: number, reason: string) => `update ${updateId} failed: ${reason}`,
} as const;

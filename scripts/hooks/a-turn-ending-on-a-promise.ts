const NOTHING = 0;

const LAST = -1;

const AS_LONG_AS_AN_ANNOUNCEMENT = 8;

const A_PROMISE =
  /^(?:продолжаю|продолжу|продолжаем|начинаю|начну|приступаю|приступлю|перехожу|перейду|иду дальше|двигаюсь дальше|доделаю|дописываю|дорабатываю|займусь|запускаю|continuing|carrying on|moving on|proceeding|starting now|let me continue|i'?ll (?:continue|carry on|proceed|start|finish|do that|take care of))(?![\p{L}\p{N}])/iu;

const WAITING_ON_THE_OWNER =
  /(?<![\p{L}\p{N}])(?:после тво|после ваш|когда (?:дашь|скажешь|подтвердишь|решишь|ответишь)|по тво(?:ей|ему)|по ваш(?:ей|ему)|если (?:скажешь|захочешь|подтвердишь)|как (?:скажешь|решишь)|once you|when you|after you|if you|on your (?:word|say-so|go))/iu;

const A_QUESTION = "?";

const A_FULLWIDTH_QUESTION = "？";

const AN_INTRODUCTION = ":";

const BETWEEN_SENTENCES = /(?<=[.!?…])\s+|\n+/u;

const A_MARKDOWN_ORNAMENT = /^[\s>*_`#\-–—]+|[\s*_`]+$/gu;

const A_FENCED_BLOCK = /```[\s\S]*?```/g;

const INSTEAD_OF_A_FENCE = "\n…\n";

const BETWEEN_WORDS = /\s+/u;

export const lastSentenceOf = (message: string): string => {
  const said = message
    .replace(A_FENCED_BLOCK, INSTEAD_OF_A_FENCE)
    .split(BETWEEN_SENTENCES)
    .map((sentence) => sentence.replace(A_MARKDOWN_ORNAMENT, "").trim())
    .filter((sentence) => sentence.length > NOTHING);

  return said.at(LAST) ?? "";
};

export const handsTheTurnBack = (closing: string): boolean =>
  closing.endsWith(A_QUESTION) ||
  closing.endsWith(A_FULLWIDTH_QUESTION) ||
  closing.endsWith(AN_INTRODUCTION) ||
  WAITING_ON_THE_OWNER.test(closing);

export const endsOnAPromise = (message: string): boolean => {
  const closing = lastSentenceOf(message);

  if (handsTheTurnBack(closing)) {
    return false;
  }

  if (closing.split(BETWEEN_WORDS).length > AS_LONG_AS_AN_ANNOUNCEMENT) {
    return false;
  }

  return A_PROMISE.test(closing);
};

export const THE_REFUSAL = [
  "Your closing message ends by announcing work rather than doing it or handing",
  "it back. That exact shape — what is left, then a word of intent, then silence —",
  "has already left a phase of this project half-finished.",
  "",
  "Answer one question before stopping: is the work you just announced done? If it",
  "is not, do it now. The announcement is not the deliverable.",
  "",
  "If stopping here is right, say why in a sentence the owner can act on — what",
  "blocks you, what you need from him, or that the next step is his call. A stop",
  "with a reason is fine; a stop that reads as a promise is not.",
].join("\n");

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { A_LINE, FIRST_GROUP } from "../markdown-text.ts";
import { FLOW_DOCUMENT, read } from "../document-files.ts";
import { estimateComplaints, fieldsIn } from "./phase-log-fields.ts";


const NOTHING = 0;

const ONE = 1;

const FIRST = 0;

const NOT_FOUND = -1;

const A_MARKDOWN_FILE = /\.md$/;

const A_STAGE_TITLE = /^\s*note over [^:]+: Stage \d+\.\s*(.+?)\s*$/;

const A_STEP = /^\s*[A-Za-z][A-Za-z0-9]*-?->>[A-Za-z][A-Za-z0-9]*:\s*(.+?)\s*$/;

const BETWEEN_STAGES = /\s*→\s*/;

const BETWEEN_ENTRIES = /\s+·\s+/;

const NOTHING_TO_SAY = "none";

const NOWHERE = "";

const A_STAGE = "stage";

const A_STEP_OF_ONE = "step";

const WALKED = "Path";

const SKIPPED = "Skipped";

const OFF_MAP = "Off-map";

const THE_OWED_FIELDS = [WALKED, SKIPPED, OFF_MAP];

export const PHASE_LOGS_FOLDER = "logbook/phases";

const THE_PUBLISHED_TRUNK = "origin/main...HEAD";

export interface Marker {
  readonly kind: "stage" | "step";
  readonly text: string;
  readonly stage: string;
}

export const markersIn = (drawing: string): readonly Marker[] =>
  drawing.split(A_LINE).reduce<readonly Marker[]>((found, line) => {
    const title = A_STAGE_TITLE.exec(line)?.[FIRST_GROUP];

    if (title !== undefined) {
      return [...found, { kind: A_STAGE, text: title, stage: title }];
    }

    const step = A_STEP.exec(line)?.[FIRST_GROUP];
    const standing = found.at(NOT_FOUND)?.stage;

    return step === undefined || standing === undefined
      ? found
      : [...found, { kind: A_STEP_OF_ONE, text: step, stage: standing }];
  }, []);

export const stageTitlesIn = (markers: readonly Marker[]): readonly string[] =>
  markers.filter((marker) => marker.kind === A_STAGE).map((marker) => marker.text);

export const citationsIn = (value: string, separator: RegExp): readonly string[] =>
  value.trim() === NOTHING_TO_SAY || value.trim() === NOWHERE
    ? []
    : value.split(separator).filter((citation) => citation.trim() !== NOWHERE);

export const markersMatching = (
  citation: string,
  markers: readonly Marker[]
): readonly Marker[] => {
  const wanted = citation.toLowerCase();
  const exactly = markers.filter((marker) => marker.text.toLowerCase() === wanted);

  return exactly.length > NOTHING
    ? exactly
    : markers.filter((marker) => marker.text.toLowerCase().startsWith(wanted));
};

const complaintAbout = (
  file: string,
  field: string,
  citation: string,
  matched: readonly Marker[]
): readonly string[] => {
  if (matched.length === ONE) {
    return [];
  }

  if (matched.length === NOTHING) {
    return [
      `${file}: ${field} names "${citation}", which no stage or step of ${FLOW_DOCUMENT} ` +
        `begins with — a walk cites either by the opening words of its own line, never by a ` +
        `number, because a number moves the next time anything is inserted above it`,
    ];
  }

  const sameLineTwice = matched.every((marker) => marker.text === matched[FIRST]?.text);

  return [
    sameLineTwice
      ? `${file}: ${field} names "${citation}", a step ${FLOW_DOCUMENT} draws ` +
        `${String(matched.length)} times, in ${matched.map((marker) => `"${marker.stage}"`).join(" and ")} ` +
        `— no wording separates them, so name the stage instead`
      : `${file}: ${field} names "${citation}", which fits ${String(matched.length)} lines of ` +
        `${FLOW_DOCUMENT} — quote enough of the one you mean to leave the others out`,
  ];
};

const resolved = (
  citations: readonly string[],
  markers: readonly Marker[]
): readonly Marker[] =>
  citations.flatMap((citation) => {
    const matched = markersMatching(citation, markers);

    return matched.length === ONE ? matched : [];
  });

export const pathComplaints = (
  file: string,
  log: string,
  markers: readonly Marker[],
  stillBeingWritten: boolean
): readonly string[] => {
  if (!stillBeingWritten) {
    return [];
  }

  const fields = fieldsIn(log);
  const estimated = estimateComplaints(file, fields);
  const missing = THE_OWED_FIELDS.filter((field) => !fields.has(field));

  if (missing.length > NOTHING) {
    return [
      ...estimated,
      ...missing.map(
        (field) =>
          `${file}: no "${field}:" line — the walk through ${FLOW_DOCUMENT} is what shows a ` +
          `phase that went round a stage rather than through it, and a field left out reads ` +
          `exactly like a stage nobody skipped`
      ),
    ];
  }

  const walked = citationsIn(fields.get(WALKED) ?? NOWHERE, BETWEEN_STAGES);
  const skipped = citationsIn(fields.get(SKIPPED) ?? NOWHERE, BETWEEN_ENTRIES);
  const onTheWalk = resolved(walked, markers);
  const goneRound = resolved(skipped, markers);
  const accounted = new Set(
    [...walked, ...skipped]
      .flatMap((citation) => markersMatching(citation, markers))
      .map((marker) => marker.stage)
  );
  const walkedStages = new Set(onTheWalk.map((marker) => marker.stage));
  const sameLineTwice = goneRound.filter((round) =>
    onTheWalk.some((marker) => marker.kind === round.kind && marker.text === round.text)
  );
  const walkedAfterAll = goneRound.filter(
    (round) => round.kind === A_STAGE && walkedStages.has(round.stage) && !sameLineTwice.includes(round)
  );

  return [
    ...estimated,
    ...walked.flatMap((citation) =>
      complaintAbout(file, WALKED, citation, markersMatching(citation, markers))
    ),
    ...skipped.flatMap((citation) =>
      complaintAbout(file, SKIPPED, citation, markersMatching(citation, markers))
    ),
    ...stageTitlesIn(markers)
      .filter((title) => !accounted.has(title))
      .map(
        (title) =>
          `${file}: says nothing about the "${title}" stage — every stage of ` +
          `${FLOW_DOCUMENT} is either on the walk or in the skipped list, so that a ` +
          `phase which quietly went round one cannot read as a phase that forgot to mention it`
      ),
    ...sameLineTwice.map(
      (marker) =>
        `${file}: puts "${marker.text}" on the walk and in the skipped list at once — ` +
        `one of the two is what actually happened`
    ),
    ...walkedAfterAll.map(
      (marker) =>
        `${file}: calls the whole "${marker.text}" stage skipped while the walk goes through ` +
        `a step of it — a stage is only skipped when nothing inside it happened, and the ` +
        `week's tally of what gets gone round is exactly what this would corrupt`
    ),
  ];
};

export const theLogsAmong = (entries: readonly string[]): readonly string[] =>
  entries.filter((entry) => A_MARKDOWN_FILE.test(entry));

export const stillBeingWritten = (gitSaid: readonly string[]): ReadonlySet<string> =>
  new Set(gitSaid.map((path) => path.trim()).filter((path) => path !== NOWHERE));

export interface Log {
  readonly file: string;
  readonly log: string;
}

export const logsOffTheMap = (
  logs: readonly Log[],
  markers: readonly Marker[],
  pending: ReadonlySet<string>
): readonly string[] =>
  logs.flatMap((carried) =>
    pathComplaints(carried.file, carried.log, markers, pending.has(carried.file))
  );

const gitSays = (...argv: readonly string[]): readonly string[] => {
  try {
    return execFileSync("git", argv, { encoding: "utf8" }).split(A_LINE);
  } catch {
    return [];
  }
};

export const phaseLogsOffTheMap = (): readonly string[] =>
  existsSync(PHASE_LOGS_FOLDER)
    ? logsOffTheMap(
        theLogsAmong(readdirSync(PHASE_LOGS_FOLDER)).map((entry) => ({
          file: `${PHASE_LOGS_FOLDER}/${entry}`,
          log: read(join(PHASE_LOGS_FOLDER, entry)),
        })),
        markersIn(read(FLOW_DOCUMENT)),
        stillBeingWritten([
          ...gitSays("diff", "--name-only", "HEAD", "--", PHASE_LOGS_FOLDER),
          ...gitSays("ls-files", "--others", "--exclude-standard", "--", PHASE_LOGS_FOLDER),
          ...gitSays("diff", "--name-only", THE_PUBLISHED_TRUNK, "--", PHASE_LOGS_FOLDER),
        ])
      )
    : [];

import { escapeHtml, preBlock } from "../../integrations/telegram/html.ts";
import {
  isReady,
  nameAt,
  recordedPlacements,
  remainingSlots,
  type CardState,
} from "../game/state.ts";
import { strings } from "./strings.ts";


const MARKER_WIDTH = 2;

const COLUMN_GAP = "  ";

interface Row {
  readonly marker: string;
  readonly name: string;
  readonly note: string;
}

const rowsOf = (state: CardState): readonly Row[] => {
  const settled = isReady(state);
  const lastPosition = state.exits.length + 1;
  const shared = remainingSlots(state).length > 1;

  const exited = recordedPlacements(state).map(({ slot, position }) => ({
    marker: String(position),
    name: nameAt(state, slot),
    note: "",
  }));

  const pending = remainingSlots(state).map((slot) => ({
    marker: settled ? String(lastPosition) : strings.pendingMark,
    name: nameAt(state, slot),
    note: settled ? (shared ? strings.labelDraw : strings.labelFool) : "",
  }));

  return [...exited, ...pending];
};

const formatRows = (rows: readonly Row[]): readonly string[] => {
  const nameWidth = rows.reduce((widest, row) => Math.max(widest, row.name.length), 0);

  return rows.map((row) =>
    [
      row.marker.padStart(MARKER_WIDTH),
      escapeHtml(row.name.padEnd(nameWidth)),
      row.note,
    ]
      .join(COLUMN_GAP)
      .trimEnd()
  );
};

export const renderCard = (state: CardState, gameNumber: number): string => {
  const header = strings.header(gameNumber, state.seats.length);

  if (state.starterSlot === null) {
    return [header, strings.askStarter].join("\n");
  }

  return [
    header,
    strings.dealtFirst(escapeHtml(nameAt(state, state.starterSlot))),
    "",
    preBlock(formatRows(rowsOf(state))),
  ].join("\n");
};

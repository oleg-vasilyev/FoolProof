import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionKind } from "#replace-names/domain/replace-states.ts";
import { copy } from "#replace-names/copy.en.ts";
import { ControlRowStub } from "#shared/telegram/control-row.stub.ts";


const encodeReplaceCallbackSpy = vi.fn();

const controls = new ControlRowStub();

vi.mock("#replace-names/render/replace-callback-codec.ts", () => ({
  encodeReplaceCallback: (payload: unknown, action: unknown) =>
    encodeReplaceCallbackSpy(payload, action),
}));

vi.mock("#shared/telegram/control-row.ts", () => controls.module);

const { renderReplaceKeyboard } = await import("#replace-names/render/replace-keyboard.ts");

const PAYLOAD = { firstGameId: 12, fromId: 7, toId: 3 } as const;

const ENCODED_CANCEL = "encoded-cancel";

const ENCODED_CONFIRM = "encoded-confirm";

const ONE_ROW = 1;

const FIRST_CALL = 0;

const ONLY_ARGUMENT = 0;

const ONLY_ROW = 0;

const NOTHING_TO_UNDO = false;

const THE_CONTROLS = [{ text: "the control row", callback_data: "controls" }];

const handedOver = () => {
  renderReplaceKeyboard(copy, PAYLOAD);

  return controls.controlRowSpy.mock.calls[FIRST_CALL]?.[ONLY_ARGUMENT];
};

describe("renderReplaceKeyboard(copy, )", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    encodeReplaceCallbackSpy.mockImplementation((_payload: unknown, action: unknown) =>
      action === ActionKind.Confirm ? ENCODED_CONFIRM : ENCODED_CANCEL
    );
    controls.controlRowSpy.mockReturnValue(THE_CONTROLS);
  });

  it("should draw exactly one row", () => {
    expect(renderReplaceKeyboard(copy, PAYLOAD)).toHaveLength(ONE_ROW);
  });

  it("should draw the row the shared builder returned, rather than one of its own", () => {
    expect(renderReplaceKeyboard(copy, PAYLOAD)[ONLY_ROW]).toEqual(THE_CONTROLS);
  });

  it("should hand over Cancel as the way off", () => {
    expect(handedOver()?.cancel).toEqual({ text: copy.buttonCancel, callback_data: ENCODED_CANCEL });
  });

  it("should hand over Cancel in place of Back, because there is nothing to step back to", () => {
    expect(handedOver()?.back).toEqual({ text: copy.buttonCancel, callback_data: ENCODED_CANCEL });
  });

  it("should hand over Confirm as the way on", () => {
    expect(handedOver()?.wayOn).toEqual({ text: copy.buttonConfirm, callback_data: ENCODED_CONFIRM });
  });

  it("should say there is nothing to undo", () => {
    expect(handedOver()?.anythingToUndo).toBe(NOTHING_TO_UNDO);
  });

  it("should send cancel to the codec with the payload it guards", () => {
    renderReplaceKeyboard(copy, PAYLOAD);

    expect(encodeReplaceCallbackSpy).toHaveBeenCalledWith(PAYLOAD, ActionKind.Cancel);
  });

  it("should send confirm to the codec with the payload it guards", () => {
    renderReplaceKeyboard(copy, PAYLOAD);

    expect(encodeReplaceCallbackSpy).toHaveBeenCalledWith(PAYLOAD, ActionKind.Confirm);
  });
});

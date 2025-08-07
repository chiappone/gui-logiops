import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import KeyRecorder from "../../renderer/components/KeyRecorder";

describe("KeyRecorder", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders with initial value", () => {
    render(
      <KeyRecorder
        value={["KEY_LEFTCTRL", "KEY_C"]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    expect(screen.getByDisplayValue("KEY_LEFTCTRL, KEY_C")).toBeInTheDocument();
  });

  it("allows manual text input", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "KEY_A, KEY_B" } });

    expect(mockOnChange).toHaveBeenCalledWith(["KEY_A", "KEY_B"]);
  });

  it("starts recording when record button is clicked", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    const recordButton = screen.getByText("🎯 Record");
    fireEvent.click(recordButton);

    expect(screen.getByText("⏹️ Stop")).toBeInTheDocument();
    expect(screen.getByText("🔴 Recording keys...")).toBeInTheDocument();
  });

  it("stops recording when stop button is clicked", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    // Start recording
    const recordButton = screen.getByText("🎯 Record");
    fireEvent.click(recordButton);

    // Stop recording
    const stopButton = screen.getByText("⏹️ Stop");
    fireEvent.click(stopButton);

    expect(screen.getByText("🎯 Record")).toBeInTheDocument();
    expect(screen.queryByText("🔴 Recording keys...")).not.toBeInTheDocument();
  });

  it("clears keys when clear button is clicked", () => {
    render(
      <KeyRecorder
        value={["KEY_A", "KEY_B"]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    const clearButton = screen.getByText("🗑️ Clear");
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("records key combinations during recording mode", async () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    // Start recording
    const recordButton = screen.getByText("🎯 Record");
    fireEvent.click(recordButton);

    // Simulate key press
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { code: "ControlLeft" });
    fireEvent.keyDown(input, { code: "KeyC" });

    // Wait for auto-stop after timeout
    await waitFor(
      () => {
        expect(mockOnChange).toHaveBeenCalledWith(["KEY_LEFTCTRL", "KEY_C"]);
      },
      { timeout: 1500 }
    );
  });

  it("shows placeholder text correctly", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        placeholder="Custom placeholder"
        label="Test Keys"
        id="test-keys"
      />
    );

    expect(
      screen.getByPlaceholderText("Custom placeholder")
    ).toBeInTheDocument();
  });

  it("disables clear button during recording", () => {
    render(
      <KeyRecorder
        value={["KEY_A"]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    // Start recording
    const recordButton = screen.getByText("🎯 Record");
    fireEvent.click(recordButton);

    const clearButton = screen.getByText("🗑️ Clear");
    expect(clearButton).toBeDisabled();
  });

  it("makes input readonly during recording", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    // Start recording
    const recordButton = screen.getByText("🎯 Record");
    fireEvent.click(recordButton);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("readonly");
  });

  it("trims whitespace from manual input", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: " KEY_A , KEY_B " } });

    expect(mockOnChange).toHaveBeenCalledWith(["KEY_A", "KEY_B"]);
  });

  it("filters out empty keys from manual input", () => {
    render(
      <KeyRecorder
        value={[]}
        onChange={mockOnChange}
        label="Test Keys"
        id="test-keys"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "KEY_A,,KEY_B," } });

    expect(mockOnChange).toHaveBeenCalledWith(["KEY_A", "KEY_B"]);
  });
});

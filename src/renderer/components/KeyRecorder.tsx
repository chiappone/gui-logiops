import React, { useState, useCallback, useEffect, useRef } from "react";

interface KeyRecorderProps {
  value: string[];
  onChange: (keys: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  label?: string;
}

// Map of JavaScript key codes to Linux input key codes
const KEY_CODE_MAP: Record<string, string> = {
  // Letters
  KeyA: "KEY_A",
  KeyB: "KEY_B",
  KeyC: "KEY_C",
  KeyD: "KEY_D",
  KeyE: "KEY_E",
  KeyF: "KEY_F",
  KeyG: "KEY_G",
  KeyH: "KEY_H",
  KeyI: "KEY_I",
  KeyJ: "KEY_J",
  KeyK: "KEY_K",
  KeyL: "KEY_L",
  KeyM: "KEY_M",
  KeyN: "KEY_N",
  KeyO: "KEY_O",
  KeyP: "KEY_P",
  KeyQ: "KEY_Q",
  KeyR: "KEY_R",
  KeyS: "KEY_S",
  KeyT: "KEY_T",
  KeyU: "KEY_U",
  KeyV: "KEY_V",
  KeyW: "KEY_W",
  KeyX: "KEY_X",
  KeyY: "KEY_Y",
  KeyZ: "KEY_Z",

  // Numbers
  Digit0: "KEY_0",
  Digit1: "KEY_1",
  Digit2: "KEY_2",
  Digit3: "KEY_3",
  Digit4: "KEY_4",
  Digit5: "KEY_5",
  Digit6: "KEY_6",
  Digit7: "KEY_7",
  Digit8: "KEY_8",
  Digit9: "KEY_9",

  // Function keys
  F1: "KEY_F1",
  F2: "KEY_F2",
  F3: "KEY_F3",
  F4: "KEY_F4",
  F5: "KEY_F5",
  F6: "KEY_F6",
  F7: "KEY_F7",
  F8: "KEY_F8",
  F9: "KEY_F9",
  F10: "KEY_F10",
  F11: "KEY_F11",
  F12: "KEY_F12",

  // Modifiers
  ControlLeft: "KEY_LEFTCTRL",
  ControlRight: "KEY_RIGHTCTRL",
  ShiftLeft: "KEY_LEFTSHIFT",
  ShiftRight: "KEY_RIGHTSHIFT",
  AltLeft: "KEY_LEFTALT",
  AltRight: "KEY_RIGHTALT",
  MetaLeft: "KEY_LEFTMETA",
  MetaRight: "KEY_RIGHTMETA",

  // Special keys
  Space: "KEY_SPACE",
  Enter: "KEY_ENTER",
  Escape: "KEY_ESC",
  Backspace: "KEY_BACKSPACE",
  Tab: "KEY_TAB",
  Delete: "KEY_DELETE",
  Insert: "KEY_INSERT",
  Home: "KEY_HOME",
  End: "KEY_END",
  PageUp: "KEY_PAGEUP",
  PageDown: "KEY_PAGEDOWN",

  // Arrow keys
  ArrowUp: "KEY_UP",
  ArrowDown: "KEY_DOWN",
  ArrowLeft: "KEY_LEFT",
  ArrowRight: "KEY_RIGHT",

  // Punctuation
  Semicolon: "KEY_SEMICOLON",
  Equal: "KEY_EQUAL",
  Comma: "KEY_COMMA",
  Minus: "KEY_MINUS",
  Period: "KEY_DOT",
  Slash: "KEY_SLASH",
  Backquote: "KEY_GRAVE",
  BracketLeft: "KEY_LEFTBRACE",
  Backslash: "KEY_BACKSLASH",
  BracketRight: "KEY_RIGHTBRACE",
  Quote: "KEY_APOSTROPHE",

  // Numpad
  Numpad0: "KEY_KP0",
  Numpad1: "KEY_KP1",
  Numpad2: "KEY_KP2",
  Numpad3: "KEY_KP3",
  Numpad4: "KEY_KP4",
  Numpad5: "KEY_KP5",
  Numpad6: "KEY_KP6",
  Numpad7: "KEY_KP7",
  Numpad8: "KEY_KP8",
  Numpad9: "KEY_KP9",
  NumpadAdd: "KEY_KPPLUS",
  NumpadSubtract: "KEY_KPMINUS",
  NumpadMultiply: "KEY_KPASTERISK",
  NumpadDivide: "KEY_KPSLASH",
  NumpadDecimal: "KEY_KPDOT",
  NumpadEnter: "KEY_KPENTER",

  // Media keys
  AudioVolumeUp: "KEY_VOLUMEUP",
  AudioVolumeDown: "KEY_VOLUMEDOWN",
  AudioVolumeMute: "KEY_MUTE",
  MediaPlayPause: "KEY_PLAYPAUSE",
  MediaStop: "KEY_STOPCD",
  MediaTrackNext: "KEY_NEXTSONG",
  MediaTrackPrevious: "KEY_PREVIOUSSONG",
};

const KeyRecorder: React.FC<KeyRecorderProps> = ({
  value,
  onChange,
  placeholder = "Click to record keys, or type manually",
  className = "",
  id,
  label,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<Set<string>>(new Set());
  const [displayValue, setDisplayValue] = useState(value.join(", "));
  const [debugMode, setDebugMode] = useState(false);
  const [lastKeyEvent, setLastKeyEvent] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value.join(", "));
  }, [value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      // Always try to prevent default and stop propagation first
      event.preventDefault();
      event.stopPropagation();

      // Log all key information for debugging
      console.log("Key event details:", {
        code: event.code,
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
      });

      const keyCode = KEY_CODE_MAP[event.code];
      if (keyCode) {
        setRecordedKeys((prev) => new Set([...prev, keyCode]));
        console.log(`✅ Captured key: ${event.code} -> ${keyCode}`);
      } else {
        console.log(`❌ Unknown key code: ${event.code}`);
        // Still record unknown keys with a fallback format
        const fallbackKey = `KEY_${event.code.replace(/^Key|^Digit/, "")}`;
        setRecordedKeys((prev) => new Set([...prev, fallbackKey]));
        console.log(`🔄 Using fallback: ${fallbackKey}`);
      }
    },
    [isRecording]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      event.preventDefault();
      event.stopPropagation();
    },
    [isRecording]
  );

  const startRecording = useCallback(() => {
    setIsRecording(true);
    // Don't clear recordedKeys - preserve any existing keys (like manually typed Super key)
    setRecordedKeys(new Set());

    // Focus the input to capture key events
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    // Combine existing keys with newly recorded keys
    const existingKeys = value; // Keys that were already in the input
    const newlyRecordedKeys = Array.from(recordedKeys);

    // Merge existing and new keys, avoiding duplicates
    const allKeys = [...existingKeys];
    newlyRecordedKeys.forEach((key) => {
      if (!allKeys.includes(key)) {
        allKeys.push(key);
      }
    });

    if (allKeys.length > 0) {
      onChange(allKeys);
      setDisplayValue(allKeys.join(", "));
    }

    setRecordedKeys(new Set());
  }, [recordedKeys, onChange, value]);

  const handleManualInput = useCallback(
    (inputValue: string) => {
      setDisplayValue(inputValue);

      // Parse manual input
      const keys = inputValue
        .split(",")
        .map((key) => key.trim())
        .filter((key) => key.length > 0);

      onChange(keys);
    },
    [onChange]
  );

  const clearKeys = useCallback(() => {
    onChange([]);
    setDisplayValue("");
  }, [onChange]);

  // Add event listeners when recording - try multiple capture methods
  useEffect(() => {
    if (isRecording) {
      // Method 1: Document level with capture phase
      document.addEventListener("keydown", handleKeyDown, true);
      document.addEventListener("keyup", handleKeyUp, true);

      // Method 2: Window level capture (more aggressive)
      window.addEventListener("keydown", handleKeyDown, true);
      window.addEventListener("keyup", handleKeyUp, true);

      // Method 3: Try to capture on the input element directly
      const inputElement = inputRef.current;
      if (inputElement) {
        inputElement.addEventListener("keydown", handleKeyDown, true);
        inputElement.addEventListener("keyup", handleKeyUp, true);
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
        document.removeEventListener("keyup", handleKeyUp, true);
        window.removeEventListener("keydown", handleKeyDown, true);
        window.removeEventListener("keyup", handleKeyUp, true);

        if (inputElement) {
          inputElement.removeEventListener("keydown", handleKeyDown, true);
          inputElement.removeEventListener("keyup", handleKeyUp, true);
        }
      };
    }
  }, [isRecording, handleKeyDown, handleKeyUp]);

  // Debug mode listener - always active when debug mode is on
  useEffect(() => {
    if (debugMode && !isRecording) {
      const debugKeyHandler = (event: KeyboardEvent) => {
        const eventDetails = `${event.code} (${event.key}) - Meta:${event.metaKey} Ctrl:${event.ctrlKey} Alt:${event.altKey}`;
        setLastKeyEvent(eventDetails);
        console.log("🔍 Debug key event:", eventDetails);
      };

      document.addEventListener("keydown", debugKeyHandler, true);
      window.addEventListener("keydown", debugKeyHandler, true);

      return () => {
        document.removeEventListener("keydown", debugKeyHandler, true);
        window.removeEventListener("keydown", debugKeyHandler, true);
      };
    }
  }, [debugMode, isRecording]);

  // Auto-stop recording after a short delay when keys are released
  useEffect(() => {
    if (isRecording && recordedKeys.size > 0) {
      const timer = setTimeout(() => {
        stopRecording();
      }, 1000); // Stop recording 1 second after last key

      return () => clearTimeout(timer);
    }
  }, [isRecording, recordedKeys.size, stopRecording]);

  return (
    <div className={`key-recorder ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}

      <div className="key-recorder-input-group">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={
            isRecording ? Array.from(recordedKeys).join(", ") : displayValue
          }
          onChange={(e) => !isRecording && handleManualInput(e.target.value)}
          placeholder={isRecording ? "Press keys to record..." : placeholder}
          className={`key-recorder-input ${isRecording ? "recording" : ""}`}
          readOnly={isRecording}
        />

        <div className="key-recorder-buttons">
          {!isRecording ? (
            <button
              type="button"
              className="record-button"
              onClick={startRecording}
              title="Record key combination"
            >
              🎯 Record
            </button>
          ) : (
            <button
              type="button"
              className="stop-button"
              onClick={stopRecording}
              title="Stop recording"
            >
              ⏹️ Stop
            </button>
          )}

          <button
            type="button"
            className="clear-button"
            onClick={clearKeys}
            title="Clear all keys"
            disabled={isRecording}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="recording-status">
          <span className="recording-indicator">🔴 Recording keys...</span>
          <small>
            Press your key combination, then wait 1 second or click Stop
            <br />
            <strong>💡 Tip:</strong> New keys will be added to existing ones -
            perfect for adding Super key manually first!
            <br />
            <strong>Note:</strong> Some system shortcuts (like Alt+Tab,
            Ctrl+Alt+T) may be intercepted by your desktop environment
          </small>
        </div>
      )}

      {recordedKeys.size > 0 && isRecording && (
        <div className="recorded-keys-preview">
          <strong>Recorded:</strong> {Array.from(recordedKeys).join(", ")}
        </div>
      )}

      {!isRecording && value.length === 0 && (
        <div className="key-recorder-help">
          <small>
            <strong>💡 Pro Tip:</strong> For Super key combinations, type
            "KEY_LEFTMETA, " manually first, then click Record to add the next
            key!
            <br />
            <strong>⚠️ Note:</strong> Super/Windows key combinations are usually
            intercepted by your desktop environment and cannot be recorded - use
            the buttons below instead.
          </small>
          <div className="common-keys">
            <div className="super-key-section">
              <strong>
                Super/Windows key combinations (use these buttons - recording
                won't work):
              </strong>
              <div className="key-suggestions">
                <button
                  type="button"
                  onClick={() => {
                    const newKeys = [...value];
                    if (!newKeys.includes("KEY_LEFTMETA")) {
                      newKeys.push("KEY_LEFTMETA");
                      onChange(newKeys);
                    }
                  }}
                  title="Add Super key to current combination"
                >
                  + Super
                </button>
              </div>
            </div>
            <details className="manual-typing-guide">
              <summary>📝 Manual typing reference</summary>
              <div className="key-reference">
                <div className="key-category">
                  <strong>Modifiers:</strong>
                  <code>
                    KEY_LEFTCTRL, KEY_RIGHTCTRL, KEY_LEFTALT, KEY_RIGHTALT,
                    KEY_LEFTMETA, KEY_RIGHTMETA, KEY_LEFTSHIFT, KEY_RIGHTSHIFT
                  </code>
                </div>
                <div className="key-category">
                  <strong>Common keys:</strong>
                  <code>
                    KEY_A to KEY_Z, KEY_0 to KEY_9, KEY_F1 to KEY_F12,
                    KEY_SPACE, KEY_ENTER, KEY_ESC
                  </code>
                </div>
                <div className="key-category">
                  <strong>Navigation:</strong>
                  <code>
                    KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_HOME, KEY_END,
                    KEY_PAGEUP, KEY_PAGEDOWN
                  </code>
                </div>
                <div className="key-category">
                  <strong>Example:</strong>
                  <code>KEY_LEFTMETA, KEY_PAGEDOWN</code> (for Super+PageDown)
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyRecorder;

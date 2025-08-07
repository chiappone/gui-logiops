/**
 * Core data models and TypeScript interfaces for logiops configuration
 */

export interface LogiopsConfiguration {
  devices: Device[];
  metadata: ConfigurationMetadata;
}

export interface Device {
  name: string;
  vid?: string; // Vendor ID (hexadecimal) - optional for simplified configs
  pid?: string; // Product ID (hexadecimal) - optional for simplified configs
  timeout?: number; // Timeout in milliseconds
  smartshift?: SmartShiftSettings;
  dpi?: DPISettings;
  buttons?: ButtonMapping[];
  gestures?: GestureMapping[];
  scrollWheel?: ScrollWheelSettings; // Also known as hiresscroll
}

export interface SmartShiftSettings {
  on: boolean;
  threshold: number;
}

export interface DPISettings {
  sensors: DPISensor[];
}

export interface DPISensor {
  dpi: number;
  default?: boolean;
}

export interface ButtonMapping {
  cid: string; // Control ID (hexadecimal)
  action: ButtonAction;
}

export interface ButtonAction {
  type: "Keypress" | "Gestures" | "ChangeDPI" | "ToggleSmartShift" | "CycleHiRes" | "ToggleHiRes" | "Axis" | "key" | "gesture" | "changeDPI" | "toggleSmartShift" | "cycleHiRes" | "toggleHiRes";
  parameters?: ButtonActionParameters;
}

export interface ButtonActionParameters {
  // For key actions
  keys?: string[];
  
  // For changeDPI actions
  sensor?: number;
  
  // For gesture actions
  gesture?: GestureMapping;
  gestures?: GestureMapping[];
  
  // For axis actions
  axis?: string;
  axis_multiplier?: number;
  
  // Generic parameters for extensibility
  [key: string]: unknown;
}

export interface GestureMapping {
  direction: "up" | "down" | "left" | "right" | "none";
  mode: "OnRelease" | "OnFewPixels" | "OnInterval";
  action: ButtonAction;
  threshold?: number; // For OnFewPixels mode
  interval?: number; // For OnInterval mode
}

export interface ScrollWheelSettings {
  hires?: boolean;
  invert?: boolean;
  target?: boolean;
  up?: ButtonAction;
  down?: ButtonAction;
  left?: ButtonAction;
  right?: ButtonAction;
}

export interface ConfigurationMetadata {
  version: string;
  created: Date;
  modified: Date;
  filename?: string;
  originalContent?: string; // Store original .cfg content for comparison
}

// UI State Management interfaces
export interface ApplicationState {
  currentConfiguration: LogiopsConfiguration;
  isModified: boolean;
  validationErrors: ValidationError[];
  selectedDevice: string | null;
  activePanel: "device" | "preview" | "tree";
  recentFiles: string[];
  preferences: UserPreferences;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
  field?: string;
}

export interface UserPreferences {
  autoSave: boolean;
  autoSaveInterval: number; // in minutes
  theme: "light" | "dark" | "system";
  recentFilesLimit: number;
  showTooltips: boolean;
  validateOnType: boolean;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Common device information
export interface DeviceInfo {
  name: string;
  vid: string;
  pid: string;
  description?: string;
  buttonCount?: number;
  supportedFeatures: DeviceFeature[];
}

export type DeviceFeature = "dpi" | "buttons" | "gestures" | "scrollWheel" | "smartShift" | "hiRes";

// Constants for validation
export const VALIDATION_CONSTANTS = {
  DPI: {
    MIN: 50,
    MAX: 25600,
    DEFAULT: 1000
  },
  GESTURE_THRESHOLD: {
    MIN: 1,
    MAX: 100,
    DEFAULT: 10
  },
  GESTURE_INTERVAL: {
    MIN: 1,
    MAX: 1000,
    DEFAULT: 100
  },
  HEX_PATTERN: /^0x[0-9a-fA-F]+$/,
  BUTTON_CID_PATTERN: /^0x[0-9a-fA-F]{2}$/,
  DEVICE_ID_PATTERN: /^0x[0-9a-fA-F]{4}$/
} as const;

// Common Logitech device IDs for validation and suggestions
export const COMMON_LOGITECH_DEVICES: DeviceInfo[] = [
  {
    name: "MX Master 3S",
    vid: "0x046d",
    pid: "0x4082",
    description: "Logitech MX Master 3 Advanced Wireless Mouse",
    buttonCount: 7,
    supportedFeatures: ["dpi", "buttons", "gestures", "scrollWheel", "smartShift"]
  },
  {
    name: "MX Master 2S",
    vid: "0x046d", 
    pid: "0x4069",
    description: "Logitech MX Master 2S Wireless Mouse",
    buttonCount: 7,
    supportedFeatures: ["dpi", "buttons", "gestures", "scrollWheel", "smartShift"]
  },
  {
    name: "G502 HERO",
    vid: "0x046d",
    pid: "0xc08b",
    description: "Logitech G502 HERO Gaming Mouse",
    buttonCount: 11,
    supportedFeatures: ["dpi", "buttons", "scrollWheel"]
  }
];
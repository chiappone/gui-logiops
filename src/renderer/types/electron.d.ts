export interface FileOperationResult {
  canceled?: boolean;
  filePath?: string;
  content?: string;
  filename?: string;
  error?: string;
}

export interface FileSystemResult {
  success: boolean;
  content?: string;
  error?: string;
  exists?: boolean;
  backupPath?: string;
}

export interface PreferencesResult {
  success: boolean;
  preferences?: any;
  error?: string;
}

export interface SystemStatus {
  logidInstalled: boolean;
  logidRunning: boolean;
  logidVersion?: string;
  configPath: string;
  hasPermissions: boolean;
  systemdAvailable: boolean;
}

export interface SystemOperationResult {
  success: boolean;
  error?: string;
  deployedPath?: string;
}

export interface PermissionCheckResult {
  hasPermissions: boolean;
  suggestions: string[];
}

export interface ElectronAPI {
  // Menu events - unified handler
  onMenuEvent: (callback: (event: string) => void) => void;

  // Menu events - individual handlers
  onMenuNewConfig: (callback: () => void) => void;
  onMenuOpenConfig: (callback: () => void) => void;
  onMenuSaveConfig: (callback: () => void) => void;
  onMenuAbout: (callback: () => void) => void;

  // File operations
  openFile: () => Promise<FileOperationResult>;
  saveFile: (content: string, filePath?: string, defaultFilename?: string) => Promise<FileOperationResult>;
  
  // File system operations
  readFile: (filePath: string) => Promise<FileSystemResult>;
  writeFile: (filePath: string, content: string) => Promise<FileSystemResult>;
  fileExists: (filePath: string) => Promise<{ exists: boolean }>;
  createBackup: (filePath: string) => Promise<FileSystemResult>;
  
  // Preferences and recent files
  getPreferences: () => Promise<PreferencesResult>;
  setPreferences: (preferences: any) => Promise<FileSystemResult>;

  // System integration
  checkLogidStatus: () => Promise<SystemStatus>;
  startLogidService: () => Promise<SystemOperationResult>;
  stopLogidService: () => Promise<SystemOperationResult>;
  deployConfiguration: (configContent: string, targetPath?: string) => Promise<SystemOperationResult>;
  checkPermissions: () => Promise<PermissionCheckResult>;

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
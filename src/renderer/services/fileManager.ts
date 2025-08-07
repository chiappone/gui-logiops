/**
 * File management service for handling configuration files, recent files, auto-save, and backups
 */

import { LogiopsConfiguration, UserPreferences } from '../types/logiops';
import { parseConfigFile, generateConfigFile } from '../utils/configParser';

export interface FileInfo {
  path: string;
  filename: string;
  lastModified: Date;
  size?: number;
}

export interface RecentFile extends FileInfo {
  lastOpened: Date;
}

export interface AutoSaveState {
  isEnabled: boolean;
  intervalId?: NodeJS.Timeout;
  lastSaveTime?: Date;
  pendingChanges: boolean;
}

export class FileManager {
  private currentFile: FileInfo | null = null;
  private preferences: UserPreferences;
  private recentFiles: RecentFile[] = [];
  private autoSaveState: AutoSaveState = {
    isEnabled: false,
    pendingChanges: false
  };
  private changeListeners: Array<(hasChanges: boolean) => void> = [];
  private fileLoadListeners: Array<(file: FileInfo | null) => void> = [];

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.loadPreferences();
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      autoSave: false,
      autoSaveInterval: 5,
      theme: 'system',
      recentFilesLimit: 10,
      showTooltips: true,
      validateOnType: true
    };
  }

  /**
   * Load user preferences from storage
   */
  async loadPreferences(): Promise<void> {
    try {
      const result = await window.electronAPI.getPreferences();
      if (result.success && result.preferences) {
        this.preferences = { ...this.getDefaultPreferences(), ...result.preferences };
        this.recentFiles = result.preferences.recentFiles || [];
        
        // Update auto-save state based on preferences
        this.updateAutoSaveState();
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
  }

  /**
   * Save user preferences to storage
   */
  async savePreferences(): Promise<void> {
    try {
      const preferencesToSave = {
        ...this.preferences,
        recentFiles: this.recentFiles
      };
      
      const result = await window.electronAPI.setPreferences(preferencesToSave);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(newPreferences: Partial<UserPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    await this.savePreferences();
    this.updateAutoSaveState();
  }

  /**
   * Get current preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Open a configuration file
   */
  async openFile(): Promise<{ config: LogiopsConfiguration; file: FileInfo } | null> {
    try {
      const result = await window.electronAPI.openFile();
      
      if (result.canceled || result.error) {
        if (result.error) {
          throw new Error(result.error);
        }
        return null;
      }

      if (!result.filePath || !result.content || !result.filename) {
        throw new Error('Invalid file operation result');
      }

      const config = parseConfigFile(result.content, result.filename);
      
      const fileInfo: FileInfo = {
        path: result.filePath,
        filename: result.filename,
        lastModified: new Date()
      };

      this.currentFile = fileInfo;
      this.addToRecentFiles(fileInfo);
      this.notifyFileLoaded(fileInfo);
      this.setPendingChanges(false);

      return { config, file: fileInfo };
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async saveFile(config: LogiopsConfiguration, filePath?: string): Promise<FileInfo> {
    try {
      // Create backup if file exists and backup is enabled
      if (filePath && this.preferences.autoSave) {
        await this.createBackup(filePath);
      }

      const content = generateConfigFile(config);
      const result = await window.electronAPI.saveFile(content, filePath);

      if (result.canceled || result.error) {
        if (result.error) {
          throw new Error(result.error);
        }
        throw new Error('Save operation was canceled');
      }

      if (!result.filePath || !result.filename) {
        throw new Error('Invalid save operation result');
      }

      const fileInfo: FileInfo = {
        path: result.filePath,
        filename: result.filename,
        lastModified: new Date()
      };

      this.currentFile = fileInfo;
      this.addToRecentFiles(fileInfo);
      this.notifyFileLoaded(fileInfo);
      this.setPendingChanges(false);

      return fileInfo;
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }

  /**
   * Auto-save configuration
   */
  async autoSave(config: LogiopsConfiguration): Promise<void> {
    if (!this.currentFile || !this.autoSaveState.isEnabled || !this.autoSaveState.pendingChanges) {
      return;
    }

    try {
      await this.createBackup(this.currentFile.path);
      const content = generateConfigFile(config);
      const result = await window.electronAPI.writeFile(this.currentFile.path, content);

      if (!result.success) {
        throw new Error(result.error || 'Auto-save failed');
      }

      this.autoSaveState.lastSaveTime = new Date();
      this.setPendingChanges(false);
      
      console.log('Auto-saved configuration at', this.autoSaveState.lastSaveTime);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw error for auto-save failures to avoid disrupting user workflow
    }
  }

  /**
   * Create backup of current file
   */
  async createBackup(filePath: string): Promise<string | null> {
    try {
      const exists = await window.electronAPI.fileExists(filePath);
      if (!exists.exists) {
        return null;
      }

      const result = await window.electronAPI.createBackup(filePath);
      if (result.success && result.backupPath) {
        return result.backupPath;
      }
      
      throw new Error(result.error || 'Backup creation failed');
    } catch (error) {
      console.warn('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * Add file to recent files list
   */
  private addToRecentFiles(fileInfo: FileInfo): void {
    const recentFile: RecentFile = {
      ...fileInfo,
      lastOpened: new Date()
    };

    // Remove existing entry if present
    this.recentFiles = this.recentFiles.filter(f => f.path !== fileInfo.path);
    
    // Add to beginning of list
    this.recentFiles.unshift(recentFile);
    
    // Limit list size
    if (this.recentFiles.length > this.preferences.recentFilesLimit) {
      this.recentFiles = this.recentFiles.slice(0, this.preferences.recentFilesLimit);
    }

    // Save preferences with updated recent files
    this.savePreferences().catch(error => {
      console.warn('Failed to save recent files:', error);
    });
  }

  /**
   * Get recent files list
   */
  getRecentFiles(): RecentFile[] {
    return [...this.recentFiles];
  }

  /**
   * Clear recent files list
   */
  async clearRecentFiles(): Promise<void> {
    this.recentFiles = [];
    await this.savePreferences();
  }

  /**
   * Open a recent file
   */
  async openRecentFile(filePath: string): Promise<{ config: LogiopsConfiguration; file: FileInfo } | null> {
    try {
      const result = await window.electronAPI.readFile(filePath);
      
      if (!result.success || !result.content) {
        // Remove from recent files if file no longer exists
        this.recentFiles = this.recentFiles.filter(f => f.path !== filePath);
        await this.savePreferences();
        throw new Error(result.error || 'Failed to read file');
      }

      const config = parseConfigFile(result.content, filePath.split('/').pop() || 'unknown');
      
      const fileInfo: FileInfo = {
        path: filePath,
        filename: filePath.split('/').pop() || 'unknown',
        lastModified: new Date()
      };

      this.currentFile = fileInfo;
      this.addToRecentFiles(fileInfo);
      this.notifyFileLoaded(fileInfo);
      this.setPendingChanges(false);

      return { config, file: fileInfo };
    } catch (error) {
      console.error('Failed to open recent file:', error);
      throw error;
    }
  }

  /**
   * Get current file info
   */
  getCurrentFile(): FileInfo | null {
    return this.currentFile ? { ...this.currentFile } : null;
  }

  /**
   * Set pending changes state
   */
  setPendingChanges(hasChanges: boolean): void {
    if (this.autoSaveState.pendingChanges !== hasChanges) {
      this.autoSaveState.pendingChanges = hasChanges;
      this.notifyChangeListeners(hasChanges);
    }
  }

  /**
   * Check if there are pending changes
   */
  hasPendingChanges(): boolean {
    return this.autoSaveState.pendingChanges;
  }

  /**
   * Update auto-save state based on preferences
   */
  private updateAutoSaveState(): void {
    // Clear existing interval
    if (this.autoSaveState.intervalId) {
      clearInterval(this.autoSaveState.intervalId);
      this.autoSaveState.intervalId = undefined;
    }

    this.autoSaveState.isEnabled = this.preferences.autoSave;

    // Set up new interval if auto-save is enabled
    if (this.autoSaveState.isEnabled && this.preferences.autoSaveInterval > 0) {
      const intervalMs = this.preferences.autoSaveInterval * 60 * 1000; // Convert minutes to milliseconds
      
      this.autoSaveState.intervalId = setInterval(() => {
        // Auto-save will be triggered by the application when needed
        // This interval just ensures we check periodically
      }, intervalMs);
    }
  }

  /**
   * Add listener for file changes
   */
  addChangeListener(listener: (hasChanges: boolean) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove change listener
   */
  removeChangeListener(listener: (hasChanges: boolean) => void): void {
    this.changeListeners = this.changeListeners.filter(l => l !== listener);
  }

  /**
   * Add listener for file load events
   */
  addFileLoadListener(listener: (file: FileInfo | null) => void): void {
    this.fileLoadListeners.push(listener);
  }

  /**
   * Remove file load listener
   */
  removeFileLoadListener(listener: (file: FileInfo | null) => void): void {
    this.fileLoadListeners = this.fileLoadListeners.filter(l => l !== listener);
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(hasChanges: boolean): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(hasChanges);
      } catch (error) {
        console.error('Error in change listener:', error);
      }
    });
  }

  /**
   * Notify file load listeners
   */
  private notifyFileLoaded(file: FileInfo | null): void {
    this.fileLoadListeners.forEach(listener => {
      try {
        listener(file);
      } catch (error) {
        console.error('Error in file load listener:', error);
      }
    });
  }

  /**
   * Create new file
   */
  createNewFile(): void {
    this.currentFile = null;
    this.notifyFileLoaded(null);
    this.setPendingChanges(false);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.autoSaveState.intervalId) {
      clearInterval(this.autoSaveState.intervalId);
    }
    this.changeListeners = [];
    this.fileLoadListeners = [];
  }
}

// Singleton instance
let fileManagerInstance: FileManager | null = null;

export const fileManager = {
  getInstance(): FileManager {
    if (!fileManagerInstance) {
      fileManagerInstance = new FileManager();
    }
    return fileManagerInstance;
  },
  
  // For testing purposes
  resetInstance(): void {
    if (fileManagerInstance) {
      fileManagerInstance.destroy();
    }
    fileManagerInstance = null;
  }
};

// Proxy methods for backward compatibility
export const getFileManager = () => fileManager.getInstance();
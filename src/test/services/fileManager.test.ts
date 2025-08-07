/**
 * Tests for file management service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileManager } from '../../renderer/services/fileManager';
import { LogiopsConfiguration } from '../../renderer/types/logiops';

// Mock electron API
const mockElectronAPI = {
  openFile: vi.fn(),
  saveFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  fileExists: vi.fn(),
  createBackup: vi.fn(),
  getPreferences: vi.fn(),
  setPreferences: vi.fn()
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

// Helper function to create valid test configuration content
const createValidConfigContent = (deviceName: string = 'Test Device') => `devices: {
  name: "${deviceName}";
  vid: 0x046d;
  pid: 0x4082;
  dpi: {
    sensor0: {
      dpi: 1000;
      default: true;
    };
  };
};`;

describe('FileManager', () => {
  let fileManager: FileManager;
  let mockConfig: LogiopsConfiguration;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockElectronAPI.getPreferences.mockResolvedValue({
      success: true,
      preferences: {
        autoSave: false,
        autoSaveInterval: 5,
        theme: 'system',
        recentFilesLimit: 10,
        showTooltips: true,
        validateOnType: true,
        recentFiles: []
      }
    });

    mockElectronAPI.setPreferences.mockResolvedValue({ success: true });

    fileManager = new FileManager();

    mockConfig = {
      devices: [
        {
          name: 'Test Device',
          vid: '0x046d',
          pid: '0x4082',
          dpi: {
            sensors: [{ dpi: 1000, default: true }]
          }
        }
      ],
      metadata: {
        version: '1.0.0',
        created: new Date(),
        modified: new Date()
      }
    };
  });

  afterEach(() => {
    fileManager.destroy();
  });

  describe('File Operations', () => {
    it('should open a file successfully', async () => {
      const mockFileContent = createValidConfigContent();

      mockElectronAPI.openFile.mockResolvedValue({
        canceled: false,
        filePath: '/path/to/test.cfg',
        content: mockFileContent,
        filename: 'test.cfg'
      });

      const result = await fileManager.openFile();

      expect(result).toBeTruthy();
      expect(result!.file.filename).toBe('test.cfg');
      expect(result!.file.path).toBe('/path/to/test.cfg');
      expect(result!.config.devices).toHaveLength(1);
      expect(result!.config.devices[0].name).toBe('Test Device');
    });

    it('should handle file open cancellation', async () => {
      mockElectronAPI.openFile.mockResolvedValue({
        canceled: true
      });

      const result = await fileManager.openFile();

      expect(result).toBeNull();
    });

    it('should save a file successfully', async () => {
      mockElectronAPI.saveFile.mockResolvedValue({
        canceled: false,
        filePath: '/path/to/saved.cfg',
        filename: 'saved.cfg'
      });

      const result = await fileManager.saveFile(mockConfig);

      expect(result.filename).toBe('saved.cfg');
      expect(result.path).toBe('/path/to/saved.cfg');
      expect(mockElectronAPI.saveFile).toHaveBeenCalledWith(
        expect.stringContaining('devices: ('),
        undefined
      );
    });
  });

  describe('Recent Files', () => {
    it('should add files to recent files list', async () => {
      mockElectronAPI.openFile.mockResolvedValue({
        canceled: false,
        filePath: '/path/to/test.cfg',
        content: createValidConfigContent('Test'),
        filename: 'test.cfg'
      });

      await fileManager.openFile();

      const recentFiles = fileManager.getRecentFiles();
      expect(recentFiles).toHaveLength(1);
      expect(recentFiles[0].filename).toBe('test.cfg');
      expect(recentFiles[0].path).toBe('/path/to/test.cfg');
    });

    it('should clear recent files list', async () => {
      mockElectronAPI.openFile.mockResolvedValue({
        canceled: false,
        filePath: '/path/to/test.cfg',
        content: createValidConfigContent('Test'),
        filename: 'test.cfg'
      });

      await fileManager.openFile();
      expect(fileManager.getRecentFiles()).toHaveLength(1);

      await fileManager.clearRecentFiles();
      expect(fileManager.getRecentFiles()).toHaveLength(0);
    });
  });

  describe('Auto-save', () => {
    it('should enable auto-save when preferences are updated', async () => {
      await fileManager.updatePreferences({ autoSave: true, autoSaveInterval: 1 });

      const preferences = fileManager.getPreferences();
      expect(preferences.autoSave).toBe(true);
      expect(preferences.autoSaveInterval).toBe(1);
    });
  });

  describe('Change Tracking', () => {
    it('should track pending changes', () => {
      expect(fileManager.hasPendingChanges()).toBe(false);

      fileManager.setPendingChanges(true);
      expect(fileManager.hasPendingChanges()).toBe(true);

      fileManager.setPendingChanges(false);
      expect(fileManager.hasPendingChanges()).toBe(false);
    });
  });

  describe('Preferences Management', () => {
    it('should update preferences', async () => {
      await fileManager.updatePreferences({
        autoSave: true,
        theme: 'dark'
      });

      const preferences = fileManager.getPreferences();
      expect(preferences.autoSave).toBe(true);
      expect(preferences.theme).toBe('dark');
      expect(mockElectronAPI.setPreferences).toHaveBeenCalled();
    });

    it('should handle preferences save errors', async () => {
      mockElectronAPI.setPreferences.mockResolvedValue({
        success: false,
        error: 'Write failed'
      });

      await expect(fileManager.updatePreferences({ autoSave: true }))
        .rejects.toThrow('Failed to save preferences');
    });
  });

  describe('File State Management', () => {
    it('should create new file', () => {
      // First set a current file
      fileManager.setPendingChanges(true);

      fileManager.createNewFile();

      expect(fileManager.getCurrentFile()).toBeNull();
      expect(fileManager.hasPendingChanges()).toBe(false);
    });
  });
});
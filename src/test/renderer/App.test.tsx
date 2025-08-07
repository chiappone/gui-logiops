import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../renderer/App';
import { AppStateProvider } from '../../renderer/context/AppStateContext';
import { fileManager } from '../../renderer/services/fileManager';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

// Mock the electron API
const mockElectronAPI = {
  onMenuEvent: vi.fn(),
  onMenuNewConfig: vi.fn(),
  onMenuOpenConfig: vi.fn(),
  onMenuSaveConfig: vi.fn(),
  onMenuAbout: vi.fn(),
  openFile: vi.fn(),
  saveFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  fileExists: vi.fn(),
  createBackup: vi.fn(),
  getPreferences: vi.fn(),
  setPreferences: vi.fn(),
  checkLogidStatus: vi.fn(),
  startLogidService: vi.fn(),
  stopLogidService: vi.fn(),
  removeAllListeners: vi.fn(),
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('App Component', () => {
  beforeEach(() => {
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
    mockElectronAPI.openFile.mockResolvedValue({ canceled: true });
    mockElectronAPI.saveFile.mockResolvedValue({ canceled: true });
  });

  afterEach(() => {
    // Reset file manager instance for each test
    fileManager.resetInstance();
  });

  it('renders the main application layout', () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Check if main components are rendered
    expect(screen.getByText('Welcome to Logiops GUI')).toBeInTheDocument();
    expect(screen.getByText('This application helps you configure your Logitech devices through an intuitive interface.')).toBeInTheDocument();
  });

  it('renders toolbar with correct buttons', () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Check toolbar buttons
    expect(screen.getByTitle('New Configuration (Ctrl+N)')).toBeInTheDocument();
    expect(screen.getByTitle('Open Configuration (Ctrl+O)')).toBeInTheDocument();
    expect(screen.getByTitle('Save Configuration (Ctrl+S)')).toBeInTheDocument();
    expect(screen.getByTitle('Preview Configuration')).toBeInTheDocument();
  });

  it('renders status bar', () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Check status bar
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('No file loaded')).toBeInTheDocument();
  });

  it('handles toolbar button clicks', async () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Test New button
    const newButton = screen.getByTitle('New Configuration (Ctrl+N)');
    fireEvent.click(newButton);
    expect(screen.getByText('New configuration created')).toBeInTheDocument();
    
    // Test Open button
    const openButton = screen.getByTitle('Open Configuration (Ctrl+O)');
    fireEvent.click(openButton);
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(screen.getByText('File open canceled')).toBeInTheDocument();
    });
    
    // Test Preview button
    const previewButton = screen.getByTitle('Preview Configuration');
    fireEvent.click(previewButton);
    expect(screen.getByText('Showing configuration preview')).toBeInTheDocument();
  });

  it('sets up menu event listeners', () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Verify that menu event listener is set up
    expect(mockElectronAPI.onMenuEvent).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles save button state correctly', () => {
    render(<App />, { wrapper: TestWrapper });
    
    // Save button should be disabled initially
    const saveButton = screen.getByTitle('Save Configuration (Ctrl+S)');
    expect(saveButton).toBeDisabled();
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SystemStatusPanel } from '../../renderer/components/SystemStatusPanel';
import { systemIntegrationService } from '../../renderer/services/systemIntegration';
import { AppStateProvider } from '../../renderer/context/AppStateContext';

// Mock the system integration service
vi.mock('../../renderer/services/systemIntegration', () => ({
  systemIntegrationService: {
    checkSystemStatus: vi.fn(),
    startLogidService: vi.fn(),
    stopLogidService: vi.fn(),
    deployConfiguration: vi.fn(),
    checkPermissions: vi.fn(),
  }
}));

// Mock electron API
const mockElectronAPI = {
  checkLogidStatus: vi.fn(),
  startLogidService: vi.fn(),
  stopLogidService: vi.fn(),
  deployConfiguration: vi.fn(),
  checkPermissions: vi.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppStateProvider>
      {component}
    </AppStateProvider>
  );
};

describe('SystemStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(systemIntegrationService.checkSystemStatus).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    renderWithProvider(<SystemStatusPanel />);
    
    expect(screen.getByText('Checking system status...')).toBeInTheDocument();
    expect(screen.getByText('System Status')).toBeInTheDocument();
  });

  it('displays system status when loaded', async () => {
    const mockStatus = {
      logidInstalled: true,
      logidRunning: false,
      logidVersion: '0.3.0',
      configPath: '/etc/logid.cfg',
      hasPermissions: true,
      systemdAvailable: true
    };

    const mockPermissions = {
      hasPermissions: true,
      suggestions: []
    };

    vi.mocked(systemIntegrationService.checkSystemStatus).mockResolvedValue(mockStatus);
    vi.mocked(systemIntegrationService.checkPermissions).mockResolvedValue(mockPermissions);

    renderWithProvider(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getAllByText('✓ Yes')).toHaveLength(2); // Logid installed and Systemd available
      expect(screen.getByText('✗ No')).toBeInTheDocument(); // Logid not running
      expect(screen.getByText('0.3.0')).toBeInTheDocument(); // Version
      expect(screen.getByText('/etc/logid.cfg')).toBeInTheDocument(); // Config path
    });
  });

  it('shows service control buttons when logid is installed', async () => {
    const mockStatus = {
      logidInstalled: true,
      logidRunning: false,
      logidVersion: '0.3.0',
      configPath: '/etc/logid.cfg',
      hasPermissions: true,
      systemdAvailable: true
    };

    const mockPermissions = {
      hasPermissions: true,
      suggestions: []
    };

    vi.mocked(systemIntegrationService.checkSystemStatus).mockResolvedValue(mockStatus);
    vi.mocked(systemIntegrationService.checkPermissions).mockResolvedValue(mockPermissions);

    renderWithProvider(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Start Service')).toBeInTheDocument();
      expect(screen.getByText('Stop Service')).toBeInTheDocument();
    });

    // Start button should be enabled, stop button should be disabled
    const startButton = screen.getByText('Start Service');
    const stopButton = screen.getByText('Stop Service');
    
    expect(startButton).not.toBeDisabled();
    expect(stopButton).toBeDisabled();
  });

  it('handles start service action', async () => {
    const mockStatus = {
      logidInstalled: true,
      logidRunning: false,
      logidVersion: '0.3.0',
      configPath: '/etc/logid.cfg',
      hasPermissions: true,
      systemdAvailable: true
    };

    const mockPermissions = {
      hasPermissions: true,
      suggestions: []
    };

    vi.mocked(systemIntegrationService.checkSystemStatus).mockResolvedValue(mockStatus);
    vi.mocked(systemIntegrationService.checkPermissions).mockResolvedValue(mockPermissions);
    vi.mocked(systemIntegrationService.startLogidService).mockResolvedValue({ success: true });

    renderWithProvider(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Start Service')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Start Service');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(systemIntegrationService.startLogidService).toHaveBeenCalled();
    });
  });

  it('shows permission issues when permissions are limited', async () => {
    const mockStatus = {
      logidInstalled: true,
      logidRunning: false,
      configPath: '/etc/logid.cfg',
      hasPermissions: false,
      systemdAvailable: true
    };

    const mockPermissions = {
      hasPermissions: false,
      suggestions: [
        'No write access to /etc directory',
        'Run the application as administrator or use sudo'
      ]
    };

    vi.mocked(systemIntegrationService.checkSystemStatus).mockResolvedValue(mockStatus);
    vi.mocked(systemIntegrationService.checkPermissions).mockResolvedValue(mockPermissions);

    renderWithProvider(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Permission Issues')).toBeInTheDocument();
      expect(screen.getByText('No write access to /etc directory')).toBeInTheDocument();
      expect(screen.getByText('Run the application as administrator or use sudo')).toBeInTheDocument();
    });
  });

  it('shows installation guide when logid is not installed', async () => {
    const mockStatus = {
      logidInstalled: false,
      logidRunning: false,
      configPath: '/etc/logid.cfg',
      hasPermissions: false,
      systemdAvailable: false
    };

    const mockPermissions = {
      hasPermissions: false,
      suggestions: []
    };

    vi.mocked(systemIntegrationService.checkSystemStatus).mockResolvedValue(mockStatus);
    vi.mocked(systemIntegrationService.checkPermissions).mockResolvedValue(mockPermissions);

    renderWithProvider(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('Installation Guide')).toBeInTheDocument();
      expect(screen.getByText(/Logid is not installed on your system/)).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    const mockStatus = {
      logidInstalled: true,
      logidRunning: true,
      configPath: '/etc/logid.cfg',
      hasPermissions: true,
      systemdAvailable: true
    };

    const mockPermissions = {
      hasPermissions: true,
      suggestions: []
    };

    vi.mocked(systemIntegrationService.checkSystemStatus).mockResolvedValue(mockStatus);
    vi.mocked(systemIntegrationService.checkPermissions).mockResolvedValue(mockPermissions);

    renderWithProvider(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('🔄 Refresh');
    fireEvent.click(refreshButton);

    // Should call the status check functions again
    await waitFor(() => {
      expect(systemIntegrationService.checkSystemStatus).toHaveBeenCalledTimes(2);
      expect(systemIntegrationService.checkPermissions).toHaveBeenCalledTimes(2);
    });
  });
});
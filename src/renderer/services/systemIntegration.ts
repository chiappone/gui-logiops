import { LogiopsConfiguration } from '../types/logiops';

export interface SystemStatus {
  logidInstalled: boolean;
  logidRunning: boolean;
  logidVersion?: string;
  configPath: string;
  hasPermissions: boolean;
  systemdAvailable: boolean;
}

export interface SystemIntegrationService {
  checkSystemStatus(): Promise<SystemStatus>;
  startLogidService(): Promise<{ success: boolean; error?: string }>;
  stopLogidService(): Promise<{ success: boolean; error?: string }>;
  deployConfiguration(config: LogiopsConfiguration, filePath?: string): Promise<{ success: boolean; error?: string; deployedPath?: string }>;
  checkPermissions(): Promise<{ hasPermissions: boolean; suggestions: string[] }>;
  getSystemConfigPath(): string;
}

class SystemIntegrationServiceImpl implements SystemIntegrationService {
  private readonly DEFAULT_CONFIG_PATHS = [
    '/etc/logid.cfg',
    '/usr/local/etc/logid.cfg',
    '~/.config/logid.cfg'
  ];

  async checkSystemStatus(): Promise<SystemStatus> {
    try {
      const result = await window.electronAPI.checkLogidStatus();
      return result;
    } catch (error) {
      console.error('Failed to check system status:', error);
      return {
        logidInstalled: false,
        logidRunning: false,
        configPath: this.getSystemConfigPath(),
        hasPermissions: false,
        systemdAvailable: false
      };
    }
  }

  async startLogidService(): Promise<{ success: boolean; error?: string }> {
    try {
      return await window.electronAPI.startLogidService();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async stopLogidService(): Promise<{ success: boolean; error?: string }> {
    try {
      return await window.electronAPI.stopLogidService();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deployConfiguration(config: LogiopsConfiguration, filePath?: string): Promise<{ success: boolean; error?: string; deployedPath?: string }> {
    try {
      // Convert configuration to JSON format
      const { serializeConfiguration } = await import('../utils/serialization');
      const configContent = serializeConfiguration(config);
      
      return await window.electronAPI.deployConfiguration(configContent, filePath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkPermissions(): Promise<{ hasPermissions: boolean; suggestions: string[] }> {
    try {
      return await window.electronAPI.checkPermissions();
    } catch (error) {
      return {
        hasPermissions: false,
        suggestions: [
          'Unable to check permissions',
          'Please ensure you have proper system access'
        ]
      };
    }
  }

  getSystemConfigPath(): string {
    // Return the most common system config path
    return '/etc/logid.cfg';
  }
}

export const systemIntegrationService = new SystemIntegrationServiceImpl();
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu events - unified handler
  onMenuEvent: (callback: (event: string) => void) => {
    const handleMenuEvent = (_: any, eventType: string) => callback(eventType);
    
    ipcRenderer.on('menu-new-config', () => handleMenuEvent(null, 'menu-new-config'));
    ipcRenderer.on('menu-open-config', () => handleMenuEvent(null, 'menu-open-config'));
    ipcRenderer.on('menu-save-config', () => handleMenuEvent(null, 'menu-save-config'));
    ipcRenderer.on('menu-about', () => handleMenuEvent(null, 'menu-about'));
  },

  // Individual menu event handlers (for backward compatibility)
  onMenuNewConfig: (callback: () => void) => ipcRenderer.on('menu-new-config', callback),
  onMenuOpenConfig: (callback: () => void) => ipcRenderer.on('menu-open-config', callback),
  onMenuSaveConfig: (callback: () => void) => ipcRenderer.on('menu-save-config', callback),
  onMenuAbout: (callback: () => void) => ipcRenderer.on('menu-about', callback),

  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content: string, filePath?: string, defaultFilename?: string) => ipcRenderer.invoke('dialog:saveFile', content, filePath, defaultFilename),
  
  // File system operations
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  fileExists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
  createBackup: (filePath: string) => ipcRenderer.invoke('fs:createBackup', filePath),
  
  // Preferences and recent files
  getPreferences: () => ipcRenderer.invoke('preferences:get'),
  setPreferences: (preferences: any) => ipcRenderer.invoke('preferences:set', preferences),

  // System integration
  checkLogidStatus: () => ipcRenderer.invoke('system:checkLogidStatus'),
  startLogidService: () => ipcRenderer.invoke('system:startLogidService'),
  stopLogidService: () => ipcRenderer.invoke('system:stopLogidService'),
  deployConfiguration: (configContent: string, targetPath?: string) => ipcRenderer.invoke('system:deployConfiguration', configContent, targetPath),
  checkPermissions: () => ipcRenderer.invoke('system:checkPermissions'),

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});
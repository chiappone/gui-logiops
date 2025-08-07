"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Menu events - unified handler
    onMenuEvent: (callback) => {
        const handleMenuEvent = (_, eventType) => callback(eventType);
        electron_1.ipcRenderer.on('menu-new-config', () => handleMenuEvent(null, 'menu-new-config'));
        electron_1.ipcRenderer.on('menu-open-config', () => handleMenuEvent(null, 'menu-open-config'));
        electron_1.ipcRenderer.on('menu-save-config', () => handleMenuEvent(null, 'menu-save-config'));
        electron_1.ipcRenderer.on('menu-about', () => handleMenuEvent(null, 'menu-about'));
    },
    // Individual menu event handlers (for backward compatibility)
    onMenuNewConfig: (callback) => electron_1.ipcRenderer.on('menu-new-config', callback),
    onMenuOpenConfig: (callback) => electron_1.ipcRenderer.on('menu-open-config', callback),
    onMenuSaveConfig: (callback) => electron_1.ipcRenderer.on('menu-save-config', callback),
    onMenuAbout: (callback) => electron_1.ipcRenderer.on('menu-about', callback),
    // File operations
    openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    saveFile: (content, filePath, defaultFilename) => electron_1.ipcRenderer.invoke('dialog:saveFile', content, filePath, defaultFilename),
    // File system operations
    readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('fs:writeFile', filePath, content),
    fileExists: (filePath) => electron_1.ipcRenderer.invoke('fs:exists', filePath),
    createBackup: (filePath) => electron_1.ipcRenderer.invoke('fs:createBackup', filePath),
    // Preferences and recent files
    getPreferences: () => electron_1.ipcRenderer.invoke('preferences:get'),
    setPreferences: (preferences) => electron_1.ipcRenderer.invoke('preferences:set', preferences),
    // System integration
    checkLogidStatus: () => electron_1.ipcRenderer.invoke('system:checkLogidStatus'),
    startLogidService: () => electron_1.ipcRenderer.invoke('system:startLogidService'),
    stopLogidService: () => electron_1.ipcRenderer.invoke('system:stopLogidService'),
    deployConfiguration: (configContent, targetPath) => electron_1.ipcRenderer.invoke('system:deployConfiguration', configContent, targetPath),
    checkPermissions: () => electron_1.ipcRenderer.invoke('system:checkPermissions'),
    // Remove listeners
    removeAllListeners: (channel) => electron_1.ipcRenderer.removeAllListeners(channel),
});
//# sourceMappingURL=preload.js.map
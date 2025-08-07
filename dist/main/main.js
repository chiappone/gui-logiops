"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let mainWindow;
const getWindowState = () => {
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    // Default window state
    return {
        width: Math.min(1200, screenWidth - 100),
        height: Math.min(800, screenHeight - 100),
        x: undefined,
        y: undefined,
        isMaximized: false,
    };
};
const createWindow = () => {
    const windowState = getWindowState();
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, '../../assets/icon.png'),
        title: 'Logiops GUI',
        show: false, // Don't show until ready
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });
    // Restore maximized state
    if (windowState.isMaximized) {
        mainWindow.maximize();
    }
    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Focus the window on Linux/Windows
        if (process.platform !== 'darwin') {
            mainWindow.focus();
        }
    });
    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    // Create application menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Configuration',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-config');
                    },
                },
                {
                    label: 'Open Configuration',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.send('menu-open-config');
                    },
                },
                {
                    label: 'Save Configuration',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-config');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Logiops GUI',
                    click: () => {
                        mainWindow.webContents.send('menu-about');
                    },
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
// File dialog handlers
electron_1.ipcMain.handle('dialog:openFile', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        title: 'Open Configuration File',
        filters: [
            { name: 'Configuration Files', extensions: ['cfg'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
    }
    const filePath = result.filePaths[0];
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
            canceled: false,
            filePath,
            content,
            filename: path.basename(filePath)
        };
    }
    catch (error) {
        return {
            canceled: false,
            error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
electron_1.ipcMain.handle('dialog:saveFile', async (_, content, currentFilePath, defaultFilename) => {
    let filePath = currentFilePath;
    if (!filePath) {
        // Determine file extension and filters based on default filename
        const extension = defaultFilename ? path.extname(defaultFilename).slice(1) : 'cfg';
        const isJsonFile = extension === 'json';
        const filters = isJsonFile
            ? [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
            : [
                { name: 'Configuration Files', extensions: ['cfg'] },
                { name: 'All Files', extensions: ['*'] }
            ];
        const result = await electron_1.dialog.showSaveDialog(mainWindow, {
            title: isJsonFile ? 'Export Configuration as JSON' : 'Save Configuration File',
            defaultPath: defaultFilename || 'logiops.cfg',
            filters
        });
        if (result.canceled || !result.filePath) {
            return { canceled: true };
        }
        filePath = result.filePath;
    }
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return {
            canceled: false,
            filePath,
            filename: path.basename(filePath)
        };
    }
    catch (error) {
        return {
            canceled: false,
            error: `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
// File system operations
electron_1.ipcMain.handle('fs:readFile', async (_, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
electron_1.ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
electron_1.ipcMain.handle('fs:exists', async (_, filePath) => {
    try {
        await fs.access(filePath);
        return { exists: true };
    }
    catch {
        return { exists: false };
    }
});
electron_1.ipcMain.handle('fs:createBackup', async (_, filePath) => {
    try {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.copyFile(filePath, backupPath);
        return { success: true, backupPath };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
// User preferences and recent files
electron_1.ipcMain.handle('preferences:get', async () => {
    const preferencesPath = path.join(electron_1.app.getPath('userData'), 'preferences.json');
    try {
        const content = await fs.readFile(preferencesPath, 'utf-8');
        return { success: true, preferences: JSON.parse(content) };
    }
    catch {
        // Return default preferences if file doesn't exist
        const defaultPreferences = {
            autoSave: false,
            autoSaveInterval: 5,
            theme: 'system',
            recentFilesLimit: 10,
            showTooltips: true,
            validateOnType: true,
            recentFiles: []
        };
        return { success: true, preferences: defaultPreferences };
    }
});
electron_1.ipcMain.handle('preferences:set', async (_, preferences) => {
    const preferencesPath = path.join(electron_1.app.getPath('userData'), 'preferences.json');
    try {
        await fs.writeFile(preferencesPath, JSON.stringify(preferences, null, 2), 'utf-8');
        return { success: true };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
// System integration handlers
electron_1.ipcMain.handle('system:checkLogidStatus', async () => {
    try {
        // Check if logid is installed
        let logidInstalled = false;
        let logidVersion;
        try {
            const { stdout } = await execAsync('which logid');
            if (stdout.trim()) {
                logidInstalled = true;
                // Try to get version
                try {
                    const { stdout: versionOutput } = await execAsync('logid --version');
                    logidVersion = versionOutput.trim();
                }
                catch {
                    // Version command might not be available
                }
            }
        }
        catch {
            // logid not found in PATH
        }
        // Check if logid service is running
        let logidRunning = false;
        try {
            const { stdout } = await execAsync('systemctl is-active logid');
            logidRunning = stdout.trim() === 'active';
        }
        catch {
            // Try alternative methods to check if logid is running
            try {
                const { stdout } = await execAsync('pgrep logid');
                logidRunning = stdout.trim().length > 0;
            }
            catch {
                // logid is not running
            }
        }
        // Check if systemd is available
        let systemdAvailable = false;
        try {
            await execAsync('systemctl --version');
            systemdAvailable = true;
        }
        catch {
            // systemd not available
        }
        // Determine config path
        const configPaths = ['/etc/logid.cfg', '/usr/local/etc/logid.cfg'];
        let configPath = '/etc/logid.cfg'; // default
        for (const path of configPaths) {
            try {
                await fs.access(path);
                configPath = path;
                break;
            }
            catch {
                // File doesn't exist, continue
            }
        }
        // Check permissions
        const hasPermissions = await checkSystemPermissions();
        return {
            logidInstalled,
            logidRunning,
            logidVersion,
            configPath,
            hasPermissions,
            systemdAvailable
        };
    }
    catch (error) {
        console.error('Error checking logid status:', error);
        return {
            logidInstalled: false,
            logidRunning: false,
            configPath: '/etc/logid.cfg',
            hasPermissions: false,
            systemdAvailable: false
        };
    }
});
electron_1.ipcMain.handle('system:startLogidService', async () => {
    try {
        // Try systemctl first
        try {
            await execAsync('systemctl start logid');
            return { success: true };
        }
        catch (systemctlError) {
            // If systemctl fails, try starting logid directly
            try {
                (0, child_process_1.spawn)('logid', [], { detached: true, stdio: 'ignore' });
                return { success: true };
            }
            catch (directError) {
                return {
                    success: false,
                    error: `Failed to start logid service. Systemctl error: ${systemctlError}. Direct start error: ${directError}`
                };
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to start logid service: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
electron_1.ipcMain.handle('system:stopLogidService', async () => {
    try {
        // Try systemctl first
        try {
            await execAsync('systemctl stop logid');
            return { success: true };
        }
        catch (systemctlError) {
            // If systemctl fails, try killing logid process
            try {
                await execAsync('pkill logid');
                return { success: true };
            }
            catch (pkillError) {
                return {
                    success: false,
                    error: `Failed to stop logid service. Systemctl error: ${systemctlError}. Pkill error: ${pkillError}`
                };
            }
        }
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to stop logid service: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
electron_1.ipcMain.handle('system:deployConfiguration', async (_, configContent, targetPath) => {
    try {
        const deployPath = targetPath || '/etc/logid.cfg';
        // Check if we have write permissions
        try {
            await fs.access(path.dirname(deployPath), fs.constants.W_OK);
        }
        catch {
            return {
                success: false,
                error: `No write permission to ${path.dirname(deployPath)}. Try running as administrator or use sudo.`
            };
        }
        // Create backup if file exists
        try {
            await fs.access(deployPath);
            const backupPath = `${deployPath}.backup.${Date.now()}`;
            await fs.copyFile(deployPath, backupPath);
        }
        catch {
            // File doesn't exist, no backup needed
        }
        // Write the configuration
        await fs.writeFile(deployPath, configContent, 'utf-8');
        // Restart logid service if it's running
        try {
            const { stdout } = await execAsync('systemctl is-active logid');
            if (stdout.trim() === 'active') {
                await execAsync('systemctl restart logid');
            }
        }
        catch {
            // Service might not be running or systemctl not available
        }
        return {
            success: true,
            deployedPath: deployPath
        };
    }
    catch (error) {
        return {
            success: false,
            error: `Failed to deploy configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
});
electron_1.ipcMain.handle('system:checkPermissions', async () => {
    try {
        const suggestions = [];
        let hasPermissions = true;
        // Check write access to /etc
        try {
            await fs.access('/etc', fs.constants.W_OK);
        }
        catch {
            hasPermissions = false;
            suggestions.push('No write access to /etc directory');
            suggestions.push('Run the application as administrator or use sudo');
            suggestions.push('Consider using user-specific config location (~/.config/logid.cfg)');
        }
        // Check if user is in input group (common requirement for device access)
        try {
            const { stdout } = await execAsync('groups');
            const groups = stdout.trim().split(' ');
            if (!groups.includes('input')) {
                suggestions.push('User is not in "input" group');
                suggestions.push('Add user to input group: sudo usermod -a -G input $USER');
                suggestions.push('Log out and log back in after adding to group');
            }
        }
        catch {
            suggestions.push('Unable to check user groups');
        }
        // Check udev rules
        const udevRulesPath = '/etc/udev/rules.d/42-logiops.rules';
        try {
            await fs.access(udevRulesPath);
        }
        catch {
            suggestions.push('Logiops udev rules not found');
            suggestions.push('Install udev rules for proper device access');
            suggestions.push('Check logiops documentation for udev rules setup');
        }
        return {
            hasPermissions,
            suggestions
        };
    }
    catch (error) {
        return {
            hasPermissions: false,
            suggestions: [
                'Unable to check system permissions',
                'Ensure you have proper system access',
                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            ]
        };
    }
});
// Helper function to check system permissions
async function checkSystemPermissions() {
    try {
        // Check write access to common config locations
        const configPaths = ['/etc', '/usr/local/etc'];
        for (const configPath of configPaths) {
            try {
                await fs.access(configPath, fs.constants.W_OK);
                return true;
            }
            catch {
                // Continue checking other paths
            }
        }
        return false;
    }
    catch {
        return false;
    }
}
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(createWindow);
// Quit when all windows are closed, except on macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
//# sourceMappingURL=main.js.map
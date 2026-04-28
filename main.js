const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { uIOhook } = require('uiohook-napi');
const Store = require('electron-store');

const store = new Store();

// Migration logic from old Python app
const oldPath = 'C:\\Users\\kamit\\.gemini\\antigravity\\scratch\\KeySoundApp\\profiles.json';
if (!store.get('migrated') && require('fs').existsSync(oldPath)) {
    try {
        const oldData = JSON.parse(require('fs').readFileSync(oldPath, 'utf8'));
        const defaultProfile = oldData.profiles.Default || {};
        const newMappings = {};
        for (let key in defaultProfile) {
            newMappings[key.toUpperCase()] = defaultProfile[key];
        }
        store.set('mappings', newMappings);
        store.set('migrated', true);
    } catch (e) { console.error("Migration failed", e); }
}

let mainWindow;
let tray = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        frame: false, // Frameless for custom title bar/glass look
        transparent: true,
        backgroundColor: '#00000000', // Transparent
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile('index.html');
    
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Global Keyboard Hook
uIOhook.on('keydown', (e) => {
    // Send key event to renderer
    if (mainWindow) {
        mainWindow.webContents.send('key-down', e.keycode);
    }
});

uIOhook.start();

app.on('ready', () => {
    createWindow();
    
    // System Tray
    tray = new Tray(path.join(__dirname, 'icon.png')); // Need an icon
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow.show() },
        { label: 'Quit', click: () => {
            uIOhook.stop();
            app.quit();
        }}
    ]);
    tray.setToolTip('KeySound Pro');
    tray.setContextMenu(contextMenu);
});

// IPC communication
ipcMain.on('minimize', () => mainWindow.hide());
ipcMain.on('close', () => app.quit());
ipcMain.on('save-mapping', (event, mapping) => {
    const currentMappings = store.get('mappings', {});
    currentMappings[mapping.key] = mapping.path;
    store.set('mappings', currentMappings);
});
ipcMain.on('delete-mapping', (event, key) => {
    const currentMappings = store.get('mappings', {});
    delete currentMappings[key];
    store.set('mappings', currentMappings);
});
const AdmZip = require('adm-zip');
const fs = require('fs');

ipcMain.on('clear-all-mappings', () => {
    store.set('mappings', {});
});
ipcMain.on('save-mapping-bulk', (event, allMappings) => {
    store.set('mappings', allMappings);
});
ipcMain.on('toggle-profiles', (event, state) => {
    console.log('App Profiles state:', state);
    // In a real implementation, we would hook into active-win or similar to switch profiles
});

ipcMain.on('export-ksp', async (event, currentMappings) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export KeySound Pack',
        filters: [{ name: 'KeySound Pack', extensions: ['ksp'] }]
    });
    
    if (!canceled && filePath) {
        try {
            const zip = new AdmZip();
            const exportConfig = {};
            
            // Add files and build relative config
            for (const [key, mapping] of Object.entries(currentMappings)) {
                const srcPath = typeof mapping === 'string' ? mapping : mapping.path;
                if (fs.existsSync(srcPath)) {
                    const fileName = path.basename(srcPath);
                    zip.addLocalFile(srcPath, 'sounds');
                    exportConfig[key] = {
                        path: `sounds/${fileName}`,
                        trim: mapping.trim || { start: 0, end: 1 }
                    };
                }
            }
            
            zip.addFile('config.json', Buffer.from(JSON.stringify(exportConfig, null, 2), 'utf8'));
            zip.writeZip(filePath);
            dialog.showMessageBox({ message: 'Pack exported successfully!', type: 'info' });
        } catch (err) {
            dialog.showErrorBox('Export Error', err.message);
        }
    }
});

ipcMain.on('import-ksp', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import KeySound Pack',
        filters: [{ name: 'KeySound Pack', extensions: ['ksp'] }],
        properties: ['openFile']
    });
    
    if (!canceled && filePaths.length > 0) {
        try {
            const zip = new AdmZip(filePaths[0]);
            const extractDir = path.join(app.getPath('userData'), 'imported_packs', Date.now().toString());
            zip.extractAllTo(extractDir, true);
            
            const configPath = path.join(extractDir, 'config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                const newMappings = {};
                
                for (const [key, mapping] of Object.entries(config)) {
                    newMappings[key] = {
                        path: path.join(extractDir, mapping.path),
                        trim: mapping.trim
                    };
                }
                
                store.set('mappings', newMappings);
                
                // Tell the window to reload or we just restart app visually
                app.relaunch();
                app.exit();
            }
        } catch (err) {
            dialog.showErrorBox('Import Error', err.message);
        }
    }
});

ipcMain.handle('get-mappings', () => {
    return store.get('mappings', {});
});

ipcMain.handle('open-file-dialog', async () => {
    const { dialog } = require('electron');
    return await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg'] }
        ]
    });
});

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createTray } = require('./trayManager');
const { handleErrors } = require('./errorHandler');
const { checkHardware } = require('./hardwareCheck');

let mainWindow;
let tray = null;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'LocaLM Chat',
    backgroundColor: '#ffffff', // Match the menu bar white color
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../public/logo.png'),
    show: false, // Don't show until ready
  });

  // Load the Vue app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Initialize system tray
  tray = createTray(mainWindow, path.join(__dirname, '../public/logo.png'));

  // Handle window close event
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

// IPC handlers
ipcMain.handle('check-hardware', async () => {
  try {
    await checkHardware();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  try {
    // Check hardware requirements first
    try {
      await checkHardware();
      console.log('Hardware check passed');
    } catch (error) {
      console.warn('Hardware check failed:', error.message);
      // Don't quit immediately, let user see the app but show warning
    }

    // Create app window
    createWindow();
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    handleErrors(error);
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quitting
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Handle error display requests from renderer
ipcMain.on('show-error', (_event, { title, content }) => {
  const { showErrorDialog } = require('./errorHandler');
  showErrorDialog(title, content);
});
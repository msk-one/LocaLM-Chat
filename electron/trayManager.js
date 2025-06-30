const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

function createTray(mainWindow, iconPath) {
  // Create icon with fallback
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // Create a simple colored icon as fallback
      trayIcon = nativeImage.createEmpty();
    }
    // Only resize if icon is not empty
    if (!trayIcon.isEmpty()) {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }
  } catch (error) {
    console.warn('Failed to load tray icon:', error);
    trayIcon = nativeImage.createEmpty();
  }
  
  const tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Vue LLM Chat');
  tray.setContextMenu(contextMenu);
  
  // Handle tray click events
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  return tray;
}

function updateTrayStatus(tray, mainWindow, status = {}) {
  if (!tray || !mainWindow) return;
  
  const { docker = 'Unknown', model = 'Unknown' } = status;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: `Docker: ${docker}`,
      enabled: false
    },
    {
      label: `Model: ${model}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

module.exports = { createTray, updateTrayStatus };
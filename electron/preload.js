const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform detection
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Hardware validation
  checkHardware: () => ipcRenderer.invoke('check-hardware'),
  
  // Event listeners with proper cleanup
  onDockerStatus: (callback) => {
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on('docker-status', listener);
    return () => ipcRenderer.removeListener('docker-status', listener);
  },
  
  onModelStatus: (callback) => {
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on('model-status', listener);
    return () => ipcRenderer.removeListener('model-status', listener);
  },
  
  // Error handling
  showError: (title, content) => ipcRenderer.send('show-error', { title, content })
});

// Remove all listeners when window is about to unload
window.addEventListener('beforeunload', () => {
  ipcRenderer.removeAllListeners('docker-status');
  ipcRenderer.removeAllListeners('model-status');
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('window-set-always-on-top', flag),
  
  // 독립 윈도우 PiP API
  openPiPWindow: () => ipcRenderer.send('open-pip-window'),
  closePiPWindow: () => ipcRenderer.send('close-pip-window'),
  togglePiPWindow: () => ipcRenderer.send('toggle-pip-window'),
  setPiPSize: (width, height) => ipcRenderer.send('set-pip-size', { width, height }),
  movePiPWindow: (deltaX, deltaY) => ipcRenderer.send('move-pip-window', { deltaX, deltaY }),
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  setAutoStart: (enable) => ipcRenderer.send('set-auto-start', enable),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  isPiPStandalone: () => window.location.search.includes('pip='),
  onPiPClosed: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('pip-closed', handler);
    return () => ipcRenderer.removeListener('pip-closed', handler);
  },
});

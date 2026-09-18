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
  setPiPOpacity: (opacity) => ipcRenderer.send('set-pip-opacity', opacity),
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  setAutoStart: (enable) => ipcRenderer.send('set-auto-start', enable),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  isPiPStandalone: () => window.location.search.includes('pip='),
  // 메인 창과 PiP 창 간 활성 캐릭터 즉시 0ms 동기화 IPC
  sendActiveCharacter: (characterId) => ipcRenderer.send('active-character-change', characterId),
  onActiveCharacterChanged: (callback) => {
    const handler = (_event, charId) => callback(charId);
    ipcRenderer.on('active-character-changed', handler);
    return () => ipcRenderer.removeListener('active-character-changed', handler);
  },
  onPiPClosed: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('pip-closed', handler);
    return () => ipcRenderer.removeListener('pip-closed', handler);
  },
});

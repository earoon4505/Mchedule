const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow = null;
let pipWindow = null;
let tray = null;
const PORT = process.env.PORT || 3000;

// 프로덕션 모드 강제 설정
if (app.isPackaged) {
  process.env.NODE_ENV = 'production';
}

function getAppIconPath() {
  const candidates = [
    path.join(__dirname, '../public/icon.ico'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../public/app-logo.png'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

// 윈도우 상태 파일 저장/불러오기 경로
const WINDOW_STATE_PATH = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(WINDOW_STATE_PATH, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function saveWindowState(state) {
  try {
    const existing = loadWindowState();
    const merged = { ...existing, ...state };
    fs.writeFileSync(WINDOW_STATE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {}
}

// 로컬 서버 준비 확인
function checkServerHealthy(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/nexon/status`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  const serverPathCandidates = [
    path.join(__dirname, '../dist/server.cjs'),
    path.join(process.cwd(), 'dist/server.cjs'),
    path.join(process.resourcesPath || '', 'app.asar/dist/server.cjs'),
  ];

  const serverPath = serverPathCandidates.find((p) => fs.existsSync(p));
  if (serverPath) {
    try {
      require(serverPath);
    } catch (err) {
      console.error('Server require error:', err);
    }
  }

  for (let i = 0; i < 30; i++) {
    const ok = await checkServerHealthy(PORT);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

// 메인 윈도우 생성
function createMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  const iconPath = getAppIconPath();
  const state = loadWindowState().main || {};

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // 3단 레이아웃(캐릭터목록-스케줄-진행현황)이 잘리지 않도록 가로 비율을 넉넉하게 설정
  const defaultWidth = Math.max(1360, Math.min(1600, Math.floor(screenWidth * 0.92)));
  const defaultHeight = Math.max(860, Math.min(980, Math.floor(screenHeight * 0.90)));

  mainWindow = new BrowserWindow({
    width: state.width || defaultWidth,
    height: state.height || defaultHeight,
    x: state.x,
    y: state.y,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    alwaysOnTop: false,
    backgroundColor: '#090d16',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // 메인 창은 다른 일반 프로그램(Chrome 등)처럼 동작하도록 항상 위(alwaysOnTop)를 명시적으로 해제
  mainWindow.setAlwaysOnTop(false);

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  const appUrl = `http://127.0.0.1:${PORT}`;
  mainWindow.loadURL(appUrl);

  // 창 상태 저장 리스너
  const handleSaveState = () => {
    if (!mainWindow) return;
    const isMaximized = mainWindow.isMaximized();
    if (!isMaximized) {
      const bounds = mainWindow.getBounds();
      saveWindowState({ main: { ...bounds, isMaximized: false } });
    } else {
      saveWindowState({ main: { isMaximized: true } });
    }
  };

  mainWindow.on('resize', handleSaveState);
  mainWindow.on('move', handleSaveState);

  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(appUrl);
    }, 1000);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // 만약 PiP 창도 없으면 앱 종료
    if (!pipWindow && process.platform !== 'darwin') {
      app.quit();
    }
  });
}

// 독립 Always-on-Top PiP 윈도우 생성
function createPiPWindow() {
  if (pipWindow) {
    if (pipWindow.isMinimized()) pipWindow.restore();
    pipWindow.show();
    pipWindow.focus();
    saveWindowState({ pip: { ...loadWindowState().pip, isOpen: true } });
    return;
  }

  const iconPath = getAppIconPath();
  const state = loadWindowState().pip || {};

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const defaultWidth = 330;
  const defaultHeight = 520;
  const defaultX = screenWidth - defaultWidth - 24;
  const defaultY = screenHeight - defaultHeight - 24;

  pipWindow = new BrowserWindow({
    width: state.width || defaultWidth,
    height: state.height || defaultHeight,
    x: state.x !== undefined ? state.x : defaultX,
    y: state.y !== undefined ? state.y : defaultY,
    minWidth: 50,
    minHeight: 50,
    maxWidth: 3200,
    maxHeight: 2400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // 메이플 게임 화면 위에서도 항상 최상단에 뜨도록 레벨 설정
  pipWindow.setAlwaysOnTop(true, 'screen-saver');

  const pipUrl = `http://127.0.0.1:${PORT}/?pip=standalone`;
  pipWindow.loadURL(pipUrl);

  saveWindowState({ pip: { ...state, isOpen: true } });

  const handleSavePipState = () => {
    if (!pipWindow) return;
    const bounds = pipWindow.getBounds();
    saveWindowState({ pip: { ...bounds, isOpen: true } });
  };

  pipWindow.on('resize', handleSavePipState);
  pipWindow.on('move', handleSavePipState);

  pipWindow.on('closed', () => {
    pipWindow = null;
    const existingPip = loadWindowState().pip || {};
    saveWindowState({ pip: { ...existingPip, isOpen: false } });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pip-closed');
    }
    // 만약 메인 창도 없으면 앱 종료
    if (!mainWindow && process.platform !== 'darwin') {
      app.quit();
    }
  });
}

// 윈도우 부팅 시 자동 시작 IPC 핸들러
ipcMain.on('set-auto-start', (event, enable) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enable,
      path: process.execPath,
      args: ['--autostart'],
    });
  } catch (err) {
    console.error('Failed to set login item settings:', err);
  }
});

ipcMain.handle('get-auto-start', () => {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (err) {
    return false;
  }
});

// 윈도우 조작 IPC 리스너
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('window-is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isMaximized() : false;
});

ipcMain.on('window-set-always-on-top', (event, flag) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (flag) {
      win.setAlwaysOnTop(true, 'screen-saver');
    } else {
      win.setAlwaysOnTop(false);
    }
  }
});

// PiP 전용 IPC 핸들러
ipcMain.on('open-pip-window', () => {
  createPiPWindow();
});

ipcMain.on('close-pip-window', () => {
  if (pipWindow) {
    pipWindow.close();
    pipWindow = null;
  }
});

ipcMain.on('toggle-pip-window', () => {
  if (pipWindow) {
    pipWindow.close();
    pipWindow = null;
  } else {
    createPiPWindow();
  }
});

ipcMain.on('set-pip-size', (event, { width, height }) => {
  if (pipWindow && !pipWindow.isDestroyed()) {
    try {
      const w = Math.max(80, Math.min(3200, Math.round(width)));
      const h = Math.max(80, Math.min(2400, Math.round(height)));
      pipWindow.setSize(w, h);
    } catch (e) {}
  }
});

ipcMain.on('move-pip-window', (event, { deltaX, deltaY }) => {
  if (pipWindow && !pipWindow.isDestroyed()) {
    try {
      const [x, y] = pipWindow.getPosition();
      pipWindow.setPosition(x + deltaX, y + deltaY);
    } catch (e) {}
  }
});

ipcMain.on('open-main-window', () => {
  createMainWindow();
});

// 시스템 트레이 설정
function createTray() {
  const iconPath = getAppIconPath();
  if (fs.existsSync(iconPath)) {
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    
    const updateContextMenu = () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: '메케줄 메인 창 열기',
          click: () => createMainWindow(),
        },
        {
          label: pipWindow ? '독립 PiP 창 닫기' : '독립 PiP 창 띄우기',
          click: () => {
            if (pipWindow) {
              pipWindow.close();
            } else {
              createPiPWindow();
            }
          },
        },
        { type: 'separator' },
        {
          label: '완전 종료',
          click: () => {
            if (pipWindow) pipWindow.destroy();
            if (mainWindow) mainWindow.destroy();
            app.quit();
          },
        },
      ]);
      tray.setContextMenu(contextMenu);
    };

    updateContextMenu();
    tray.setToolTip('메케줄 - 메이플스토리 통합 스케줄러');
    
    tray.on('double-click', () => {
      createMainWindow();
    });
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });

  app.whenReady().then(async () => {
    await startServer();
    createMainWindow();
    
    // 1. 윈도우 상태 및 저장소 데이터에서 PiP 활성화 여부 확인
    let shouldOpenPiP = false;
    const pipState = loadWindowState().pip;
    if (pipState && pipState.isOpen) {
      shouldOpenPiP = true;
    }

    // 2. storage.json 파일 내 settings.pip.enabled 도 확인하여 안전하게 2중 검증
    try {
      const candidates = [
        path.join(process.env.APPDATA || '', 'MapleSchedule', 'data', 'storage.json'),
        path.join(process.env.HOME || '', '.mapleschedule', 'data', 'storage.json'),
        path.join(process.cwd(), 'data', 'storage.json'),
      ];
      for (const p of candidates) {
        if (p && fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.settings && parsed.settings.pip && parsed.settings.pip.enabled) {
            shouldOpenPiP = true;
            break;
          }
        }
      }
    } catch (e) {}

    if (shouldOpenPiP) {
      createPiPWindow();
    }

    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

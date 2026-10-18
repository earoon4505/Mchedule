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
  // 데스크톱 앱 업데이트 및 재설치 시에도 사용자 데이터가 절대 초기화되지 않도록 AppData 경로 주입
  const userDataPath = app.getPath('userData');
  process.env.MAPLE_USER_DATA_PATH = userDataPath;

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

  mainWindow.webContents.on('did-finish-load', () => {
    if (downloadedUpdateInfo && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', downloadedUpdateInfo);
    }
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

  if (state.opacity !== undefined) {
    try {
      const op = Math.max(0.1, Math.min(1.0, Number(state.opacity)));
      pipWindow.setOpacity(op);
    } catch (e) {}
  }

  const pipUrl = `http://127.0.0.1:${PORT}/?pip=standalone`;
  pipWindow.loadURL(pipUrl);

  saveWindowState({ pip: { ...state, isOpen: true } });

  const handleSavePipState = () => {
    if (!pipWindow || pipWindow.isDestroyed()) return;
    const bounds = pipWindow.getBounds();
    const currentPipState = loadWindowState().pip || {};
    saveWindowState({ pip: { ...currentPipState, ...bounds, isOpen: true } });
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
  const existingPip = loadWindowState().pip || {};
  saveWindowState({ pip: { ...existingPip, isOpen: false } });
  if (pipWindow && !pipWindow.isDestroyed()) {
    pipWindow.close();
    pipWindow = null;
  }
});

ipcMain.on('toggle-pip-window', () => {
  if (pipWindow && !pipWindow.isDestroyed()) {
    const existingPip = loadWindowState().pip || {};
    saveWindowState({ pip: { ...existingPip, isOpen: false } });
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
      const [currentW, currentH] = pipWindow.getSize();
      // 현재 크기와 차이가 2px 이상 날 때만 크기를 변경하여 떨림/깜빡임 루프 완벽 차단
      if (Math.abs(currentW - w) > 2 || Math.abs(currentH - h) > 2) {
        pipWindow.setSize(w, h);
      }
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

// PiP 창 투명도 네이티브 OS 조절
ipcMain.on('set-pip-opacity', (event, opacity) => {
  if (pipWindow && !pipWindow.isDestroyed()) {
    try {
      const val = typeof opacity === 'number' ? Math.max(0.1, Math.min(1.0, opacity)) : 1.0;
      pipWindow.setOpacity(val);
      saveWindowState({ pip: { ...loadWindowState().pip, opacity: val } });
    } catch (e) {}
  }
});

ipcMain.on('open-main-window', () => {
  createMainWindow();
});

// 메인 윈도우 ↔ PiP 윈도우 간 활성 캐릭터 즉시 동기화 IPC 중계
ipcMain.on('active-character-change', (event, characterId) => {
  if (mainWindow && !mainWindow.isDestroyed() && event.sender !== mainWindow.webContents) {
    mainWindow.webContents.send('active-character-changed', characterId);
  }
  if (pipWindow && !pipWindow.isDestroyed() && event.sender !== pipWindow.webContents) {
    pipWindow.webContents.send('active-character-changed', characterId);
  }
});

// 메이플스카우터 60개 보스 공식 명세 및 연산 엔진 (CJS)
let scouterBossDefs = null;

function getScouterBossDefinitions() {
  if (scouterBossDefs && Array.isArray(scouterBossDefs) && scouterBossDefs.length > 0) {
    return scouterBossDefs;
  }
  const candidatePaths = [
    path.join(__dirname, 'scouterBossDefinitions.json'),
    path.join(__dirname, '../electron/scouterBossDefinitions.json'),
    path.join(__dirname, '../src/data/scouterBossDefinitions.json'),
    path.join(process.resourcesPath || '', 'app.asar/electron/scouterBossDefinitions.json'),
    path.join(process.cwd(), 'electron/scouterBossDefinitions.json'),
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          scouterBossDefs = parsed;
          return scouterBossDefs;
        }
      }
    } catch (_) {}
  }
  return null;
}

function evaluateSplineCJS(spline, t) {
  const { x: i, y: s, m: n } = spline;
  const a = i.length;
  if (t < i[0]) return s[0] + (t - i[0]) * n[0];
  if (t <= i[a - 1]) {
    let idx = i.length - 2;
    for (let e = 0; e < i.length - 1; e++) {
      if (t >= i[e] && t <= i[e + 1]) {
        idx = e;
        break;
      }
    }
    const l = i[idx + 1] - i[idx];
    const o = (t - i[idx]) / l;
    const r = o * o;
    const c = r * o;
    return (2 * c - 3 * r + 1) * s[idx] + (c - 2 * r + o) * l * n[idx] + (-2 * c + 3 * r) * s[idx + 1] + (c - r) * l * n[idx + 1];
  }
  const l = i[a - 1];
  return s[a - 1] + (t - l) * Math.max(n[a - 1], 1e-9);
}

function getStatusLabelCJS(clearRate, isParty, partyLimit, isNewbie = false, newbieCut = 100) {
  if (isNewbie && newbieCut > 100) {
    const s = newbieCut / 100;
    if (!isParty && 6 === partyLimit) {
      return clearRate >= 5 ? '[뉴비] 여유컷' : clearRate >= s ? '[뉴비] 솔플' : clearRate >= 0.5 * s ? '[뉴비] 2인' : clearRate >= 0.25 * s ? '[뉴비] 4인' : clearRate >= 0.15 * s ? '[뉴비] 6인' : '불가능';
    }
  }
  if (isParty) {
    if (3 === partyLimit) {
      return clearRate >= 2.7 ? '솔플 최소컷' : clearRate >= 1.35 ? '2인 최소컷' : clearRate >= 0.9 ? '3인 최소컷' : '불가능';
    }
    if (clearRate >= 5.1) return '솔플 최소컷';
    if (clearRate >= 2.55) return '2인 최소컷';
    if (clearRate >= 1.7) return '3인 최소컷';
    if (clearRate >= 1.275) return '4인 최소컷';
    if (clearRate >= 0.9) return '6인 최소컷';
    return '불가능';
  } else {
    if (6 === partyLimit) {
      return clearRate >= 2 ? '솔플 여유컷' : clearRate >= 1.1 ? '솔플 가능' : clearRate >= 0.9 ? '솔플 최소컷' : clearRate >= 0.25 ? '파티격 가능' : clearRate >= 0.15 ? '파티 최소컷' : '불가능';
    }
    if (3 === partyLimit) {
      return clearRate >= 2 ? '솔플 여유컷' : clearRate >= 1.1 ? '솔플 가능' : clearRate >= 0.9 ? '솔플 최소컷' : clearRate >= 0.36 ? '파티격 가능' : clearRate >= 0.3 ? '파티 최소컷' : '불가능';
    }
    if (2 === partyLimit) {
      return clearRate >= 2 ? '솔플 여유컷' : clearRate >= 1.1 ? '솔플 가능' : clearRate >= 0.9 ? '솔플 최소컷' : clearRate >= 0.55 ? '파티격 가능' : clearRate >= 0.45 ? '파티 최소컷' : '불가능';
    }
    if (1 === partyLimit) {
      if (clearRate >= 2) return '솔플 여유컷';
      if (clearRate >= 1.1) return '솔플 가능';
      if (clearRate >= 0.9) return '솔플 최소컷';
      return '불가능';
    }
  }
  return '불가능';
}

function calcDopingMultiplierCJS(specEff, myClass, elixir = 3, minutes = 20) {
  if (!specEff) return 1;
  const n = Math.min(20, Math.max(0.1, minutes));
  const isBishop = myClass === '비숍';
  const isWildHunter = myClass === '와일드헌터';
  const isDemonAvenger = myClass === '데몬어벤져';

  const r = 8 * (!isBishop ? 1 : 0);
  const o = 30 * (!isBishop ? 1 : 0);
  const c = 10 * (!isBishop ? 1 : 0);
  const d = 1275 * (isDemonAvenger ? 1 : 0);
  const m = 10 * (!isWildHunter ? 1 : 0);

  const x =
    (1 + r * (specEff.cridmgeff1 || 0)) *
    (1 + o * (specEff.atkeff1 || 0)) *
    (1 + c * (specEff.dmgeff1 || 0)) *
    (1 + 0 * (specEff.igreff1 || 0)) *
    (1 + (isDemonAvenger ? d : 0) * (specEff.mainStateff1 || 0)) *
    (1 + 0 * ((specEff.subStateff1 || 0) + (specEff.ssubStateff1 || 0))) *
    1 *
    (1 + m * (specEff.atkPereff1 || 0));

  const p = x * Math.min(n, 8) + x * Math.max(0, Math.min(7, n - 8)) + Math.max(0, Math.min(5, n - 15));
  const l = elixir || 3;
  const mult = ((1 === l || 3 === l ? x : 1) * Math.min(n, 8) +
                (1 === l || 3 === l ? x : 1) * Math.max(0, Math.min(7, n - 8)) +
                Math.max(0, Math.min(5, n - 15))) / p / ((1 === l || 3 === l ? x : 1) / x);

  return mult || 1;
}

function calculateBossMultipliersFromApiData(apiData) {
  const defs = getScouterBossDefinitions();
  if (!apiData || !apiData.calculatedData || !defs) return { multipliers: {}, bossList: [] };
  const cData = apiData.calculatedData;
  const uStat = apiData.userStat;

  const levelGapTable = {
    '5': 120, '4': 118, '3': 116, '2': 114, '1': 112, '0': 110,
    '-1': 105.3, '-2': 100.7, '-3': 96.2, '-4': 91.8, '-5': 87.5,
    '-6': 85, '-7': 82.5, '-8': 80, '-9': 77.5, '-10': 75,
    '-11': 72.5, '-12': 70, '-13': 67.5, '-14': 65, '-15': 62.5,
    '-16': 60, '-17': 57.5, '-18': 55, '-19': 52.5, '-20': 50,
    '-21': 47.5, '-22': 45, '-23': 42.5, '-24': 40, '-25': 37.5,
    '-26': 35, '-27': 32.5, '-28': 30, '-29': 27.5, '-30': 25,
    '-31': 22.5, '-32': 20, '-33': 17.5, '-34': 15, '-35': 12.5,
    '-36': 10, '-37': 7.5, '-38': 5, '-39': 2.5, '-40': 0,
  };

  const charLevel = Number(uStat?.stat?.level || uStat?.level || 260);
  const charArcane = Number(uStat?.stat?.arcaneForce || uStat?.arcaneForce || 0);
  const charAuthentic = Number(uStat?.stat?.authenticForce || uStat?.authenticForce || 0);
  const myClass = String(cData.class || uStat?.stat?.myClass || '히어로');

  const dHexa = Number(cData.calculatedHexaDamage_300 || 0);
  const uHexa = Number(cData.calculatedHexaDamage_380 || 0);
  const spline_300 = cData.spline_300;
  const spline_380 = cData.spline_380;
  const ascentConst = Number(cData.ascent_const || 0);

  if (!spline_300 || !spline_380 || dHexa <= 0 || uHexa <= 0) return { multipliers: {}, bossList: [] };

  const dopingR = calcDopingMultiplierCJS(cData.specEfficiency, myClass, cData.elixir || 3, 20);

  const multipliers = {};
  const bossList = [];

  for (const b of defs) {
    const dLevel = charLevel - b.level;
    const levelKey = (dLevel > 5 ? 5 : dLevel < -40 ? -40 : dLevel).toString();
    const levelGapDmg = (levelGapTable[levelKey] || 100) / 100;

    let arcaneDmg = 1;
    if (b.arcaneForce && b.arcaneForce !== -1) {
      const ratio = (charArcane / b.arcaneForce) * 100;
      arcaneDmg = (ratio < 10 ? 10 : ratio < 30 ? 30 : ratio < 50 ? 60 : ratio < 70 ? 70 : ratio < 100 ? 80 : ratio < 110 ? 100 : ratio < 130 ? 110 : ratio < 150 ? 130 : 150) / 100;
    }

    let authenticDmg = 1;
    if (b.authenticForce && b.authenticForce !== -1) {
      const diff = charAuthentic - b.authenticForce;
      authenticDmg = (diff < -90 ? 5 : diff < -80 ? 10 : diff < -70 ? 20 : diff < -60 ? 30 : diff < -50 ? 40 : diff < -40 ? 50 : diff < -30 ? 60 : diff < -20 ? 70 : diff < -10 ? 80 : diff < 0 ? 90 : diff < 10 ? 100 : diff < 20 ? 105 : diff < 30 ? 110 : diff < 40 ? 115 : diff < 50 ? 120 : 125) / 100;
    }

    let M = 1;
    if (b.arcaneForce && b.boss !== '검은 마법사') M = 1.5;
    if (b.arcaneForce && b.boss === '검은 마법사') M = 1.1;

    const userHexaDmg = 300 === b.guard
      ? dHexa * (b.boss === '가엔슬' ? 1 / (cData.genePassConst || 1) : 1)
      : (b.boss === '카링' ? (cData.calculatedHexaDamage_kaling || uHexa) : uHexa);

    const I = (userHexaDmg * arcaneDmg * authenticDmg * levelGapDmg) / (1.2 * M * (b.authenticForce ? 1.25 : 1));

    const cut = Number(b.bossCut || b.partyBossCut || 10000);
    const targetSpline = 300 === b.guard ? spline_300 : spline_380;
    const E = evaluateSplineCJS(targetSpline, cut);

    const U = (I / (E < 0 ? 10000 : E)) * (b.easyRate ? b.easyRate : 1) * dopingR;
    const G = (3 * ascentConst) / (b.boss === '루시드' && b.difficulty === 'Hard' ? 0.4 : Math.min(3, Math.ceil(20 / U / 5.667))) - ascentConst || 0;
    const clearRate = Math.max(0, U * (1 + G) || 0);

    const multPercent = clearRate * 100;
    const multiplierNum = parseFloat(multPercent.toFixed(1));

    const isParty = !!b.partyBossCut;
    const partyLimit = b.partyLimit || 6;
    const multiplierStr = isParty
      ? `[파티] ${Math.round(multPercent)}%`
      : `${multPercent >= 1000 ? Math.round(multPercent) : multPercent >= 100 ? multPercent.toFixed(1) : multPercent.toFixed(2)}%`;

    const statusLabel = getStatusLabelCJS(clearRate, isParty, partyLimit, false, b.newbieCut || 100);

    const diffLower = String(b.difficulty).toLowerCase();
    const nameLower = String(b.name).toLowerCase();
    const primaryKey = `${diffLower}_${nameLower}`;

    const grandis = ['발드릭스', '림보', '유피테르', '찬란한 흉성', '흉성', '최초의 대적자', '대적자', '카링', '감시자 칼로스', '칼로스', '선택받은 세렌', '세렌', '벨로나'];
    const arcane = ['검은 마법사', '검은마법사', '진 힐라', '진힐라', '듄켈', '더스크', '윌', '루시드'];
    const cat = grandis.includes(b.boss) ? '그란디스' : arcane.includes(b.boss) ? '아케인' : '루타·주간';

    let displayBoss = b.boss;
    if (b.boss === '대적자') displayBoss = '최초의 대적자';
    if (b.boss === '칼로스') displayBoss = '감시자 칼로스';
    if (b.boss === '세렌') displayBoss = '선택받은 세렌';
    if (b.boss === '흉성') displayBoss = '찬란한 흉성';
    if (b.boss === '가엔슬') displayBoss = '가디언 엔젤 슬라임';

    const diffLabels = { Extreme: '익스트림', Destiny: '데스티니', Champion: '챔피언', Chaos: '카오스', Hard: '하드', Normal: '노말', Easy: '이지' };

    const hasAuthentic = !!b.authenticForce;
    const hasArcane = !!b.arcaneForce;
    const forceType = hasAuthentic ? 'authentic' : hasArcane ? 'arcane' : 'none';
    const reqForce = hasAuthentic ? b.authenticForce : hasArcane ? b.arcaneForce : undefined;
    const userForce = hasAuthentic ? charAuthentic : hasArcane ? charArcane : undefined;
    const forceDmgPercent = hasAuthentic
      ? getAuthenticGapDmgCJS(b.authenticForce, charAuthentic)
      : hasArcane
      ? getArcaneGapDmgCJS(b.arcaneForce, charArcane)
      : 100;
    const levelDmgPercent = LEVEL_GAP_TABLE_CJS[levelKey] || 100;

    const isBlackMage = b.boss === '검은 마법사' || b.boss === '검은마법사';
    // 환산 공식: 레벨 최대 뎀뻥(120%) 기준 미달 시 부족(Lv) 판정 (charLevel < b.level + 5)
    const hasLevelPenalty = charLevel < (b.level + 5);
    const maxArcaneReq = isBlackMage ? Math.round(b.arcaneForce * 1.1) : Math.round(b.arcaneForce * 1.5);
    // 환산 공식: 포스 최대 배율 기준 미달 시 부족(F) 판정
    const hasForcePenalty = hasAuthentic
      ? charAuthentic < (b.authenticForce + 50)
      : hasArcane
      ? charArcane < maxArcaneReq
      : false;
    // 환산 공식: 어센틱 심볼 만렙 미달 시 부족(S) 판정
    const isMaxSymbolShortage = hasAuthentic && charAuthentic < (b.authenticForce + 50);

    const maxLevelDmg = 1.2;
    const maxArcaneDmg = isBlackMage ? 1.1 : 1.5;
    const maxAuthenticDmg = 1.25;

    const levelRatio = (levelDmgPercent / 100) / maxLevelDmg;
    const arcaneRatio = hasArcane && b.arcaneForce ? (forceDmgPercent / 100) / maxArcaneDmg : 1;
    const authenticRatio = hasAuthentic && b.authenticForce ? (forceDmgPercent / 100) / maxAuthenticDmg : 1;

    const netRatio = levelRatio * (hasArcane ? arcaneRatio : 1) * (hasAuthentic ? authenticRatio : 1);
    const totalDmgPenaltyPercent = netRatio < 1 ? parseFloat(((1 - netRatio) * 100).toFixed(1)) : 0;

    const item = {
      id: `scouter_${nameLower}_${diffLower}`,
      bossName: displayBoss,
      difficulty: b.difficulty,
      difficultyLabel: diffLabels[b.difficulty] || b.difficulty,
      category: cat,
      rawImg: primaryKey,
      iconUrl: `https://maplescouter.com/bossIcon/${primaryKey}.webp`,
      multiplier: multiplierStr,
      multiplierNum,
      statusLabel,
      stat: cut,
      isParty,
      bossLevel: b.level,
      bossArcaneForce: b.arcaneForce,
      bossAuthenticForce: b.authenticForce,
      userLevel: charLevel,
      userArcaneForce: charArcane,
      userAuthenticForce: charAuthentic,
      levelDmgPercent,
      forceDmgPercent,
      forceType,
      reqForce,
      userForce,
      totalDmgPenaltyPercent,
      hasLevelPenalty,
      hasForcePenalty,
      isMaxSymbolShortage,
    };

    multipliers[primaryKey] = item;

    const bossKorean = b.boss.replace(/\s+/g, '').toLowerCase();
    multipliers[`${diffLower}_${bossKorean}`] = item;

    bossList.push(item);
  }

  return { multipliers, bossList };
}

// 스크래핑 등으로 부분 수집된 보스 배율에 60개 공식 명세를 결합하여 이름, 난이도, 아이콘, 카테고리를 100% 완전 복원
function enrichMultipliersWithDefs(rawMultipliers) {
  const defs = getScouterBossDefinitions() || [];
  const enrichedMultipliers = {};
  const bossList = [];
  const diffLabels = { Extreme: '익스트림', Destiny: '데스티니', Champion: '챔피언', Chaos: '카오스', Hard: '하드', Normal: '노말', Easy: '이지' };
  const grandis = ['발드릭스', '림보', '유피테르', '찬란한 흉성', '흉성', '최초의 대적자', '대적자', '카링', '감시자 칼로스', '칼로스', '선택받은 세렌', '세렌', '벨로나'];
  const arcane = ['검은 마법사', '검은마법사', '진 힐라', '진힐라', '듄켈', '더스크', '윌', '루시드'];

  for (const b of defs) {
    const diffLower = String(b.difficulty).toLowerCase();
    const nameLower = String(b.name).toLowerCase();
    const primaryKey = `${diffLower}_${nameLower}`;
    const bossKorean = b.boss.replace(/\s+/g, '').toLowerCase();
    const combKey = `${diffLower}_${bossKorean}`;

    const scraped = (rawMultipliers && (rawMultipliers[primaryKey] || rawMultipliers[combKey] || rawMultipliers[nameLower])) || null;

    let displayBoss = b.boss;
    if (b.boss === '대적자') displayBoss = '최초의 대적자';
    if (b.boss === '칼로스') displayBoss = '감시자 칼로스';
    if (b.boss === '세렌') displayBoss = '선택받은 세렌';
    if (b.boss === '흉성') displayBoss = '찬란한 흉성';
    if (b.boss === '가엔슬') displayBoss = '가디언 엔젤 슬라임';

    const cat = grandis.includes(b.boss) ? '그란디스' : arcane.includes(b.boss) ? '아케인' : '루타·주간';

    const item = {
      id: `scouter_${nameLower}_${diffLower}`,
      bossName: displayBoss,
      difficulty: b.difficulty,
      difficultyLabel: diffLabels[b.difficulty] || b.difficulty,
      category: cat,
      rawImg: primaryKey,
      iconUrl: `https://maplescouter.com/bossIcon/${primaryKey}.webp`,
      multiplier: scraped ? scraped.multiplier : '-',
      multiplierNum: scraped && scraped.multiplierNum != null ? scraped.multiplierNum : null,
      statusLabel: scraped ? (scraped.statusLabel || '환산 갱신 필요') : '환산 갱신 필요',
      stat: b.bossCut || b.partyBossCut || 10000,
      isParty: !!b.partyBossCut,
    };

    enrichedMultipliers[primaryKey] = item;
    enrichedMultipliers[combKey] = item;
    bossList.push(item);
  }

  return { multipliers: enrichedMultipliers, bossList };
}

// 환산 스펙 (환산 주스탯, 헥사 환산, 보스 배율) 백그라운드 크롤러 핸들러
ipcMain.handle('fetch-scouter-stats', async (event, characterName) => {
  if (!characterName || typeof characterName !== 'string' || !characterName.trim()) {
    return { success: false, error: '캐릭터명이 필요합니다.' };
  }

  const targetName = characterName.trim();

  // 1. 로컬 Express 서버 (/api/scouter/stats) 초고속 조회 (0.2초 이내 무오차 계산)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const localRes = await fetch(`http://127.0.0.1:${PORT}/api/scouter/stats?name=${encodeURIComponent(targetName)}`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (localRes.ok) {
      const localJson = await localRes.json().catch(() => null);
      if (localJson && localJson.success && localJson.stats) {
        return {
          success: true,
          stats: localJson.stats,
        };
      }
    }
  } catch (_) {
    // 로컬 서버 미가동 또는 응답 지연 시 메인 프로세스 직접 조회
  }

  // 2. 메이플스카우터 공식 데이터 API 및 공식 연산 엔진 직접 초고속 조회 (0.2초 이내 무오차 계산)
  try {
    const scouterApiUrl = `https://api.maplescouter.com/api/id?name=${encodeURIComponent(targetName)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(scouterApiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'api-key': '01ce8bc7-43a0-4122-ae05-e23f07640b9c',
        'Referer': 'https://maplescouter.com/',
        'Origin': 'https://maplescouter.com',
        'Content-Type': 'application/json',
      },
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.calculatedData) {
        const calc = json.calculatedData;
        const mainStatNum = calc.boss300_stat || calc.boss380_stat || 0;
        const hexaStatNum = calc.boss300_hexaStat || calc.boss380_hexaStat || 0;
        const { multipliers: bossMultipliers, bossList } = calculateBossMultipliersFromApiData(json);

        if (bossMultipliers && Object.keys(bossMultipliers).length > 0) {
          return {
            success: true,
            stats: {
              mainStat: mainStatNum ? mainStatNum.toLocaleString('ko-KR') : '-',
              hexaStat: hexaStatNum ? hexaStatNum.toLocaleString('ko-KR') : '-',
              bossMultiplier: '-',
              combatPower: calc.combatPower ? String(calc.combatPower) : undefined,
              characterClass: calc.class || undefined,
              arcaneForce: Number(json.userStat?.stat?.arcaneForce || json.userStat?.arcaneForce || 0),
              authenticForce: Number(json.userStat?.stat?.authenticForce || json.userStat?.authenticForce || 0),
              userSymbol: json.userSymbol || undefined,
              bossMultipliers,
              bossList,
              updatedAt: new Date().toISOString(),
            },
          };
        }
      }
    }
  } catch (apiErr) {
    console.warn('Scouter direct API query error:', apiErr);
  }

  // 3. 가상 Chromium 브라우저 창 (show: false) 로드 보조 실행
  let tempWin = null;
  try {
    tempWin = new BrowserWindow({
      show: false,
      width: 1440,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        images: true,
      },
    });

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
    tempWin.webContents.setUserAgent(userAgent);

    const resultUrl = `https://maplescouter.com/ko/result?name=${encodeURIComponent(targetName)}`;
    const loadPromise = tempWin.loadURL(resultUrl);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Page load timeout')), 2500));
    await Promise.race([loadPromise, timeoutPromise]).catch(() => {});

    let stats = null;
    let pollError = null;

    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 250));

      const extractScript = `
        (function() {
          const bodyText = document.body ? document.body.innerText : '';
          
          if (bodyText.includes('캐릭터를 찾을 수 없습니다') || bodyText.includes('조회 결과가 없습니다')) {
            return { error: '캐릭터를 찾을 수 없습니다.' };
          }

          try {
            const tabs = Array.from(document.querySelectorAll('button, [role="tab"], div'));
            const allTab = tabs.find(el => el.textContent && el.textContent.trim() === '전체 보기' || (el.getAttribute && el.getAttribute('value') === 'all'));
            if (allTab && allTab.getAttribute('aria-selected') !== 'true' && allTab.getAttribute('data-state') !== 'active') {
              allTab.click();
            }
          } catch (_) {}

          let mainStat = '';
          let hexaStat = '';
          let combatPower = '';

          const mainMatch = bodyText.match(/환산(?:\\s*주스탯)?[^\\d]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,6})/);
          if (mainMatch && mainMatch[1]) mainStat = mainMatch[1];

          const hexaMatch = bodyText.match(/(?:HEXA|헥사)(?:\\s*환산)?[^\\d]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,6})/i);
          if (hexaMatch && hexaMatch[1]) hexaStat = hexaMatch[1];

          const cpMatch = bodyText.match(/전투력[^\\d]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{7,12})/);
          if (cpMatch && cpMatch[1]) combatPower = cpMatch[1].replace(/,/g, '');

          let arcaneForce = 0;
          let authenticForce = 0;
          const arcMatch = bodyText.match(/아케인포스[^\\d]*([0-9]{1,4})/);
          if (arcMatch && arcMatch[1]) arcaneForce = parseInt(arcMatch[1], 10);
          const authMatch = bodyText.match(/어센틱포스[^\\d]*([0-9]{1,4})/);
          if (authMatch && authMatch[1]) authenticForce = parseInt(authMatch[1], 10);

          const bossImages = Array.from(document.querySelectorAll('img[src*="bossIcon"], img[src*="/bossIcon/"]'));
          const bossMultipliers = {};

          bossImages.forEach((img) => {
            try {
              const src = img.getAttribute('src') || '';
              const match = src.match(/bossIcon\\/([^\\.\\?]+)/i);
              if (!match) return;
              const rawImgKey = match[1].toLowerCase().trim();

              let cardEl = img.parentElement;
              let foundCard = null;
              for (let d = 0; d < 6; d++) {
                if (!cardEl) break;
                const txt = cardEl.innerText || '';
                if (txt.includes('%') && (txt.includes('솔플') || txt.includes('파티') || txt.includes('불가능') || txt.includes('최소컷') || txt.includes('여유컷'))) {
                  foundCard = cardEl;
                  break;
                }
                cardEl = cardEl.parentElement;
              }

              if (!foundCard) return;

              const cardText = foundCard.innerText || '';
              const lines = cardText.split('\\n').map((l) => l.trim()).filter(Boolean);

              let statusLabel = '';
              for (const line of lines) {
                if (line.includes('솔플') || line.includes('파티') || line.includes('불가능') || line.includes('최소컷') || line.includes('여유컷')) {
                  statusLabel = line;
                  break;
                }
              }

              let multiplierStr = '';
              let multiplierNum = null;
              for (const line of lines) {
                const mMatch = line.match(/(?:\\[파티\\]\\s*)?([0-9]+(?:\\.[0-9]+)?%)/);
                if (mMatch) {
                  multiplierStr = line;
                  const numMatch = line.match(/([0-9]+(?:\\.[0-9]+)?)/);
                  if (numMatch) multiplierNum = parseFloat(numMatch[1]);
                  break;
                }
              }

              if (rawImgKey && multiplierStr) {
                bossMultipliers[rawImgKey] = {
                  rawImg: rawImgKey,
                  multiplier: multiplierStr,
                  multiplierNum: multiplierNum !== null ? multiplierNum : undefined,
                  statusLabel: statusLabel || '환산 갱신 필요',
                };
              }
            } catch (_) {}
          });

          const bossCount = Object.keys(bossMultipliers).length;

          if ((mainStat || hexaStat) && bossCount >= 3) {
            return {
              success: true,
              mainStat,
              hexaStat,
              combatPower: combatPower || undefined,
              arcaneForce: arcaneForce || undefined,
              authenticForce: authenticForce || undefined,
              bossMultipliers,
              bossCount,
            };
          }

          return null;
        })();
      `;

      const result = await tempWin.webContents.executeJavaScript(extractScript).catch(() => null);
      if (result) {
        if (result.error) {
          pollError = result.error;
          break;
        }
        if (result.success) {
          // 크롤러 결과에 공식 60개 보스 명세를 결합하여 이름, 난이도, 아이콘, 카테고리를 100% 완전 보강
          const { multipliers, bossList } = enrichMultipliersWithDefs(result.bossMultipliers || {});

          stats = {
            mainStat: result.mainStat || '-',
            hexaStat: result.hexaStat || '-',
            bossMultiplier: '-',
            combatPower: result.combatPower || undefined,
            arcaneForce: result.arcaneForce || 0,
            authenticForce: result.authenticForce || 0,
            bossMultipliers: multipliers,
            bossList,
            updatedAt: new Date().toISOString(),
          };
          break;
        }
      }
    }

    if (stats) {
      return { success: true, stats };
    }

    if (pollError) {
      return { success: false, error: pollError };
    }
  } catch (err) {
    console.error('Scouter Chromium scraping error:', err);
  } finally {
    if (tempWin && !tempWin.isDestroyed()) {
      tempWin.destroy();
    }
  }

  return {
    success: false,
    error: '메이플스카우터에서 환산 데이터를 읽어오지 못했습니다. 사이트 응답을 확인해주세요.',
  };
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

// 자동 업데이트 관리자 (GitHub Releases 연동)
let downloadedUpdateInfo = null;

function initAutoUpdater() {
  if (!app.isPackaged) return; // 개발 환경에서는 자동 업데이트 스킵
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false; // 앱 종료 시 강제 설치 방지: 사용자가 '업데이트' 버튼을 직접 누를 때만 설치

    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] 새 버전 발견:', info.version);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] 업데이트 다운로드 완료 (사용자 승인 대기):', info.version);
      downloadedUpdateInfo = info;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloaded', info);
      }
    });

    autoUpdater.on('error', (err) => {
      console.warn('[AutoUpdater] 업데이트 확인 건너뜀:', err.message);
    });

    ipcMain.on('quit-and-install', () => {
      console.log('[AutoUpdater] 사용자가 업데이트 승인 -> 즉시 재실행 및 패치 설치 진행');
      autoUpdater.quitAndInstall();
    });

    ipcMain.on('check-for-update-status', (event) => {
      if (downloadedUpdateInfo) {
        event.reply('update-downloaded', downloadedUpdateInfo);
      }
    });

    // 앱 실행 후 5초 뒤 백그라운드에서 조용히 업데이트 확인
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }, 5000);
  } catch (err) {
    console.warn('[AutoUpdater] 초기화 실패 (무시):', err.message);
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
    initAutoUpdater();
    
    // 윈도우 상태 및 저장소 데이터에서 PiP 활성화 여부 확인
    // 중요: 사용자가 설정에서 PiP 토글을 껐을 경우 window-state에 남아있는 이전 기록 때문에 강제로 켜지지 않도록 storage.json을 단일 진실 공급원(Single Source of Truth)으로 우선 검증
    let shouldOpenPiP = false;
    let foundStorageConfig = false;

    try {
      const candidates = [
        process.env.MAPLE_USER_DATA_PATH ? path.join(process.env.MAPLE_USER_DATA_PATH, 'data', 'storage.json') : null,
        path.join(app.getPath('userData'), 'data', 'storage.json'),
        process.env.APPDATA ? path.join(process.env.APPDATA, 'MapleSchedule', 'data', 'storage.json') : null,
        process.env.APPDATA ? path.join(process.env.APPDATA, 'maple-schedule', 'data', 'storage.json') : null,
        path.join(process.env.HOME || '', '.mapleschedule', 'data', 'storage.json'),
        path.join(process.cwd(), 'data', 'storage.json'),
      ].filter(Boolean);

      for (const p of candidates) {
        if (p && fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.settings && parsed.settings.pip) {
            foundStorageConfig = true;
            shouldOpenPiP = !!parsed.settings.pip.enabled;
            break;
          }
        }
      }
    } catch (e) {}

    // storage.json에 명시적 설정이 없던 경우에만 기존 window-state의 isOpen 확인
    if (!foundStorageConfig) {
      const pipState = loadWindowState().pip;
      if (pipState && pipState.isOpen) {
        shouldOpenPiP = true;
      }
    } else if (!shouldOpenPiP) {
      // storage.json에서 enabled가 false라면 window-state의 isOpen도 false로 동기화
      const currentPipState = loadWindowState().pip || {};
      saveWindowState({ pip: { ...currentPipState, isOpen: false } });
    }

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

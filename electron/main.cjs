const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { sendMediaKey, queryWindowsSMTC } = require('./mediaController.cjs');
const { getCpuAndRam, getNetworkSpeed } = require('./systemMonitor.cjs');

// ─── Optimizations ───────────────────────────────────────────────────────────
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disk-cache-size', '1');      // minimise disk cache
app.commandLine.appendSwitch('media-cache-size', '1');

// ─── Single Instance Lock ────────────────────────────────────────────────────
// Hanya enforce di production; dev mode tidak perlu karena sering restart
const isDev = process.argv.includes('--dev');
if (!isDev) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    process.exit(0);
  }
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── State ───────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let mediaPollTimer = null;
let fullscreenCheckTimer = null;
let systemMetricsTimer = null;
let capsCheckTimer = null;
let prevCaps = null;

// ─── Settings & Data paths ────────────────────────────────────────────────────
const settingsPath = path.join(app.getPath('userData'), 'notch_settings.json');
const dataPath     = path.join(app.getPath('userData'), 'notch_data.json');

let settings = {
  autoHideMode: false,          // false = Tetap Muncul (Stay), true = Sembunyi Otomatis (Auto-hide)
  autoHideFullscreen: false,
  alwaysOnTop: true,
  notchDefaultMode: 'island',   // 'island' | 'minimal' | 'mascot'
  glowEffect: true,
  chimeEnabled: true,
  openAtLogin: false,
};

let localData = {
  todos: [],
  waterToday: 0,
  waterDate: '',
  waterTarget: 2000,
  shelfFiles: [],
  pomodoroPreset: { work: 25, rest: 5 },
};

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
    }
  } catch {}
}

function saveSettings(patch = {}) {
  settings = { ...settings, ...patch };
  try { fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)); } catch {}
}

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      localData = { ...localData, ...JSON.parse(fs.readFileSync(dataPath, 'utf8')) };
    }
  } catch {}
  // Reset water counter if day changed
  const today = new Date().toISOString().slice(0, 10);
  if (localData.waterDate !== today) {
    localData.waterDate  = today;
    localData.waterToday = 0;
    saveData();
  }
}

function saveData(patch = {}) {
  localData = { ...localData, ...patch };
  try { fs.writeFileSync(dataPath, JSON.stringify(localData, null, 2)); } catch {}
}

// ─── Dynamic Window Bounds ───────────────────────────────────────────────────
function getBoundsForState(params = {}) {
  const { mode = 'idle', tab = 'music', lyrics = false, idleMode = 'clock', isAutoHidden = false } = params;
  const primaryDisplay = screen.getPrimaryDisplay();
  const sw = primaryDisplay ? primaryDisplay.bounds.width : 1920;

  let W = 280;
  let H = 48;

  if (isAutoHidden) {
    W = 180;
    H = 8;
  } else if (mode === 'expanded') {
    W = 490;
    if (tab === 'music') {
      H = lyrics ? 350 : 215;
    } else if (tab === 'produk') {
      H = 265;
    } else if (tab === 'prayer') {
      H = 280;
    } else if (tab === 'system') {
      H = 255;
    } else if (tab === 'shelf') {
      H = 275;
    } else {
      H = 265;
    }
  } else if (mode === 'settings') {
    W = 490;
    H = 330;
  } else if (mode === 'hud') {
    W = 320;
    H = 55;
  } else if (mode === 'minimal') {
    W = 160;
    H = 38;
  } else if (mode === 'mascot') {
    W = 160;
    H = 55;
  } else {
    // idle / media
    W = idleMode === 'player' ? 330 : 280;
    H = 48;
  }

  const X = Math.round((sw - W) / 2);
  return { x: X, y: 0, width: W, height: H };
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  const initialBounds = getBoundsForState({ mode: 'idle' });

  const iconPath = path.join(__dirname, 'icon.png');
  mainWindow = new BrowserWindow({
    width: initialBounds.width,
    height: initialBounds.height,
    x: initialBounds.x,
    y: initialBounds.y,
    frame: false,
    transparent: true,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('\n============================================================');
    console.log('🚀 Windows Dynamic Notch AKTIF & BERJALAN di Layar Desktop!');
    console.log('📍 Lokasi: Melayang di tengah atas monitor Anda');
    console.log('💡 Arahkan kursor mouse ke tepi atas layar untuk membuka notch!');
    console.log('============================================================\n');
  });

  // Load built dist (or dev server when run with --dev)
  const isDev      = process.argv.includes('--dev');
  const distIndex  = path.join(__dirname, '../dist/index.html');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => mainWindow.loadFile(distIndex));
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // ── Timers ────────────────────────────────────────────────────────────────
  // Media SMTC poll (setiap 3.5 detik, ringan)
  mediaPollTimer = setInterval(() => {
    if (!mainWindow?.isDestroyed()) {
      queryWindowsSMTC((d) => {
        if (!mainWindow?.isDestroyed()) mainWindow.webContents.send('media-update', d);
      });
    }
  }, 3500);

  // System metrics (CPU, RAM, Net) - polling santai 3 detik
  systemMetricsTimer = setInterval(async () => {
    if (!mainWindow?.isDestroyed()) {
      try {
        const metrics = await getCpuAndRam();
        mainWindow.webContents.send('system-metrics', metrics);
      } catch {}
    }
  }, 3000);
}

// ─── Tray ─────────────────────────────────────────────────────────────────────
function createTray() {
  const trayIconPath = path.join(__dirname, 'tray-icon.png');
  const mainIconPath = path.join(__dirname, 'icon.png');
  const icon = fs.existsSync(trayIconPath)
    ? nativeImage.createFromPath(trayIconPath)
    : fs.existsSync(mainIconPath)
      ? nativeImage.createFromPath(mainIconPath).resize({ width: 32, height: 32 })
      : nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAExJREFUOE9jZKAQMFKon2H4f+B/BikGBgZ5RiLN+f/f/z8jAwMjI9UtoZ1BMBqG0QCSgpHqJowGkBSMVC/NGA0gKRhBmkZ7YEBpEAB0pC9tFhVnfwAAAABJRU5ErkJggg==');

  tray = new Tray(icon);
  tray.setToolTip('Windows Dynamic Notch');

  const buildMenu = () => Menu.buildFromTemplate([
    { label: 'Windows Dynamic Notch', enabled: false },
    { type: 'separator' },
    { label: 'Selalu di Atas (Always on Top)', type: 'checkbox', checked: settings.alwaysOnTop,
      click: (i) => { saveSettings({ alwaysOnTop: i.checked }); mainWindow?.setAlwaysOnTop(i.checked, 'floating'); }},
    { label: 'Start with Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
      click: (i) => {
        app.setLoginItemSettings({ openAtLogin: i.checked, path: process.execPath, args: [] });
        saveSettings({ openAtLogin: i.checked });
      }},
    { type: 'separator' },
    { label: 'Keluar', click: () => app.quit() },
  ]);
  tray.setContextMenu(buildMenu());
}

// ─── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.on('set-ignore-mouse-events', (e, ignore, options) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  if (ignore) {
    win.setIgnoreMouseEvents(true, options || { forward: true });
  } else {
    win.setIgnoreMouseEvents(false);
  }
});
ipcMain.on('update-window-bounds', (e, state) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  const bounds = getBoundsForState(state);
  win.setBounds(bounds);
});
ipcMain.on('send-media-key', (_, k) => sendMediaKey(k));
ipcMain.on('set-always-on-top', (_, v) => {
  saveSettings({ alwaysOnTop: v });
  mainWindow?.setAlwaysOnTop(v, 'floating');
});
ipcMain.on('save-settings', (_, patch) => saveSettings(patch));
ipcMain.handle('get-settings', () => settings);
ipcMain.on('save-data', (_, patch) => saveData(patch));
ipcMain.handle('get-data', () => localData);
ipcMain.on('set-open-at-login', (_, v) => {
  app.setLoginItemSettings({ openAtLogin: v, path: process.execPath, args: [] });
  saveSettings({ openAtLogin: v });
});
ipcMain.on('quit-app', () => app.quit());

// Handler pengaturan volume dari UI Notch (tidak membajak tombol keyboard fisik)
ipcMain.on('adjust-volume', (_, delta) => {
  if (delta > 0) {
    sendMediaKey('volumeUp');
  } else if (delta < 0) {
    sendMediaKey('volumeDown');
  } else {
    sendMediaKey('mute');
  }
});

// ─── Hardware HUD Watcher (CapsLock & Master Volume) ──────────────────────────
let hwWatcher = null;
function startHardwareWatcher() {
  // Dukung unpack asar saat aplikasi di-build menjadi installer .exe
  let scriptPath = path.join(__dirname, 'hardwareWatcher.ps1');
  if (scriptPath.includes('app.asar')) {
    const unpacked = scriptPath.replace('app.asar', 'app.asar.unpacked');
    if (fs.existsSync(unpacked)) scriptPath = unpacked;
  }
  if (!fs.existsSync(scriptPath)) return;

  try {
    hwWatcher = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath
    ], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });

    let buffer = '';
    hwWatcher.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (line.startsWith('CAPS:')) {
          const isCaps = line.substring(5).trim().toLowerCase() === 'true';
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('capslock-change', { active: isCaps });
            mainWindow.webContents.send('hud-trigger', { type: 'capslock', capsLock: isCaps });
          }
        } else if (line.startsWith('VOL:')) {
          // Format: VOL:level:isMuted
          const parts = line.substring(4).split(':');
          const lvl = parseInt(parts[0], 10);
          const isMute = parts[1]?.toLowerCase() === 'true';
          if (!isNaN(lvl) && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('hud-trigger', {
              type: 'volume',
              level: lvl,
              isMuted: isMute,
            });
          }
        }
      }
    });

    hwWatcher.on('error', (err) => console.warn('[HardwareWatcher] Error:', err.message));
    hwWatcher.on('exit', () => { hwWatcher = null; });
  } catch (err) {
    console.warn('[HardwareWatcher] Spawn failed:', err.message);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  loadSettings();
  loadData();
  createWindow();
  createTray();
  startHardwareWatcher();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (hwWatcher) {
    try { hwWatcher.kill(); } catch {}
    hwWatcher = null;
  }
  [mediaPollTimer, fullscreenCheckTimer, systemMetricsTimer, capsCheckTimer]
    .forEach(t => t && clearInterval(t));
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

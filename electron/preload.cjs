const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notchAPI', {
  // Mouse click-through & Window Bounds
  setIgnoreMouseEvents: (v, opt) => ipcRenderer.send('set-ignore-mouse-events', v, opt),
  updateWindowBounds: (params) => ipcRenderer.send('update-window-bounds', params),

  // Media & Volume
  sendMediaKey: (k) => ipcRenderer.send('send-media-key', k),
  adjustVolume: (delta) => ipcRenderer.send('adjust-volume', delta),
  onMediaUpdate: (cb) => {
    const h = (_e, d) => cb(d);
    ipcRenderer.on('media-update', h);
    return () => ipcRenderer.removeListener('media-update', h);
  },

  // Hardware HUD triggers (volume, mute, brightness, capslock)
  onHUDTrigger: (cb) => {
    const h = (_e, d) => cb(d);
    ipcRenderer.on('hud-trigger', h);
    return () => ipcRenderer.removeListener('hud-trigger', h);
  },
  onCapslockChange: (cb) => {
    const h = (_e, d) => cb(d);
    ipcRenderer.on('capslock-change', h);
    return () => ipcRenderer.removeListener('capslock-change', h);
  },

  // Fullscreen
  onFullscreenChange: (cb) => {
    const h = (_e, v) => cb(v);
    ipcRenderer.on('fullscreen-change', h);
    return () => ipcRenderer.removeListener('fullscreen-change', h);
  },

  // System metrics (On-demand)
  startSystemMonitor: () => ipcRenderer.send('start-system-monitor'),
  stopSystemMonitor:  () => ipcRenderer.send('stop-system-monitor'),
  onSystemMetrics: (cb) => {
    const h = (_e, d) => cb(d);
    ipcRenderer.on('system-metrics', h);
    return () => ipcRenderer.removeListener('system-metrics', h);
  },

  // Settings
  saveSettings:    (s) => ipcRenderer.send('save-settings', s),
  getSettings:     ()  => ipcRenderer.invoke('get-settings'),
  setAlwaysOnTop:  (v) => ipcRenderer.send('set-always-on-top', v),
  setOpenAtLogin:  (v) => ipcRenderer.send('set-open-at-login', v),

  // Local data (todos, water, shelf, etc.)
  saveData: (patch) => ipcRenderer.send('save-data', patch),
  getData:  ()      => ipcRenderer.invoke('get-data'),

  // App controls
  quitApp: () => ipcRenderer.send('quit-app'),
});

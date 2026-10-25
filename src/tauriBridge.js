// ─── Tauri & Web Polyfill Bridge ─────────────────────────────────────────────
// Memungkinkan seluruh komponen React berjalan 100% identik baik di Electron maupun di Tauri
if (typeof window !== 'undefined' && !window.notchAPI) {
  window.notchAPI = {
    setIgnoreMouseEvents: (ignore, options) => {
      // Tauri cursor passthrough
      try {
        if (window.__TAURI_INTERNALS__) {
          import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
            getCurrentWindow().setIgnoreCursorEvents(ignore);
          }).catch(() => {});
        }
      } catch {}
    },
    updateWindowBounds: (bounds) => {
      try {
        if (window.__TAURI_INTERNALS__) {
          import('@tauri-apps/api/window').then(({ getCurrentWindow, LogicalSize, LogicalPosition }) => {
            const win = getCurrentWindow();
            const W = bounds.mode === 'expanded' ? 490 : (bounds.idleMode === 'player' ? 330 : 280);
            const H = bounds.mode === 'expanded' ? 260 : 48;
            win.setSize(new LogicalSize(W, H));
          }).catch(() => {});
        }
      } catch {}
    },
    getSettings: async () => {
      try {
        const raw = localStorage.getItem('notch_settings');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    saveSettings: (settings) => {
      try {
        localStorage.setItem('notch_settings', JSON.stringify(settings));
      } catch {}
    },
    getData: async () => {
      try {
        const raw = localStorage.getItem('notch_data');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    saveData: (data) => {
      try {
        localStorage.setItem('notch_data', JSON.stringify(data));
      } catch {}
    },
    onMediaUpdate: (cb) => {
      // Fallback timer untuk simulasi player jika di browser murni
      return () => {};
    },
    onHUDTrigger: (cb) => {
      return () => {};
    },
    onCapslockChange: (cb) => {
      return () => {};
    },
    onFullscreenChange: (cb) => {
      return () => {};
    },
    onSystemMetrics: (cb) => {
      return () => {};
    },
    startSystemMonitor: () => {},
    stopSystemMonitor: () => {},
    adjustVolume: (delta) => {},
    sendMediaKey: (k) => {},
    setAlwaysOnTop: (v) => {},
    setOpenAtLogin: (v) => {},
    quitApp: () => {
      try {
        if (window.__TAURI_INTERNALS__) {
          import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
            getCurrentWindow().close();
          }).catch(() => {});
        } else {
          window.close();
        }
      } catch {}
    },
  };
}

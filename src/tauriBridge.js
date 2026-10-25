// ─── Tauri & Web Polyfill Bridge ─────────────────────────────────────────────
// Memungkinkan seluruh komponen React berjalan 100% identik baik di Electron maupun di Tauri
if (typeof window !== 'undefined' && !window.notchAPI) {
  window.notchAPI = {
    setIgnoreMouseEvents: (_ignore, _options) => {
      // PENTING: Di Windows, setIgnoreCursorEvents(true) memasang gaya WS_EX_TRANSPARENT
      // yang menyebabkan seluruh event hover (mouseenter/mousemove) mati total!
      // Karena jendela Tauri ukurannya dinamis pas dengan notch (280x48 saat jam),
      // area di luar notch 100% tembus klik secara native OS tanpa mematikan cursor events.
    },
    updateWindowBounds: (bounds) => {
      try {
        if (window.__TAURI_INTERNALS__) {
          import('@tauri-apps/api/core').then(({ invoke }) => {
            invoke('update_window_bounds', {
              mode: bounds.mode || 'idle',
              tab: bounds.tab || null,
              lyrics: Boolean(bounds.lyrics),
              idleMode: bounds.idleMode || 'clock',
              isAutoHidden: Boolean(bounds.isAutoHidden),
            });
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

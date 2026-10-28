// ─── Tauri & Web Polyfill Bridge ─────────────────────────────────────────────
// Menghubungkan React frontend ke Rust backend via Tauri invoke + event listen.
// Di browser biasa: fallback ke localStorage / stub.

if (typeof window !== 'undefined' && !window.notchAPI) {
  const isTauri = Boolean(window.__TAURI_INTERNALS__);

  // ── Lazy Tauri API imports ────────────────────────────────────────────────
  let _core   = null;
  let _event  = null;
  let _win    = null;
  const getCore  = async () => { if (!_core)  _core  = await import('@tauri-apps/api/core');  return _core; };
  const getEvent = async () => { if (!_event) _event = await import('@tauri-apps/api/event'); return _event; };
  const getWin   = async () => { if (!_win)   _win   = await import('@tauri-apps/api/window'); return _win; };

  // ── Shared event listener registries ─────────────────────────────────────
  // Satu listener Tauri per event-type, di-share ke semua subscriber React.
  const _metricsCallbacks  = new Set();
  const _mediaCallbacks    = new Set();
  const _volumeCallbacks   = new Set();
  const _hudCallbacks      = new Set();
  const _capslockCallbacks = new Set();

  let _metricsUnlisten = null;
  let _mediaUnlisten   = null;
  let _volumeUnlisten  = null;

  async function ensureListener(eventName, callbackSet, unlistenRef, setter) {
    if (unlistenRef.current || !isTauri) return;
    try {
      const { listen } = await getEvent();
      unlistenRef.current = await listen(eventName, (ev) => {
        callbackSet.forEach(cb => { try { cb(ev.payload); } catch {} });
      });
    } catch (e) {
      console.warn(`[tauriBridge] listen(${eventName}) error:`, e);
    }
  }

  // wrapper objects untuk ref semantics
  const metricsRef  = { current: null };
  const mediaRef    = { current: null };
  const volumeRef   = { current: null };
  const capslockRef = { current: null };
  const hudRef      = { current: null };

  // ── Expose __openSettings globally untuk Rust tray menu ──────────────────
  window.__openSettings = null;

  window.notchAPI = {
    // ── Mouse events: not needed in Tauri (window is exact-fit) ──────────
    setIgnoreMouseEvents: () => {},

    // ── Window resize via Rust ────────────────────────────────────────────
    updateWindowBounds: (bounds) => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('update_window_bounds', {
        mode:         bounds.mode     || 'idle',
        tab:          bounds.tab      || null,
        lyrics:       Boolean(bounds.lyrics),
        idleMode:     bounds.idleMode || 'clock',
        isAutoHidden: Boolean(bounds.isAutoHidden),
      }).catch(() => {})).catch(() => {});
    },

    // ── Settings persistence ──────────────────────────────────────────────
    getSettings: async () => {
      try { const r = localStorage.getItem('notch_settings'); return r ? JSON.parse(r) : null; }
      catch { return null; }
    },
    saveSettings: (s) => {
      try { localStorage.setItem('notch_settings', JSON.stringify(s)); } catch {}
    },

    // ── App data persistence ──────────────────────────────────────────────
    getData: async () => {
      try { const r = localStorage.getItem('notch_data'); return r ? JSON.parse(r) : null; }
      catch { return null; }
    },
    saveData: (d) => {
      try { localStorage.setItem('notch_data', JSON.stringify(d)); } catch {}
    },

    // ── Media: listen ke Rust SMTC "media-update" event ──────────────────
    onMediaUpdate: (cb) => {
      if (!isTauri) return () => {};
      _mediaCallbacks.add(cb);
      // Ensure listener is active
      if (!mediaRef.current) {
        getEvent().then(({ listen }) => {
          listen('media-update', (ev) => {
            _mediaCallbacks.forEach(fn => { try { fn(ev.payload); } catch {} });
          }).then(unlisten => { mediaRef.current = unlisten; }).catch(() => {});
        }).catch(() => {});
      }
      return () => { _mediaCallbacks.delete(cb); };
    },

    // ── HUD events ───────────────────────────────────────────────────────
    onHUDTrigger: (cb) => {
      _hudCallbacks.add(cb);
      if (isTauri && !hudRef.current) {
        getEvent().then(({ listen }) => {
          listen('hud-trigger', (ev) => {
            _hudCallbacks.forEach(fn => { try { fn(ev.payload); } catch {} });
          }).then(unlisten => { hudRef.current = unlisten; }).catch(() => {});
        }).catch(() => {});
      }
      return () => { _hudCallbacks.delete(cb); };
    },

    // ── CapsLock detection ────────────────────────────────────────────────
    onCapslockChange: (cb) => {
      _capslockCallbacks.add(cb);
      if (isTauri && !capslockRef.current) {
        getEvent().then(({ listen }) => {
          listen('capslock-change', (ev) => {
            _capslockCallbacks.forEach(fn => { try { fn(ev.payload); } catch {} });
          }).then(unlisten => { capslockRef.current = unlisten; }).catch(() => {});
        }).catch(() => {});
      }
      return () => { _capslockCallbacks.delete(cb); };
    },
    onFullscreenChange: (cb) => () => {},

    // ── System Metrics ────────────────────────────────────────────────────
    onSystemMetrics: (cb) => {
      if (!isTauri) return () => {};
      _metricsCallbacks.add(cb);
      if (!metricsRef.current) {
        getEvent().then(({ listen }) => {
          listen('system-metrics', (ev) => {
            _metricsCallbacks.forEach(fn => { try { fn(ev.payload); } catch {} });
          }).then(unlisten => { metricsRef.current = unlisten; }).catch(() => {});
        }).catch(() => {});
      }
      return () => { _metricsCallbacks.delete(cb); };
    },

    startSystemMonitor: () => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('start_system_monitor').catch(() => {})).catch(() => {});
    },
    stopSystemMonitor: () => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('stop_system_monitor').catch(() => {})).catch(() => {});
    },

    // ── Volume detection ──────────────────────────────────────────────────
    // Subscribe ke Rust "volume-update" event.
    // Volume HUD trigger: tauriBridge mendeteksi perubahan volume via polling
    // dan emit ke onHUDTrigger callback di App.jsx.
    startVolumeMonitor: () => {
      if (!isTauri) return;
      if (volumeRef.current) return; // already listening
      getEvent().then(({ listen }) => {
        // volume-update: broadcast to any subscribers (e.g. ControlCenter slider)
        // NOTE: HUD is triggered via the separate 'hud-trigger' Rust event — do NOT double-fire here
        listen('volume-update', (ev) => {
          _volumeCallbacks.forEach(fn => { try { fn(ev.payload); } catch {} });
        }).then(unlisten => { volumeRef.current = unlisten; }).catch(() => {});
      }).catch(() => {});
    },

    stopVolumeMonitor: () => {
      if (window._volumePollInterval) {
        clearInterval(window._volumePollInterval);
        window._volumePollInterval = null;
      }
    },

    // ── Start media monitor explicitly ────────────────────────────────────
    startMediaMonitor: () => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('start_media_monitor').catch(() => {})).catch(() => {});
    },
    stopMediaMonitor: () => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('stop_media_monitor').catch(() => {})).catch(() => {});
    },

    // ── Media keys & volume adjust ────────────────────────────────────────
    // adjustVolume: maps a ±delta to repeated VK_VOLUMEUP / VK_VOLUMEDOWN key presses.
    // Each press ~= 2% system volume. We fire one press per 2% delta.
    adjustVolume: (delta) => {
      if (!isTauri || delta === 0) return;
      const key = delta > 0 ? 'volumeUp' : 'volumeDown';
      const presses = Math.max(1, Math.round(Math.abs(delta) / 2));
      getCore().then(({ invoke }) => {
        for (let i = 0; i < presses; i++) {
          invoke('send_media_key', { key }).catch(() => {});
        }
      }).catch(() => {});
    },
    sendMediaKey:   (key) => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('send_media_key', { key }).catch(() => {})).catch(() => {});
    },
    runQuickAction: (action) => {
      if (!isTauri) return;
      getCore().then(({ invoke }) => invoke('run_quick_action', { action }).catch(() => {})).catch(() => {});
    },
    setAlwaysOnTop: () => {},
    setOpenAtLogin: () => {},

    // ── Quit ─────────────────────────────────────────────────────────────
    quitApp: () => {
      if (isTauri) {
        getWin().then(({ getCurrentWindow }) => getCurrentWindow().close()).catch(() => {});
      } else {
        window.close();
      }
    },
  };

  // ── Auto-start volume & media monitors on load ────────────────────────────
  if (isTauri) {
    // Wait a tick for Tauri internals to be ready
    setTimeout(() => {
      window.notchAPI.startVolumeMonitor();
      window.notchAPI.startMediaMonitor();
    }, 500);
  }
}

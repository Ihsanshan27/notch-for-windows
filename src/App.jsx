import React, { useState, useEffect, useRef, useCallback } from 'react';
import IdlePill       from './components/IdlePill.jsx';
import MascotEye      from './components/MascotEye.jsx';
import ExpandedHub    from './components/ExpandedHub.jsx';
import HardwareHUD    from './components/HardwareHUD.jsx';
import SettingsPanel  from './components/SettingsPanel.jsx';
import PomodoroTimer, { PRESETS } from './components/PomodoroTimer.jsx';
import WaterReminder  from './components/WaterReminder.jsx';
import TodoList       from './components/TodoList.jsx';
import PrayerTimes    from './components/PrayerTimes.jsx';
import WeatherWidget  from './components/WeatherWidget.jsx';
import CalendarWidget from './components/CalendarWidget.jsx';
import FileShelf      from './components/FileShelf.jsx';
import MediaCompact   from './components/MediaCompact.jsx';

// ── Soft chime (Web Audio) ────────────────────────────────────────────────────
function playChime(enabled) {
  if (!enabled) return;
  try {
    const ctx   = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t); osc.stop(t + 0.85);
    });
  } catch {}
}

const DEFAULT_SETTINGS = {
  theme: 'midnight',            // 'midnight' (OLED Black #050505) | 'graphite' (Dark #2d2d2d)
  surfaceStyle: 'glass',        // 'glass' (Glassmorphism Blur) | 'solid' (Solid Opaque)
  autoHideMode: false,          // false = Tetap Muncul (Stay), true = Sembunyi Otomatis (Auto-hide)
  autoHideFullscreen: false,
  alwaysOnTop: true,
  notchDefaultMode: 'island',   // 'island' | 'minimal' | 'mascot'
  glowEffect: true,
  chimeEnabled: true,
  openAtLogin: false,
};

const DEFAULT_DATA = {
  todos: [],
  waterToday: 0,
  waterTarget: 2000,
  shelfFiles: [],
};

export default function App() {
  // ── Settings & Data ────────────────────────────────────────────────────────
  // IMPORTANT: Settings MUST be declared first to avoid hoisting bugs in useEffect
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [data,     setData]     = useState(DEFAULT_DATA);

  // ── Mode / State ────────────────────────────────────────────────────────────
  const [mode, setMode]               = useState('idle');  // idle|minimal|mascot|media|hud|expanded|settings
  const [prevMode, setPrevMode]       = useState('idle');
  const [activeTab, setActiveTab]     = useState('music');
  const [focusSubTab, setFocusSubTab] = useState('timer'); // 'timer' | 'water' | 'todo'
  const [isHovered, setIsHovered]     = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const [isPinned, setIsPinned]       = useState(false);
  const [showLyrics, setShowLyrics]   = useState(false);
  const [idleMode, setIdleMode]       = useState('clock'); // 'clock' | 'player'

  // ── Media & Volume ─────────────────────────────────────────────────────────
  const [media, setMedia]             = useState({ hasMedia:false, title:'', artist:'', album:'', status:'Paused' });
  const [isSimMusic, setIsSimMusic]   = useState(false);
  const [progress, setProgress]       = useState(0);
  const [progressSec, setProgressSec] = useState(0);
  const [volume, setVolume]           = useState(65);

  // ── Persistent Focus / Pomodoro Timer State ────────────────────────────────
  const [pomodoro, setPomodoro] = useState({
    running: false,
    phase: 'work',         // 'work' | 'rest'
    remaining: PRESETS[0].work * 60,
    total: PRESETS[0].work * 60,
    presetIdx: 0,
    sessions: 0,
    targetEndTime: null,
  });

  // ── HUD & Timers ───────────────────────────────────────────────────────────
  const [hud, setHud]                 = useState({ type:'volume', level:65, isMuted:false, capsLock:null });
  const hudTimerRef                   = useRef(null);
  const autoHideTimerRef              = useRef(null);
  const collapseTimerRef              = useRef(null);
  const expandHoverTimerRef           = useRef(null);
  const wakeTimerRef                  = useRef(null);
  const windowResizeTimerRef          = useRef(null);
  const lastRevealTimeRef             = useRef(0);
  const isHoveredRef                  = useRef(false);

  // ── System ────────────────────────────────────────────────────────────────
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging,   setIsCharging]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sysMetrics,   setSysMetrics]   = useState({});

  // ── Focus timer tick loop (timestamp-based: never drifts or resets) ─────────
  // Using ref to avoid stale closure on settings
  const chimeEnabledRef = useRef(settings.chimeEnabled);
  useEffect(() => { chimeEnabledRef.current = settings.chimeEnabled; }, [settings.chimeEnabled]);

  useEffect(() => {
    if (!pomodoro.running || !pomodoro.targetEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((pomodoro.targetEndTime - now) / 1000));

      if (diff <= 0) {
        // Phase complete
        playChime(chimeEnabledRef.current);
        setPomodoro(prev => {
          const nextPhase = prev.phase === 'work' ? 'rest' : 'work';
          const p = PRESETS[prev.presetIdx] || PRESETS[0];
          const nextDuration = (nextPhase === 'work' ? p.work : p.rest) * 60;
          return {
            ...prev,
            phase: nextPhase,
            remaining: nextDuration,
            total: nextDuration,
            targetEndTime: Date.now() + nextDuration * 1000,
            sessions: nextPhase === 'work' ? prev.sessions + 1 : prev.sessions,
          };
        });
      } else {
        setPomodoro(prev => ({ ...prev, remaining: diff }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [pomodoro.running, pomodoro.targetEndTime]);

  const togglePomodoro = () => {
    setPomodoro(prev => {
      if (!prev.running) {
        return {
          ...prev,
          running: true,
          targetEndTime: Date.now() + prev.remaining * 1000,
        };
      } else {
        return {
          ...prev,
          running: false,
          targetEndTime: null,
        };
      }
    });
  };

  const resetPomodoro = () => {
    setPomodoro(prev => {
      const p = PRESETS[prev.presetIdx] || PRESETS[0];
      const dur = p.work * 60;
      return {
        ...prev,
        running: false,
        phase: 'work',
        remaining: dur,
        total: dur,
        targetEndTime: null,
      };
    });
  };

  const changePomodoroPreset = (idx) => {
    const p = PRESETS[idx] || PRESETS[0];
    const dur = p.work * 60;
    setPomodoro(prev => ({
      ...prev,
      presetIdx: idx,
      running: false,
      phase: 'work',
      remaining: dur,
      total: dur,
      targetEndTime: null,
    }));
  };

  // ── High-precision Continuous Playback Clock for Music & Karaoke Lyrics ───
  const progressRef       = useRef(null);
  const trackDurationRef  = useRef(240); // default 4 min
  const currentSecRef     = useRef(0);   // current precise position in seconds (float)
  const lastWallClockRef  = useRef(Date.now()); // timestamp when currentSecRef was last ticked
  const prevTitleRef      = useRef('');  // detect track changes
  const isSeekingRef      = useRef(false);
  const seekTimerRef      = useRef(null);

  const handleSeek = useCallback((sec) => {
    const dur = trackDurationRef.current;
    const clampedSec = Math.max(0, Math.min(dur, sec));
    currentSecRef.current = clampedSec;
    lastWallClockRef.current = Date.now();
    setProgressSec(clampedSec);
    setProgress(dur > 0 ? Math.min(100, (clampedSec / dur) * 100) : 0);

    // Call native SMTC seek
    if (!isSimMusic && window.notchAPI?.seekMedia) {
      window.notchAPI.seekMedia(clampedSec * 1000);
    }

    // Suppress incoming polling briefly so player has time to process seek
    isSeekingRef.current = true;
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    seekTimerRef.current = setTimeout(() => {
      isSeekingRef.current = false;
    }, 700);
  }, [isSimMusic]);

  useEffect(() => {
    if (media.status === 'Playing') {
      lastWallClockRef.current = Date.now();
      progressRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.max(0, (now - lastWallClockRef.current) / 1000);
        lastWallClockRef.current = now;

        currentSecRef.current = Math.min(trackDurationRef.current, currentSecRef.current + delta);
        const sec = currentSecRef.current;
        const dur = trackDurationRef.current;
        setProgressSec(sec);
        setProgress(dur > 0 ? Math.min(100, (sec / dur) * 100) : 0);
      }, 100); // 100ms interval for butter-smooth progress bar & sub-second synced lyrics
    } else {
      clearInterval(progressRef.current);
    }
    return () => clearInterval(progressRef.current);
  }, [media.status]);

  const getFallbackMode = useCallback(() => {
    if (settings.notchDefaultMode === 'mascot') return 'mascot';
    if (settings.notchDefaultMode === 'minimal') return 'minimal';
    return 'idle';
  }, [settings.notchDefaultMode]);

  // ── Sync mode when settings change ─────────────────────────────────────────
  useEffect(() => {
    if (['idle', 'minimal', 'mascot', 'media'].includes(mode)) {
      setMode(getFallbackMode());
    }
  }, [settings.notchDefaultMode, getFallbackMode]);

  // ── Dynamic Window Bounds Sync ─────────────────────────────────────────────
  // Aturan resize window OS:
  // - INSTAN: expanded, settings, hud, reveal dari auto-hidden (isAutoHidden → false)
  // - DELAY 440ms: kembali ke idle/media (agar CSS shrink animation selesai dulu)
  useEffect(() => {
    const instant = (
      mode === 'expanded' ||
      mode === 'settings' ||
      mode === 'hud' ||
      !isAutoHidden         // sedang reveal dari hidden → window harus besar segera
    );

    if (instant) {
      if (windowResizeTimerRef.current) clearTimeout(windowResizeTimerRef.current);
      window.notchAPI?.updateWindowBounds({
        mode,
        tab: activeTab,
        lyrics: showLyrics,
        idleMode,
        isAutoHidden,
      });
    } else {
      // isAutoHidden === true: window mengecil ke 8px — tunda agar animasi hide selesai
      if (windowResizeTimerRef.current) clearTimeout(windowResizeTimerRef.current);
      windowResizeTimerRef.current = setTimeout(() => {
        window.notchAPI?.updateWindowBounds({
          mode,
          tab: activeTab,
          lyrics: showLyrics,
          idleMode,
          isAutoHidden,
        });
      }, 360);
    }
    return () => {
      if (windowResizeTimerRef.current) clearTimeout(windowResizeTimerRef.current);
    };
  }, [mode, activeTab, showLyrics, idleMode, isAutoHidden]);

  // ── On-Demand System Telemetry (Deep Sleep saat mode jam) ───────────────────
  // Jalankan polling CPU/RAM hanya saat expanded hub terbuka, hemat CPU saat idle.
  useEffect(() => {
    if (mode === 'expanded') {
      window.notchAPI?.startSystemMonitor();
    } else {
      window.notchAPI?.stopSystemMonitor();
    }
    return () => {
      window.notchAPI?.stopSystemMonitor();
    };
  }, [mode]);

  // ── HUD trigger (Auto-reveals notch even when auto-hidden) ──────────────────
  const triggerHUD = useCallback((ev) => {
    // 1. Reveal notch seketika jika notch sedang auto-hidden
    setIsAutoHidden(false);
    window.notchAPI?.setIgnoreMouseEvents(false);

    // 2. Batalkan timer auto-hide / collapse yang sedang pending
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);

    // 3. Update HUD state
    setHud(h => {
      let next = { ...h, type: ev.type || 'volume' };
      if (ev.type === 'volume') {
        const nextLvl = ev.level !== undefined
          ? Math.min(100, Math.max(0, ev.level))
          : Math.min(100, Math.max(0, h.level + (ev.delta || 0)));
        next.level = nextLvl;
        next.isMuted = ev.isMuted ?? false;
        setVolume(nextLvl);
      } else if (ev.type === 'capslock') {
        next.capsLock = Boolean(ev.capsLock);
      }
      if (ev.type === 'mute') {
        next.isMuted = ev.isMuted !== undefined ? ev.isMuted : !h.isMuted;
      }
      return next;
    });

    // 4. Beralih ke HUD mode
    setMode(m => {
      if (m !== 'hud') setPrevMode(m);
      return 'hud';
    });

    // 5. Dismiss timer
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setMode(m => m === 'hud' ? getFallbackMode() : m);

      // Jika autoHideMode aktif dan mouse tidak sedang hovering notch:
      // Notch otomatis meluncur tersembunyi kembali!
      if (settings.autoHideMode && !isHoveredRef.current) {
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = setTimeout(() => {
          if (isHoveredRef.current) return;
          setIsAutoHidden(true);
          window.notchAPI?.setIgnoreMouseEvents(true);
        }, 400);
      } else {
        if (!isHoveredRef.current) {
          window.notchAPI?.setIgnoreMouseEvents(true);
        }
      }
    }, 2200);
  }, [getFallbackMode, settings.autoHideMode]);

  // ── Load initial state & IPC listeners ─────────────────────────────────────
  useEffect(() => {
    const api = window.notchAPI;
    if (!api) return;

    api.getSettings().then(s => {
      if (s) {
        setSettings(prev => ({ ...prev, ...s }));
        if (s.notchDefaultMode) {
          setMode(s.notchDefaultMode === 'island' ? 'idle' : s.notchDefaultMode);
        }
        // Jika auto-hide aktif: sembunyikan notch setelah 1.2 detik startup
        if (s.autoHideMode) {
          setTimeout(() => {
            setIsAutoHidden(true);
            window.notchAPI?.setIgnoreMouseEvents(true);
          }, 1200);
        }
      }
    });

    api.getData().then(d => { if (d) setData(prev => ({ ...prev, ...d })); });

    if (navigator.getBattery) {
      navigator.getBattery().then(b => {
        const upd = () => { setBatteryLevel(Math.round(b.level * 100)); setIsCharging(b.charging); };
        upd();
        b.addEventListener('levelchange', upd);
        b.addEventListener('chargingchange', upd);
      });
    }

    // ── Media: listen ke SMTC Rust event (via tauriBridge onMediaUpdate) ────
    const u1 = api.onMediaUpdate(d => {
      if (isSimMusic) return;
      if (d?.hasMedia) {
        const isNewTrack = d.title && d.title !== prevTitleRef.current;
        const reportedSec = Math.max(0, (d.positionMs || 0) / 1000);
        const dur = (d.durationMs && d.durationMs > 0) ? (d.durationMs / 1000) : trackDurationRef.current;
        trackDurationRef.current = dur > 0 ? dur : 240;

        if (isNewTrack) {
          prevTitleRef.current = d.title;
          currentSecRef.current = reportedSec;
          lastWallClockRef.current = Date.now();
          setProgressSec(reportedSec);
          setProgress(dur > 0 ? Math.min(100, (reportedSec / dur) * 100) : 0);
        } else if (!isSeekingRef.current) {
          // If status changed or seek flag is true or accumulated drift > 1.2s:
          setMedia(prevM => {
            const statusChanged = prevM.status !== d.status;
            const drift = Math.abs(reportedSec - currentSecRef.current);

            if (d.isSeek || statusChanged || drift > 1.2) {
              currentSecRef.current = reportedSec;
              lastWallClockRef.current = Date.now();
              setProgressSec(reportedSec);
              setProgress(dur > 0 ? Math.min(100, (reportedSec / dur) * 100) : 0);
            }
            return prevM;
          });
        }

        setMedia(m => {
          if (m.status !== 'Playing' && d.status === 'Playing') {
            lastWallClockRef.current = Date.now();
          }
          return { ...m, ...d };
        });

        // Auto-switch ke media mode jika ada lagu yang baru mulai
        setMode(m => {
          if (['idle', 'minimal', 'mascot'].includes(m)) return 'media';
          return m;
        });
      } else {
        prevTitleRef.current = '';
        currentSecRef.current = 0;
        setMedia(m => ({ ...m, hasMedia: false, status: 'Paused' }));
        setProgressSec(0);
        setProgress(0);
        // Kembali ke idle jika sudah tidak ada media
        setMode(m => m === 'media' ? getFallbackMode() : m);
      }
    });

    // ── Expose __openSettings ke Rust tray menu ───────────────────────────
    window.__openSettings = () => setMode('settings');

    // ── HUD trigger (volume & capslock changes dari Rust) ─────────────────
    const u2 = api.onHUDTrigger(ev => triggerHUD(ev));
    const u3 = api.onFullscreenChange(v => setIsFullscreen(v));
    const u4 = api.onSystemMetrics(d => setSysMetrics(d));

    return () => {
      u1?.(); u2?.(); u3?.(); u4?.();
      window.__openSettings = null;
      api.stopVolumeMonitor?.();
      api.stopMediaMonitor?.();
    };
  }, [isSimMusic, getFallbackMode, triggerHUD]);

  // ── Keyboard global listeners (Escape to close, CapsLock HUD) ───────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && ['expanded', 'settings'].includes(mode)) {
        closeExpanded();
      }
      if (e.key === 'CapsLock') {
        const caps = e.getModifierState('CapsLock');
        triggerHUD({ type: 'capslock', capsLock: caps });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, triggerHUD]);

  // ── Volume Control Helper ──────────────────────────────────────────────────
  const handleVolumeChange = (newVol) => {
    const delta = newVol - volume;
    setVolume(newVol);
    window.notchAPI?.adjustVolume(delta);
  };

  // ── Settings & Data helpers ────────────────────────────────────────────────
  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    window.notchAPI?.saveSettings(next);
    if ('alwaysOnTop' in patch) window.notchAPI?.setAlwaysOnTop(patch.alwaysOnTop);
  };

  const updateData = (patch) => {
    const next = { ...data, ...patch };
    setData(next);
    window.notchAPI?.saveData(next);
  };

  // ── Media controls ─────────────────────────────────────────────────────────
  const togglePlay = () => {
    window.notchAPI?.sendMediaKey('playPause');
    setMedia(m => {
      const nextStatus = m.status === 'Playing' ? 'Paused' : 'Playing';
      if (nextStatus === 'Playing') {
        lastWallClockRef.current = Date.now();
      }
      return { ...m, status: nextStatus };
    });
  };
  const mediaNext = () => window.notchAPI?.sendMediaKey('next');
  const mediaPrev = () => window.notchAPI?.sendMediaKey('prev');

  // ── Demo music ────────────────────────────────────────────────────────────
  const toggleSimMusic = () => {
    if (!isSimMusic) {
      setIsSimMusic(true);
      prevTitleRef.current = "Starboy (feat. Daft Punk)";
      trackDurationRef.current = 230; // 3:50
      currentSecRef.current = 0;
      lastWallClockRef.current = Date.now();
      setMedia({ hasMedia:true, title:"Starboy (feat. Daft Punk)", artist:"The Weeknd", album:"Starboy (Deluxe)", status:"Playing" });
      setProgressSec(0); setProgress(0);
      setMode('media');
    } else {
      setIsSimMusic(false);
      prevTitleRef.current = '';
      currentSecRef.current = 0;
      setMedia({ hasMedia:false, title:'', artist:'', album:'', status:'Paused' });
      setProgressSec(0); setProgress(0);
      setMode(getFallbackMode());
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setIsHovered(true);

    // 1. Batalkan semua timer penutupan/penyembunyian
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (expandHoverTimerRef.current) {
      clearTimeout(expandHoverTimerRef.current);
      expandHoverTimerRef.current = null;
    }
    if (wakeTimerRef.current) {
      clearTimeout(wakeTimerRef.current);
      wakeTimerRef.current = null;
    }

    if (isAutoHidden) {
      // Fase 1 — Tampilkan notch (slide-in dari atas)
      // Resize window OS ke ukuran idle TERLEBIH DAHULU (sebelum CSS bergerak)
      // agar clip area cukup besar sehingga spring animation tidak terpotong.
      lastRevealTimeRef.current = Date.now();
      window.notchAPI?.setIgnoreMouseEvents(false);
      window.notchAPI?.updateWindowBounds({ mode: 'idle', isAutoHidden: false });
      setIsAutoHidden(false);
      setMode(getFallbackMode());

      // Fase 2 — Setelah jam selesai slide-in dan terlihat jelas → expand ke menu
      // 680ms = 400ms spring + 200ms fade-in + 80ms buffer
      expandHoverTimerRef.current = setTimeout(() => {
        if (!isHoveredRef.current) return;
        setMode(m => {
          if (['idle', 'media', 'minimal', 'mascot'].includes(m)) {
            setPrevMode(m);
            return 'expanded';
          }
          return m;
        });
      }, 680);
      return;
    }

    // Guard: abaikan hover sekunder selama animasi reveal masih berjalan (750ms)
    if (Date.now() - lastRevealTimeRef.current < 750) {
      return;
    }

    window.notchAPI?.setIgnoreMouseEvents(false);

    // Jika notch sudah terlihat: tunggu hover sengaja (280ms) sebelum expand
    if (mode !== 'settings' && mode !== 'hud' && mode !== 'expanded') {
      expandHoverTimerRef.current = setTimeout(() => {
        if (!isHoveredRef.current) return;
        setMode(m => {
          if (['idle', 'media', 'minimal', 'mascot'].includes(m)) {
            setPrevMode(m);
            return 'expanded';
          }
          return m;
        });
      }, 280);
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setIsHovered(false);

    if (wakeTimerRef.current) {
      clearTimeout(wakeTimerRef.current);
      wakeTimerRef.current = null;
    }

    if (expandHoverTimerRef.current) {
      clearTimeout(expandHoverTimerRef.current);
      expandHoverTimerRef.current = null;
    }

    // Jika dipin atau sedang di settings: jangan collapse
    if (isPinned || mode === 'settings') return;

    if (mode === 'expanded') {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = setTimeout(() => {
        if (isHoveredRef.current) return;

        // 1. Menunya hilang dulu, kembali kelihatan JAM!
        setMode(getFallbackMode());

        // 2. Setelah jam terlihat sebentar, baru hide lagi!
        if (settings.autoHideMode) {
          if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
          autoHideTimerRef.current = setTimeout(() => {
            if (isHoveredRef.current) return;
            setIsAutoHidden(true);
          }, 1100);
        }
      }, 180);
    } else {
      if (settings.autoHideMode) {
        if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = setTimeout(() => {
          if (isHoveredRef.current) return;
          setIsAutoHidden(true);
        }, 1100);
      }
    }
  };

  const closeExpanded = () => {
    setMode(getFallbackMode());
    if (!isHovered) {
      window.notchAPI?.setIgnoreMouseEvents(true);
    }
  };

  // ── CSS Classes & DYNAMIC HEIGHT ───────────────────────────────────────────
  const getDynamicHeightClass = () => {
    if (mode === 'settings') return 'expanded-h-settings';
    if (mode === 'expanded') {
      switch (activeTab) {
        case 'music':   return showLyrics ? 'expanded-h-music-lyrics' : 'expanded-h-music';
        case 'produk':  return 'expanded-h-focus';
        case 'prayer':  return 'expanded-h-prayer';
        case 'weather':  return 'expanded-h-weather';
        case 'calendar': return 'expanded-h-calendar';
        case 'shelf':    return 'expanded-h-shelf';
        default:        return 'expanded-h-music';
      }
    }
    return '';
  };

  const stateClass = () => {
    if (mode === 'expanded' || mode === 'settings') return `state-expanded ${getDynamicHeightClass()}`;
    if (mode === 'hud')     return 'state-hud';
    if (mode === 'mascot')  return 'state-mascot';
    if (mode === 'minimal') return 'state-minimal';
    return idleMode === 'player' ? 'state-idle state-idle-player' : 'state-idle';
  };

  const isFullscreenHidden = isFullscreen && settings.autoHideFullscreen;

  // ── Tab panel renderer ────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'produk': return (
        <div style={{ display:'flex', flexDirection:'column', gap:0, width:'100%', height:'100%' }}>
          {/* Sub-tabs for Focus area */}
          <div style={{ display:'flex', gap:4, marginBottom:8, flexShrink:0 }}>
            {[
              { id:'timer', label:'Pomodoro' },
              { id:'water', label:'Air Minum' },
              { id:'todo',  label:'To-Do' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setFocusSubTab(st.id)}
                style={{
                  flex:1, padding:'3px 0', borderRadius:7,
                  background: focusSubTab === st.id ? 'rgba(191,90,242,.18)' : 'rgba(255,255,255,.05)',
                  border: focusSubTab === st.id ? '1px solid rgba(191,90,242,.35)' : '1px solid transparent',
                  color: focusSubTab === st.id ? 'var(--purple)' : 'var(--text-2)',
                  fontSize:9.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .18s',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sub-tab content */}
          <div style={{ flex:1, overflow:'hidden' }}>
            {focusSubTab === 'timer' && (
              <PomodoroTimer
                timerState={pomodoro}
                onToggle={togglePomodoro}
                onReset={resetPomodoro}
                onChangePreset={changePomodoroPreset}
              />
            )}
            {focusSubTab === 'water' && (
              <WaterReminder
                todayMl={data.waterToday}
                targetMl={data.waterTarget}
                onAdd={ml => updateData({ waterToday: (data.waterToday || 0) + ml })}
                onReset={() => updateData({ waterToday: 0 })}
              />
            )}
            {focusSubTab === 'todo' && (
              <TodoList
                todos={data.todos}
                onSave={todos => updateData({ todos })}
              />
            )}
          </div>
        </div>
      );
      case 'prayer':   return <PrayerTimes chimeEnabled={settings.chimeEnabled}/>;
      case 'weather':  return <WeatherWidget />;
      case 'calendar': return <CalendarWidget />;
      case 'shelf':    return <FileShelf files={data.shelfFiles} onSave={f => updateData({ shelfFiles:f })}/>;
      default:        return null;
    }
  };

  return (
    <div
      className="notch-wrapper"
      data-theme={settings.theme || 'midnight'}
      data-surface={settings.surfaceStyle || 'glass'}
      onClick={() => {
        if (['expanded', 'settings'].includes(mode)) closeExpanded();
      }}
    >
      {/* ── Single Hitbox Container: Menjamin hover stabil dan bebas glitch ── */}
      <div
        className={`notch-hitbox ${isAutoHidden ? 'is-hidden-hitbox' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trigger zone penanda posisi notch saat tersembunyi (selalu ada di DOM agar bebas glitch) */}
        <div
          className="notch-trigger-zone"
          title="Arahkan kursor ke sini untuk membuka notch"
          style={{
            opacity: isAutoHidden ? 1 : 0,
            pointerEvents: isAutoHidden ? 'auto' : 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <div className="notch-indicator-bar" />
        </div>

        {/* ── The Notch Island (Glass or Solid) ── */}
        <div
          data-theme={settings.theme || 'midnight'}
          data-surface={settings.surfaceStyle || 'glass'}
          className={`notch-island ${stateClass()} ${isAutoHidden ? 'is-autohidden' : ''} ${isFullscreenHidden ? 'is-fullscreen-hidden' : ''} ${isCharging && !isFullscreenHidden ? 'charging-glow' : ''}`}
          onClick={(e) => {
            if (['idle', 'media', 'minimal', 'mascot'].includes(mode)) {
              e.stopPropagation();
              if (expandHoverTimerRef.current) clearTimeout(expandHoverTimerRef.current);
              setPrevMode(mode);
              setMode('expanded');
            }
          }}
        >
        <div className="notch-content-fade">
          {/* ── Idle / Compact Pill (Clock & Mini Player) ── */}
          {(mode === 'idle' || mode === 'media') && (
            <IdlePill
              batteryLevel={batteryLevel} isCharging={isCharging}
              media={media}
              onTogglePlay={togglePlay}
              idleMode={idleMode}
              onToggleIdleMode={() => setIdleMode(m => m === 'clock' ? 'player' : 'clock')}
            />
          )}

          {/* ── Minimal Strip ── */}
          {mode === 'minimal' && (
            <div style={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'center' }}>
              <div style={{ width:24, height:3, background:'rgba(255,255,255,0.25)', borderRadius:2 }}/>
            </div>
          )}

          {/* ── Mascot Eyes ── */}
          {mode === 'mascot' && (
            <MascotEye isPlaying={media.status === 'Playing'} isIdle={!media.hasMedia}/>
          )}

          {/* ── Hardware HUD ── */}
          {mode === 'hud' && (
            <HardwareHUD type={hud.type} level={hud.level} isMuted={hud.isMuted} capsLock={hud.capsLock}/>
          )}

          {/* ── Expanded Hub ── */}
          {mode === 'expanded' && (
            <div style={{ width:'100%', height:'100%' }} onClick={e => e.stopPropagation()}>
              <ExpandedHub
                activeTab={activeTab} setActiveTab={setActiveTab}
                media={media} onTogglePlay={togglePlay} onNext={mediaNext} onPrev={mediaPrev}
                onClose={closeExpanded}
                isPinned={isPinned} onTogglePin={() => setIsPinned(!isPinned)}
                batteryLevel={batteryLevel} isCharging={isCharging}
                onOpenSettings={() => { setPrevMode('expanded'); setMode('settings'); }}
                progress={progress} progressSec={progressSec}
                trackDuration={trackDurationRef.current}
                onSeek={handleSeek}
                volume={volume}
                onChangeVolume={handleVolumeChange}
                showLyrics={showLyrics}
                onToggleLyrics={() => setShowLyrics(!showLyrics)}
              >
                {renderTabContent()}
              </ExpandedHub>
            </div>
          )}

          {/* ── Settings Panel ── */}
          {mode === 'settings' && (
            <div style={{ width:'100%', height:'100%' }} onClick={e => e.stopPropagation()}>
              <SettingsPanel
                settings={settings} onUpdate={updateSettings}
                onClose={() => setMode('expanded')}
                onTestHUD={() => triggerHUD({ type:'volume', delta:+5 })}
                onTestChime={() => playChime(true)}
                onToggleSimMusic={toggleSimMusic} isSimMusic={isSimMusic}
                onQuit={() => window.notchAPI?.quitApp()}
              />
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

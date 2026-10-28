use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use sysinfo::System;
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

// ── Windows-only imports ──────────────────────────────────────────────────────
#[cfg(target_os = "windows")]
use windows::{
    Win32::{
        Media::Audio::{
            eConsole, eRender, Endpoints::IAudioEndpointVolume,
            IMMDeviceEnumerator, MMDeviceEnumerator,
        },
        System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED},
    },
    Media::Control::{
        GlobalSystemMediaTransportControlsSession,
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    },
};

// ── Win32 keyboard APIs for global CapsLock detection & media keys ───────────
#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn GetKeyState(n_virt_key: i32) -> i16;
    fn GetAsyncKeyState(n_virt_key: i32) -> i16;
    fn keybd_event(b_vk: u8, b_scan: u8, dw_flags: u32, dw_extra_info: usize);
}

// ── State ─────────────────────────────────────────────────────────────────────
struct MonitorState {
    running: bool,
}

struct MediaMonitorState {
    running: bool,
}

// ── Helper: get Windows master volume (0.0 – 100.0) ──────────────────────────
#[cfg(target_os = "windows")]
fn get_master_volume_windows() -> Option<(f32, bool)> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_INPROC_SERVER).ok()?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole).ok()?;
        // Turbofish required: windows 0.61 Activate<T> generic
        let vol = device.Activate::<IAudioEndpointVolume>(CLSCTX_INPROC_SERVER, None).ok()?;
        let level = vol.GetMasterVolumeLevelScalar().ok()?;
        let muted = vol.GetMute().ok()?.as_bool();
        Some((level * 100.0, muted))
    }
}

#[cfg(not(target_os = "windows"))]
fn get_master_volume_windows() -> Option<(f32, bool)> { None }

// ── Helper: get current media session info via SMTC ─────────────────────────
#[cfg(target_os = "windows")]
fn get_smtc_media() -> Option<serde_json::Value> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
    }

    let mgr = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .ok()?.get().ok()?;

    // Try current session first, fallback to first Playing session
    let session = if let Ok(s) = mgr.GetCurrentSession() {
        s
    } else if let Ok(sessions) = mgr.GetSessions() {
        let mut target: Option<GlobalSystemMediaTransportControlsSession> = None;
        for s in sessions {
            if let Ok(info) = s.GetPlaybackInfo() {
                if let Ok(st) = info.PlaybackStatus() {
                    if st == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing {
                        target = Some(s);
                        break;
                    }
                }
            }
            if target.is_none() {
                target = Some(s);
            }
        }
        target?
    } else {
        return None;
    };

    // Playback status
    let playback_info = session.GetPlaybackInfo().ok()?;
    let status = playback_info.PlaybackStatus().ok()?;
    let is_playing = status
        == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing;

    // Media properties
    let props = session.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let title  = props.Title().unwrap_or_default().to_string();
    let artist = props.Artist().unwrap_or_default().to_string();
    let album  = props.AlbumTitle().unwrap_or_default().to_string();

    if title.is_empty() { return None; }

    // Timeline: position + duration in ms (Windows stores as 100-ns units)
    let (position_ms, duration_ms) = if let Ok(tl) = session.GetTimelineProperties() {
        let pos = tl.Position().map(|d| d.Duration / 10_000).unwrap_or(0);
        let dur = tl.EndTime().map(|d| d.Duration / 10_000).unwrap_or(0);
        (pos, dur)
    } else {
        (0i64, 0i64)
    };

    Some(serde_json::json!({
        "hasMedia":    true,
        "title":       title,
        "artist":      artist,
        "album":       album,
        "status":      if is_playing { "Playing" } else { "Paused" },
        "positionMs":  position_ms,
        "durationMs":  duration_ms,
    }))
}

#[cfg(not(target_os = "windows"))]
fn get_smtc_media() -> Option<serde_json::Value> { None }


// ── Hardware Watcher: CapsLock & Volume polling thread ────────────────────────
#[cfg(target_os = "windows")]
fn start_hardware_watcher(app_handle: AppHandle) {
    thread::spawn(move || {
        let mut is_caps = unsafe { (GetKeyState(0x14) & 1) != 0 };
        let mut was_caps_down = false;
        let mut last_vol: Option<(i32, bool)> = None;
        let mut loop_count: u32 = 0;

        let mut last_title = String::new();
        let mut last_artist = String::new();
        let mut last_status = String::new();
        let mut last_has_media = false;
        let mut last_pos_ms = 0i64;
        let mut last_emit_instant = Instant::now();

        let mut prev_raw_pos_ms = 0i64;

        loop {
            // ── 1. CapsLock detection (every 30ms) ──────────────────────
            let key_down = unsafe { (GetAsyncKeyState(0x14) as u16 & 0x8000) != 0 };
            let os_caps  = unsafe { (GetKeyState(0x14) & 1) != 0 };

            if key_down && !was_caps_down {
                // Key pressed: wait briefly for OS toggle bit update
                thread::sleep(Duration::from_millis(15));
                let new_caps = unsafe { (GetKeyState(0x14) & 1) != 0 };
                is_caps = new_caps;
                let _ = app_handle.emit("capslock-change", serde_json::json!({ "active": is_caps }));
                let _ = app_handle.emit("hud-trigger", serde_json::json!({ "type": "capslock", "capsLock": is_caps }));
            } else if os_caps != is_caps {
                is_caps = os_caps;
                let _ = app_handle.emit("capslock-change", serde_json::json!({ "active": is_caps }));
                let _ = app_handle.emit("hud-trigger", serde_json::json!({ "type": "capslock", "capsLock": is_caps }));
            }
            was_caps_down = key_down;

            // ── 2. Volume detection (every ~180ms = 6 * 30ms) ───────────
            loop_count += 1;
            if loop_count % 6 == 0 {
                if let Some((lvl, muted)) = get_master_volume_windows() {
                    let rounded = lvl.round() as i32;
                    if let Some((prev_lvl, prev_mute)) = last_vol {
                        if prev_lvl != rounded || prev_mute != muted {
                            let _ = app_handle.emit("volume-update", serde_json::json!({
                                "type": "volume",
                                "level": lvl,
                                "isMuted": muted,
                            }));
                            let _ = app_handle.emit("hud-trigger", serde_json::json!({
                                "type": "volume",
                                "level": rounded,
                                "isMuted": muted,
                            }));
                        }
                    }
                    last_vol = Some((rounded, muted));
                }
            }

            // ── 3. Media session detection (every ~600ms = 20 * 30ms) ───
            if loop_count >= 20 {
                loop_count = 0;
                let maybe_info = get_smtc_media();
                let has_media = maybe_info.is_some();
                let mut payload = if let Some(ref info) = maybe_info {
                    info.clone()
                } else {
                    serde_json::json!({
                        "hasMedia": false,
                        "title": "",
                        "artist": "",
                        "album": "",
                        "status": "Paused",
                        "positionMs": 0,
                        "durationMs": 0
                    })
                };

                let title = payload.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let artist = payload.get("artist").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let status = payload.get("status").and_then(|v| v.as_str()).unwrap_or("Paused").to_string();
                let cur_pos_ms = payload.get("positionMs").and_then(|v| v.as_i64()).unwrap_or(0);

                let state_changed = title != last_title
                    || artist != last_artist
                    || status != last_status
                    || has_media != last_has_media;

                // Seek detected: only if raw SMTC position actually shifted substantially from previous reading
                let seek_detected = if !state_changed && status == "Playing" && cur_pos_ms > 0 && prev_raw_pos_ms > 0 {
                    let elapsed = last_emit_instant.elapsed().as_millis() as i64;
                    let expected = last_pos_ms + elapsed;
                    cur_pos_ms != prev_raw_pos_ms && (cur_pos_ms - expected).abs() > 3000
                } else {
                    false
                };

                prev_raw_pos_ms = cur_pos_ms;

                if state_changed || seek_detected {
                    last_title = title;
                    last_artist = artist;
                    last_status = status;
                    last_has_media = has_media;
                    last_pos_ms = cur_pos_ms;
                    last_emit_instant = Instant::now();
                    if let Some(obj) = payload.as_object_mut() {
                        obj.insert("isSeek".to_string(), serde_json::json!(seek_detected));
                    }
                    let _ = app_handle.emit("media-update", payload);
                }
            }

            thread::sleep(Duration::from_millis(30));
        }
    });
}

#[cfg(not(target_os = "windows"))]
fn start_hardware_watcher(_app_handle: AppHandle) {}

// ── Tauri Commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn update_window_bounds(
    app: AppHandle,
    mode: String,
    _tab: Option<String>,
    lyrics: Option<bool>,
    idle_mode: Option<String>,
    is_auto_hidden: Option<bool>,
) {
    if let Some(window) = app.get_webview_window("main") {
        let (width, height): (i32, i32) = if is_auto_hidden.unwrap_or(false) {
            (180, 8)
        } else if mode == "expanded" {
            let h = if lyrics.unwrap_or(false) { 360 } else { 315 };
            (490, h)
        } else if mode == "settings" {
            (490, 330)
        } else if mode == "hud" {
            (320, 55)
        } else if mode == "minimal" {
            (160, 38)
        } else if mode == "mascot" {
            (160, 55)
        } else {
            let w = if idle_mode.as_deref() == Some("player") { 330 } else { 280 };
            (w, 48)
        };

        if let Ok(Some(monitor)) = window.primary_monitor() {
            let scale = monitor.scale_factor();
            let sw    = monitor.size().width as f64 / scale;
            let x     = ((sw - width as f64) / 2.0 * scale) as i32;
            let target_w = (width as f64 * scale) as i32;
            let target_h = (height as f64 * scale) as i32;

            #[cfg(target_os = "windows")]
            {
                use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, SWP_NOACTIVATE, SWP_NOZORDER};
                if let Ok(hwnd) = window.hwnd() {
                    let hwnd_val = windows::Win32::Foundation::HWND(hwnd.0 as _);
                    unsafe {
                        let _ = SetWindowPos(
                            hwnd_val,
                            None,
                            x,
                            0,
                            target_w,
                            target_h,
                            SWP_NOACTIVATE | SWP_NOZORDER,
                        );
                    }
                }
            }

            #[cfg(not(target_os = "windows"))]
            {
                let _ = window.set_size(PhysicalSize::new(target_w as u32, target_h as u32));
                let _ = window.set_position(PhysicalPosition::new(x, 0));
            }
        }
    }
}

// Single-shot system metrics snapshot
#[tauri::command]
fn send_media_key(key: String) {
    #[cfg(target_os = "windows")]
    unsafe {
        let vk: u8 = match key.as_str() {
            "playPause"  => 0xB3,
            "next"       => 0xB0,
            "prev"       => 0xB1,
            "volumeUp"   => 0xAF,
            "volumeDown" => 0xAE,
            "mute"       => 0xAD,
            _            => 0xB3,
        };
        keybd_event(vk, 0, 0, 0);
        keybd_event(vk, 0, 2, 0);
    }
}

#[tauri::command]
fn run_quick_action(action: String) {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        match action.as_str() {
            "calculator" => {
                let _ = Command::new("calc.exe").spawn();
            }
            "snipping" => {
                unsafe {
                    keybd_event(0x5B, 0, 0, 0); // VK_LWIN
                    keybd_event(0x10, 0, 0, 0); // VK_SHIFT
                    keybd_event(0x53, 0, 0, 0); // 'S'
                    keybd_event(0x53, 0, 2, 0);
                    keybd_event(0x10, 0, 2, 0);
                    keybd_event(0x5B, 0, 2, 0);
                }
            }
            "lock" => {
                let _ = Command::new("rundll32.exe").args(["user32.dll,LockWorkStation"]).spawn();
            }
            _ => {}
        }
    }
}
#[tauri::command]
fn get_system_metrics(app: AppHandle) {
    let app2 = app.clone();
    thread::spawn(move || {
        let mut sys = System::new_all();
        sys.refresh_all();
        thread::sleep(Duration::from_millis(300));
        sys.refresh_all();
        emit_metrics(&app2, &sys);
    });
}

// Continuous system metrics polling
#[tauri::command]
fn start_system_monitor(
    app: AppHandle,
    state: tauri::State<Arc<Mutex<MonitorState>>>,
) {
    let mut st = state.lock().unwrap();
    if st.running { return; }
    st.running = true;
    drop(st);

    let state_clone = state.inner().clone();
    let app2 = app.clone();

    thread::spawn(move || {
        let mut sys = System::new_all();
        loop {
            {
                let st = state_clone.lock().unwrap();
                if !st.running { break; }
            }
            sys.refresh_all();
            emit_metrics(&app2, &sys);

            // Also emit volume with each metrics tick
            if let Some((level, muted)) = get_master_volume_windows() {
                let _ = app2.emit("volume-update", serde_json::json!({
                    "type":    "volume",
                    "level":   level,
                    "isMuted": muted,
                }));
            }

            thread::sleep(Duration::from_secs(2));
        }
    });
}

#[tauri::command]
fn stop_system_monitor(state: tauri::State<Arc<Mutex<MonitorState>>>) {
    let mut st = state.lock().unwrap();
    st.running = false;
}

// Get volume once
#[tauri::command]
fn get_volume(app: AppHandle) {
    if let Some((level, muted)) = get_master_volume_windows() {
        let _ = app.emit("volume-update", serde_json::json!({
            "type":    "volume",
            "level":   level,
            "isMuted": muted,
        }));
    }
}

// Start media monitor polling
#[tauri::command]
fn start_media_monitor(
    app: AppHandle,
    state: tauri::State<Arc<Mutex<MediaMonitorState>>>,
) {
    let mut st = state.lock().unwrap();
    if st.running { return; }
    st.running = true;
    drop(st);

    let state_clone = state.inner().clone();
    let app2 = app.clone();

    thread::spawn(move || {
        let mut last_title = String::new();
        loop {
            {
                let st = state_clone.lock().unwrap();
                if !st.running { break; }
            }

            let payload = if let Some(info) = get_smtc_media() {
                // Only emit if something changed
                let title = info["title"].as_str().unwrap_or("").to_string();
                if title != last_title {
                    last_title = title;
                }
                info
            } else {
                last_title.clear();
                serde_json::json!({ "hasMedia": false, "title": "", "artist": "", "album": "", "status": "Paused" })
            };

            let _ = app2.emit("media-update", payload);
            thread::sleep(Duration::from_secs(1));
        }
    });
}

#[tauri::command]
fn stop_media_monitor(state: tauri::State<Arc<Mutex<MediaMonitorState>>>) {
    let mut st = state.lock().unwrap();
    st.running = false;
}

// ── Internal helpers ──────────────────────────────────────────────────────────
fn emit_metrics(app: &AppHandle, sys: &System) {
    let cpu_usage    = sys.global_cpu_usage();
    let total_mem    = sys.total_memory();
    let used_mem     = sys.used_memory();
    let ram_pct      = if total_mem > 0 {
        (used_mem as f64 / total_mem as f64 * 100.0) as f32
    } else { 0.0 };
    let ram_used_gb  = used_mem  as f64 / 1_073_741_824.0;
    let ram_total_gb = total_mem as f64 / 1_073_741_824.0;

    let _ = app.emit("system-metrics", serde_json::json!({
        "cpu":      cpu_usage,
        "ram":      ram_pct,
        "ramUsed":  ram_used_gb,
        "ramTotal": ram_total_gb,
        "gpu":      0.0,
        "gpuTemp":  0,
    }));
}

// ── App entry point ───────────────────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let monitor_state: Arc<Mutex<MonitorState>> =
        Arc::new(Mutex::new(MonitorState { running: false }));
    let media_state: Arc<Mutex<MediaMonitorState>> =
        Arc::new(Mutex::new(MediaMonitorState { running: false }));

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(monitor_state)
        .manage(media_state)
        .invoke_handler(tauri::generate_handler![
            update_window_bounds,
            get_system_metrics,
            start_system_monitor,
            stop_system_monitor,
            get_volume,
            start_media_monitor,
            stop_media_monitor,
            send_media_key,
            run_quick_action,
        ])
        .setup(|app| {
            // ── Start global hardware watcher (CapsLock & Master Volume) ──
            start_hardware_watcher(app.handle().clone());

            // ── Center window at top ──────────────────────────────────────
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let scale = monitor.scale_factor();
                    let sw    = monitor.size().width as f64 / scale;
                    let x     = ((sw - 280.0) / 2.0 * scale) as i32;
                    let _ = window.set_size(PhysicalSize::new(
                        (280.0 * scale) as u32,
                        (48.0  * scale) as u32,
                    ));
                    let _ = window.set_position(PhysicalPosition::new(x, 0));
                }
            }

            // ── System Tray ───────────────────────────────────────────────
            let show_item     = MenuItem::with_id(app, "show",     "Show Notch",  true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "⚙  Settings", true, None::<&str>)?;
            let separator     = PredefinedMenuItem::separator(app)?;
            let quit_item     = MenuItem::with_id(app, "quit",     "Quit",        true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_item, &settings_item, &separator, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Windows Dynamic Notch")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "settings" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.eval("window.__openSettings && window.__openSettings()");
                        }
                    }
                    "quit" => { app.exit(0); }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

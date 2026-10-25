use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

#[tauri::command]
fn update_window_bounds(
    app: AppHandle,
    mode: String,
    tab: Option<String>,
    lyrics: Option<bool>,
    idle_mode: Option<String>,
    is_auto_hidden: Option<bool>,
) {
    if let Some(window) = app.get_webview_window("main") {
        let (width, height): (i32, i32) = if is_auto_hidden.unwrap_or(false) {
            (180, 8)
        } else if mode == "expanded" {
            let h = match tab.as_deref() {
                Some("music") => if lyrics.unwrap_or(false) { 350 } else { 215 },
                Some("produk") => 265,
                Some("prayer") => 280,
                Some("system") => 255,
                Some("shelf") => 275,
                _ => 265,
            };
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
            let scale_factor = monitor.scale_factor();
            let screen_w = monitor.size().width as f64 / scale_factor;
            let x = ((screen_w - width as f64) / 2.0 * scale_factor) as i32;

            let _ = window.set_size(PhysicalSize::new(
                (width as f64 * scale_factor) as u32,
                (height as f64 * scale_factor) as u32,
            ));
            let _ = window.set_position(PhysicalPosition::new(x, 0));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![update_window_bounds])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let scale_factor = monitor.scale_factor();
                    let screen_w = monitor.size().width as f64 / scale_factor;
                    let x = ((screen_w - 280.0) / 2.0 * scale_factor) as i32;
                    let _ = window.set_size(PhysicalSize::new(
                        (280.0 * scale_factor) as u32,
                        (48.0 * scale_factor) as u32,
                    ));
                    let _ = window.set_position(PhysicalPosition::new(x, 0));
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

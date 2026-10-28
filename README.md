# 🪟 SNOTCH

<p align="center">
  <img src="src-tauri/icons/icon.png" width="96" height="96" alt="SNOTCH Logo" />
</p>

<p align="center">
  <strong>Dynamic Island & Mac Notch Experience for Windows 10 & 11</strong><br />
  Aplikasi desktop melayang (overlay) modern dengan estetika Glassmorphism & Solid ultra-smooth yang menghadirkan pengalaman Dynamic Island macOS langsung ke layar Windows Anda.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Framework-Tauri%20v2%20%2B%20Rust-FFC131?logo=tauri&logoColor=black" alt="Tauri" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Installer-NSIS%202.2%20MB-success" alt="Installer Size" />
  <img src="https://img.shields.io/badge/License-ISC-green" alt="License" />
</p>

---

## ✨ Fitur Utama

### 1. 🏝️ Dynamic Island Pill & Multi-Mode
- **Island Jam & Tanggal (Default)**: Pill minimalis elegan yang menampilkan live digital clock (`HH:mm:ss`) beserta tanggal, indikator baterai, dan status sistem.
- **Mini Player Switcher**: Klik ikon musik pada pill untuk beralih antara tampilan jam dan mini music controller tanpa membuka menu besar.
- **Minimal Strip**: Mode garis tipis ultra-ringan yang tersembunyi manis di atas bezel monitor.
- **Mascot Mode**: Animasi mata interaktif yang merespons status audio yang sedang diputar.

### 2. 🎛️ Hardware HUD (Otomatis Muncul)
- **Volume & Mute Overlay**: Notifikasi visual meluncur dari notch saat volume master Windows dinaikkan atau diturunkan.
- **CapsLock Indicator**: Menampilkan status CapsLock ON/OFF secara otomatis dan instan dari notch, bahkan saat notch sedang tersembunyi (*auto-hidden*).

### 3. 🚀 Expanded Hub (Pusat Produktivitas Terpadu)
Arahkan kursor atau klik notch untuk membuka hub lengkap dengan tab navigasi:
- 🎵 **Musik, Seekbar Interaktif & Live Karaoke Lyrics**:
  - Sinkronisasi real-time Windows SMTC (Spotify, YouTube, browser, media player) tanpa lag dan tanpa jitter.
  - Seekbar interaktif: mendukung **klik** dan **drag/scrubbing** dengan live timestamp preview.
  - Karaoke live lyrics dengan penyorotan kalimat aktif dan fitur klik lirik untuk langsung melompatkan musik ke detik tersebut.
- 🍅 **Produktivitas & Fokus**:
  - **Pomodoro Timer**: Presets 25/5, 50/10, atau custom dengan audio chime lembut saat sesi selesai.
  - **Water Reminder**: Pelacak hidrasi harian dengan quick add (+250ml, +500ml) dan progress bar.
  - **To-Do List**: Checklist tugas harian cepat yang tersimpan secara lokal.
- 🕌 **Jadwal Sholat & Countdown**:
  - Penanda waktu sholat harian terintegrasi otomatis.
  - **Highlight Ganda**: Hijau emerald untuk waktu saat ini dan oranye amber dengan countdown live menuju waktu sholat berikutnya.
- ⛅ **Widget Cuaca**: Informasi prakiraan cuaca, suhu, kelembaban, dan kondisi langit secara real-time.
- 📅 **Kalender & Agenda Harian**:
  - Grid kalender bulanan lengkap dengan penanggalan bahasa Indonesia, indikator tanggal hari ini, dan navigasi bulan cepat.
  - Catatan agenda harian per tanggal tersimpan persisten secara lokal (*localStorage*).
- 📁 **File Shelf**: Rak file sementara berbasis drag & drop untuk menyimpan file penting saat multitasking.

### 4. 🎨 Personalisasi Tema & Permukaan (Surface)
- **Pilihan Tema**:
  - **Midnight (Default)**: Gelap elegan dengan nuansa hitam pekat dan aksen neon cyan.
  - **Dark Graphite**: Nuansa gelap bernuansa abu-abu arang modern (`#2d2d2d`).
- **Pilihan Gaya Permukaan**:
  - **Glass (Frosted Glassmorphism)**: Tembus pandang dengan efek blur latar belakang 24px.
  - **Solid Mode**: Tampilan warna solid pekat yang nyaman di mata tanpa efek blur tembus.

### 5. 🎯 Smart Dwell & Click-Through Cerdas
- **Anti-Accident Dwell Trigger (120ms)**: Notch tidak akan terbuka secara tidak sengaja saat kursor hanya melintas sekilas di atas tab browser.
- **Dynamic OS Window Bounds**: Jendela Tauri otomatis menyesuaikan ukuran aslinya (*bounds*) mengikuti mode:
  - Mode Jam: hanya 280 x 48 px.
  - Mode Expanded: membesar dinamis (490 x 215–360 px).
  - Mode Tersembunyi: hanya 180 x 8 px.
  - **Hasil**: Area di bawah dan di samping notch 100% tembus klik (*native click-through*) ke tab browser dan aplikasi di belakangnya tanpa ada area transparan yang memblokir.
- **Garis Indikator Penanda (*Home Bar Indicator*)**: Garis tipis transparan (64px x 3px) di tepi atas monitor yang memberi petunjuk posisi notch saat sedang *auto-hide*.
- **Fullscreen Auto-Detection**: Notch otomatis menyembunyikan diri saat Anda menonton video YouTube full screen atau bermain game agar tidak menutupi tampilan.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Desktop Runtime** | [Tauri v2](https://tauri.app/) (Rust) | Frameless, transparent, ultra-ringan (~25–40MB RAM), native WebView2. |
| **Frontend UI** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Reactivity tinggi dengan HMR super cepat dan Lucide Icons. |
| **Styling** | Vanilla CSS Glassmorphism & Solid | CSS Variables dinamis, backdrop-filter blur 24px, dan spring physics cubic-bezier. |
| **Windows Integration** | Native Win32 & WinRT Rust | Deteksi hardware instan (Core Audio Master Volume, CapsLock hook, WinRT SMTC media session & seek API). |
| **Audio Notification** | Web Audio API Oscillator | Chime pengingat lembut sintetis tanpa memerlukan aset audio eksternal. |

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- Sistem Operasi: **Windows 10 / 11** (64-bit)
- **Node.js**: versi 18.x atau lebih baru
- **Rust toolchain** (cargo): untuk kompilasi backend Tauri

### Instalasi & Pengembangan

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/username/notch-for-windows.git
   cd notch-for-windows
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan dalam mode pengembangan (Dev Mode)**:
   ```bash
   npm run dev
   ```
   *Perintah ini akan menjalankan Vite frontend dan meluncurkan aplikasi SNOTCH desktop secara live dengan Hot Reload.*

4. **Build Aplikasi Rilis (Installer .exe)**:
   ```bash
   npm run build:app
   ```
   *Menghasilkan setup installer NSIS di:*
   `src-tauri/target/release/bundle/nsis/SNOTCH_1.0.0_x64-setup.exe` (~2.2 MB)

---

## 📁 Struktur Direktori

```text
notch-for-windows/
├── src-tauri/
│   ├── src/lib.rs            # Rust backend (Win32 Core Audio, WinRT SMTC seek & controls, CapsLock, Tray)
│   ├── tauri.conf.json       # Konfigurasi Tauri v2 (window bounds, transparent, app id SNOTCH)
│   └── Cargo.toml            # Dependensi Rust (sysinfo, windows crate)
├── src/
│   ├── components/
│   │   ├── IdlePill.jsx      # Compact island pill (Clock & Mini-Player)
│   │   ├── MediaCompact.jsx  # Mini-player view pada pill
│   │   ├── ExpandedHub.jsx   # Expanded hub dengan navigasi tab & scrubber
│   │   ├── HardwareHUD.jsx   # HUD pop-up volume & capslock
│   │   ├── PomodoroTimer.jsx # Focus timer
│   │   ├── WaterReminder.jsx # Hydration tracker
│   │   ├── TodoList.jsx      # Checklist tugas harian
│   │   ├── PrayerTimes.jsx   # Jadwal sholat & dual countdown
│   │   ├── WeatherWidget.jsx # Prakiraan cuaca real-time
│   │   ├── CalendarWidget.jsx# Kalender bulanan & catatan agenda lokal
│   │   ├── SyncedLyrics.jsx  # Panel karaoke lirik tersinkronisasi
│   │   ├── FileShelf.jsx     # Quick drag & drop file storage
│   │   └── SettingsPanel.jsx # Pengaturan preferensi notch, tema, & surface
│   ├── App.jsx               # Main controller, state management, & hover logic
│   ├── tauriBridge.js        # Jembatan komunikasi React ke Tauri Rust invoke & events
│   ├── index.css             # Glassmorphism/Solid themes styling & transitions
│   └── main.jsx              # React DOM entrypoint
├── package.json
└── README.md
```

---

## ⚙️ Pengaturan & Kustomisasi

Buka **Settings Panel** lewat Expanded Hub (klik ikon roda gigi ⚙️) untuk menyesuaikan:
- **Tema Warna**: Pilih antara tema **Midnight** atau **Graphite** (`#2d2d2d`).
- **Gaya Permukaan**: Pilih tampilan **Glass** (transparan blur) atau **Solid**.
- **Tampilan Default**: Pilih antara Mode Jam (*Default*), Mascot, atau Minimal Strip.
- **Perilaku Auto-Hide**: Nyalakan atau matikan mode auto-hide otomatis.
- **Sembunyikan saat Fullscreen**: Otomatis sembunyikan notch saat aplikasi/game berjalan layar penuh.
- **Suara Chime**: Aktifkan atau nonaktifkan audio reminder untuk Pomodoro dan Jadwal Sholat.

---

## 💡 Pintasan & Tips Penggunaan

- **Membuka Notch**: Dekatkan kursor ke garis penanda di tengah atas layar monitor.
- **Pin Notch**: Klik ikon Pin 📌 pada header expanded agar notch tetap terbuka saat bekerja.
- **Ganti Mode Jam / Musik**: Klik ikon 🎵 di sebelah kiri pill jam untuk beralih ke mini player.
- **Seek Musik**: Pada tab Musik, klik atau seret progress bar untuk berpindah detik lagu, atau klik salah satu baris lirik karaoke.
- **Keluar Aplikasi**: Klik kanan ikon SNOTCH di **System Tray Windows** (dekat jam taskbar) lalu pilih **Keluar**, atau melalui menu pengaturan di notch.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [ISC License](LICENSE).  
Dikembangkan untuk menghadirkan pengalaman desktop Windows yang lebih elegan, produktif, dan menyenangkan.

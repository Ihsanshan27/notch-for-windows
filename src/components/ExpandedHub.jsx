import React, { useState, useEffect } from 'react';
import {
  Music, Flame, Compass, Cpu, Folder,
  Pin, PinOff, Settings, X,
  SkipBack, SkipForward, Play, Pause, Disc3,
  AlignLeft, Volume2, VolumeX, Volume1, Zap, Battery,
  Clock, Calendar
} from 'lucide-react';
import SyncedLyrics from './SyncedLyrics';

const DAYS_ID   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function ExpandedHub({
  activeTab, setActiveTab,
  media, onTogglePlay, onNext, onPrev,
  onClose,
  isPinned, onTogglePin,
  batteryLevel, isCharging,
  onOpenSettings,
  progress,          // 0-100
  progressSec,       // elapsed seconds
  onSeek,
  volume = 65,
  onChangeVolume,
  children,
  showLyrics,
  onToggleLyrics,
}) {
  const isPlaying = media?.status === 'Playing';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const day = DAYS_ID[now.getDay()];
  const dd  = now.getDate();
  const mon = MONTHS_ID[now.getMonth()];

  const TABS = [
    { id: 'music',  label: 'Musik',  icon: Music   },
    { id: 'produk', label: 'Fokus',  icon: Flame   },
    { id: 'prayer', label: 'Sholat', icon: Compass },
    { id: 'system', label: 'Sistem', icon: Cpu     },
    { id: 'shelf',  label: 'Shelf',  icon: Folder  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
      {/* ── Top Nav: Tabs + Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div className="tab-bar" style={{ flex: 1, marginBottom: 0, borderBottom: 'none', paddingBottom: 0, gap: 2 }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                className={`tab-btn${isActive ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={12} color={isActive ? 'var(--cyan)' : 'var(--text-2)'} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
          <button
            className="btn"
            onClick={onTogglePin}
            style={{ padding: 4 }}
            title={isPinned ? 'Lepas Pin (Auto-Minimize)' : 'Pin Notch (Tetap Buka)'}
          >
            {isPinned ? <Pin size={12} color="var(--green)" /> : <PinOff size={12} color="var(--text-2)" />}
          </button>
          <button
            className="btn"
            onClick={onOpenSettings}
            style={{ padding: 4 }}
            title="Pengaturan"
          >
            <Settings size={12} color="var(--text-2)" />
          </button>
          <button
            className="btn"
            onClick={onClose}
            style={{ padding: 4 }}
            title="Tutup"
          >
            <X size={12} color="var(--text-2)" />
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'var(--border-glass)', flexShrink: 0, margin: '2px 0 4px 0' }} />

      {/* ── Content: Music Tab ── */}
      {activeTab === 'music' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {/* Track info + Lyric toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)'
            }}>
              <Disc3
                size={18}
                color="var(--cyan)"
                style={{ animation: isPlaying ? 'spin 8s linear infinite' : 'none' }}
              />
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {media?.title || 'Tidak ada media'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {media?.artist || 'Windows Media Player'}{media?.album ? ` • ${media.album}` : ''}
              </div>
            </div>

            {/* Clock & Date indicator */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '3px 8px',
              borderRadius: 8,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: 'var(--text-1)' }}>
                <Clock size={11} color="var(--cyan)" />
                <span>{hh}:{mm}</span>
                <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>:{ss}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8.5, fontWeight: 600, color: 'var(--text-2)' }}>
                <Calendar size={9} color="var(--purple)" />
                <span>{day}, {dd} {mon}</span>
              </div>
            </div>

            {/* Lyric Toggle button */}
            <button
              className="btn"
              onClick={onToggleLyrics}
              style={{
                padding: '3px 7px',
                borderRadius: 7,
                background: showLyrics ? 'rgba(100,210,255,.15)' : 'rgba(255,255,255,.05)',
                border: showLyrics ? '1px solid rgba(100,210,255,.3)' : '1px solid transparent',
              }}
              title={showLyrics ? 'Sembunyikan Lirik' : 'Tampilkan Lirik Karaoke'}
            >
              <AlignLeft size={12} color={showLyrics ? 'var(--cyan)' : 'var(--text-2)'} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="progress-track" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek?.(pct * 240);
          }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Controls + Volume Slider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 }}>
            {/* Volume controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button
                className="btn"
                onClick={() => onChangeVolume(volume === 0 ? 50 : 0)}
                style={{ padding: 2 }}
                title="Mute/Unmute"
              >
                {volume === 0 ? <VolumeX size={12} color="var(--red)" /> : <Volume1 size={12} color="var(--text-2)" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="volume-slider"
                title={`Volume: ${volume}%`}
              />
            </div>

            {/* Playback buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn" onClick={onPrev} title="Sebelumnya">
                <SkipBack size={13} fill="var(--text-1)" color="var(--text-1)" />
              </button>
              <button
                className="btn primary"
                onClick={onTogglePlay}
                style={{ borderRadius: 50, padding: 6 }}
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying
                  ? <Pause size={13} fill="#000" color="#000" />
                  : <Play  size={13} fill="#000" color="#000" />}
              </button>
              <button className="btn" onClick={onNext} title="Selanjutnya">
                <SkipForward size={13} fill="var(--text-1)" color="var(--text-1)" />
              </button>
            </div>

            {/* Battery status mini */}
            <div style={{ fontSize: 9.5, color: isCharging ? 'var(--green)' : 'var(--text-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
              {isCharging ? <Zap size={10} fill="var(--green)" color="var(--green)" /> : <Battery size={11} />}
              <span>{batteryLevel}%</span>
            </div>
          </div>

          {/* Karaoke Synced Lyrics */}
          {showLyrics && (
            <SyncedLyrics
              title={media?.title}
              artist={media?.artist}
              isPlaying={isPlaying}
              progressSeconds={progressSec}
              onSeek={onSeek}
            />
          )}
        </div>
      )}

      {/* ── Content: Non-Music Tabs ── */}
      {activeTab !== 'music' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      )}
    </div>
  );
}

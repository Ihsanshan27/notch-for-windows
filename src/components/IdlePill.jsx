import React, { useState, useEffect } from 'react';
import { Zap, Battery, Music2, Clock, Play, Pause } from 'lucide-react';

const DAYS_ID   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function IdlePill({ batteryLevel, isCharging, media, onTogglePlay, idleMode = 'clock', onToggleIdleMode }) {
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

  const isPlaying = media?.status === 'Playing';
  const hasMedia  = Boolean(media?.hasMedia && (media?.title || media?.artist));

  // Mode: 'clock' | 'player'
  const showPlayer = idleMode === 'player';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 4px', gap: 6 }}>

      {/* ── Mode Toggle Button (Clock <-> Player) ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleIdleMode?.(); }}
        title={showPlayer ? 'Beralih ke Jam' : 'Beralih ke Mini Player'}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          cursor: 'pointer',
          padding: '2px 5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: showPlayer ? 'var(--cyan)' : 'var(--text-2)',
          transition: 'all .2s ease',
          flexShrink: 0,
        }}
      >
        {showPlayer ? <Clock size={11} /> : <Music2 size={11} />}
      </button>

      {/* ── Clock Mode (DEFAULT) ── */}
      {!showPlayer && (
        <>
          {/* Camera sensor dot */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#111', border: '1.5px solid #2a2a34',
                        position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 1, left: 1, width: 3.5, height: 3.5,
                          borderRadius: '50%', background: 'var(--green)', opacity: .85 }}/>
          </div>

          {/* Clock + Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: .5, lineHeight: 1 }}>
              {hh}:{mm}
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', marginLeft: 3 }}>:{ss}</span>
            </div>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-2)', letterSpacing: .2 }}>
              {day}, {dd} {mon}
            </div>
          </div>

          {/* Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                        color: isCharging ? 'var(--green)' : batteryLevel <= 20 ? 'var(--red)' : 'var(--text-2)' }}>
            <span>{batteryLevel}%</span>
            {isCharging ? <Zap size={11} color="var(--green)" fill="var(--green)"/> : <Battery size={12}/>}
          </div>
        </>
      )}

      {/* ── Mini Player Mode ── */}
      {showPlayer && (
        <>
          {/* Audio wave */}
          <div className="audio-wave" style={{ flexShrink: 0 }}>
            <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`}/>
            <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`}/>
            <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`}/>
            <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`}/>
          </div>

          {/* Track info */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: '0 4px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: hasMedia ? 'var(--text-1)' : 'var(--text-3)' }}>
              {hasMedia ? media.title : 'Tidak ada lagu'}
            </div>
            <div style={{ fontSize: 8.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hasMedia ? (media.artist || 'Windows Media') : 'Windows Audio'}
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePlay?.(); }}
            title={isPlaying ? 'Jeda' : 'Putar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: 'var(--text-1)', flexShrink: 0,
              display: 'flex', alignItems: 'center'
            }}
          >
            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          </button>

          {/* Clock mini */}
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-2)', flexShrink: 0, letterSpacing: .3, marginLeft: 2 }}>
            {hh}:{mm}
          </div>
        </>
      )}
    </div>
  );
}

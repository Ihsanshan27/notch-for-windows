import React from 'react';
import { Volume2, VolumeX, Volume1, CaseSensitive } from 'lucide-react';

export default function HardwareHUD({ type = 'volume', level = 60, isMuted = false, capsLock = null }) {

  if (type === 'capslock') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '0 6px',
        animation: 'hudSlideIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CaseSensitive size={14} color="var(--orange)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: .4 }}>
            Caps Lock
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: capsLock ? 'rgba(255,159,10,.15)' : 'rgba(255,255,255,.06)',
          border: capsLock ? '1px solid rgba(255,159,10,.35)' : '1px solid rgba(255,255,255,.1)',
          borderRadius: 8, padding: '3px 8px',
          transition: 'all .3s ease',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: capsLock ? 'var(--orange)' : 'var(--text-3)',
            boxShadow: capsLock ? '0 0 8px 2px rgba(255,159,10,.6)' : 'none',
            transition: 'all .3s ease',
          }} />
          <span style={{
            fontSize: 12, fontWeight: 800,
            color: capsLock ? 'var(--orange)' : 'var(--text-3)',
            transition: 'color .3s ease',
          }}>
            {capsLock ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    );
  }

  // Volume HUD
  const val = isMuted ? 0 : Math.min(100, Math.max(0, level));
  const Icon = isMuted || val === 0 ? VolumeX : val < 50 ? Volume1 : Volume2;
  const color = isMuted ? 'var(--red)' : 'var(--cyan)';
  const barColor = isMuted
    ? 'linear-gradient(90deg, var(--red), #ff6b63)'
    : 'linear-gradient(90deg, var(--cyan), var(--blue))';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '0 6px',
      animation: 'hudSlideIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards',
    }}>
      <Icon size={15} color={color} style={{ flexShrink: 0 }} />

      {/* Track */}
      <div style={{
        flex: 1, height: 6,
        background: 'rgba(255,255,255,.10)',
        borderRadius: 4, overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Glow fill */}
        <div style={{
          width: `${val}%`, height: '100%',
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.18s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isMuted ? 'none' : `0 0 8px rgba(100,210,255,.45)`,
        }} />
      </div>

      <div style={{
        fontSize: 12, fontWeight: 800, minWidth: 34, textAlign: 'right',
        color: isMuted ? 'var(--red)' : 'var(--text-1)',
      }}>
        {isMuted ? 'Mute' : `${Math.round(level)}%`}
      </div>
    </div>
  );
}

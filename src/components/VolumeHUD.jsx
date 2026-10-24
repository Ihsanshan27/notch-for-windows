import React from 'react';
import { Volume2, VolumeX, Sun } from 'lucide-react';

export default function VolumeHUD({ type = 'volume', level = 60, isMuted = false }) {
  const isBrightness = type === 'brightness';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '12px',
        padding: '0 4px',
      }}
    >
      {/* Icon */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isBrightness ? (
          <Sun size={15} color="#ffd60a" />
        ) : isMuted ? (
          <VolumeX size={15} color="#ff453a" />
        ) : (
          <Volume2 size={15} color="#64d2ff" />
        )}
      </div>

      {/* Progress Track */}
      <div
        className="progress-track"
        style={{
          flex: 1,
          height: '6px',
          background: 'rgba(255, 255, 255, 0.14)',
          borderRadius: '4px',
        }}
      >
        <div
          className="progress-fill"
          style={{
            width: `${isMuted ? 0 : Math.min(100, Math.max(0, level))}%`,
            background: isBrightness
              ? 'linear-gradient(90deg, #ffd60a, #ff9f0a)'
              : isMuted
              ? '#ff453a'
              : 'linear-gradient(90deg, #64d2ff, #0a84ff)',
          }}
        />
      </div>

      {/* Percentage */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#f5f5f7',
          minWidth: '28px',
          textAlign: 'right',
        }}
      >
        {isMuted ? 'Mute' : `${Math.round(level)}%`}
      </div>
    </div>
  );
}

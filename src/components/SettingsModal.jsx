import React from 'react';
import { X, Check, Power, Volume2, Music, Monitor, EyeOff, Pin } from 'lucide-react';

export default function SettingsModal({
  settings,
  onUpdateSettings,
  onClose,
  onTestHUD,
  onToggleSimulatedMusic,
  isSimulatedMusic,
  onQuitApp,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        padding: '4px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
          Pengaturan Notch
        </span>
        <button className="control-btn" onClick={onClose} style={{ padding: '4px' }}>
          <X size={14} color="#86868b" />
        </button>
      </div>

      {/* Toggles Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          margin: '6px 0',
        }}
      >
        {/* Auto-Hide on Fullscreen */}
        <div
          onClick={() =>
            onUpdateSettings({ autoHideFullscreen: !settings.autoHideFullscreen })
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '6px 10px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#f5f5f7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Monitor size={13} color="#64d2ff" />
            <span>Hide saat Fullscreen</span>
          </div>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '4px',
              background: settings.autoHideFullscreen ? '#30d158' : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {settings.autoHideFullscreen && <Check size={11} color="#000" strokeWidth={3} />}
          </div>
        </div>

        {/* Pin Always on Top */}
        <div
          onClick={() => onUpdateSettings({ alwaysOnTop: !settings.alwaysOnTop })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '6px 10px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#f5f5f7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Pin size={13} color="#ffd60a" />
            <span>Always on Top (Pin)</span>
          </div>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '4px',
              background: settings.alwaysOnTop ? '#30d158' : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {settings.alwaysOnTop && <Check size={11} color="#000" strokeWidth={3} />}
          </div>
        </div>
      </div>

      {/* Action / Test Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '6px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onTestHUD}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#f5f5f7',
              fontSize: '10px',
              fontWeight: '600',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Volume2 size={12} color="#64d2ff" />
            Tes HUD
          </button>
          <button
            onClick={onToggleSimulatedMusic}
            style={{
              background: isSimulatedMusic
                ? 'rgba(48, 209, 88, 0.2)'
                : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: isSimulatedMusic ? '#30d158' : '#f5f5f7',
              fontSize: '10px',
              fontWeight: '600',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Music size={12} />
            {isSimulatedMusic ? 'Musik Demo ON' : 'Tes Musik Demo'}
          </button>
        </div>

        <button
          onClick={onQuitApp}
          style={{
            background: 'rgba(255, 69, 58, 0.15)',
            border: 'none',
            borderRadius: '8px',
            color: '#ff453a',
            fontSize: '10px',
            fontWeight: '600',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <Power size={11} />
          Keluar
        </button>
      </div>
    </div>
  );
}

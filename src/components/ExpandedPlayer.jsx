import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
  FolderDown,
  Pin,
  PinOff,
  X,
  Disc3,
  Zap,
  Battery,
} from 'lucide-react';

export default function ExpandedPlayer({
  media,
  onTogglePlay,
  onNext,
  onPrev,
  onClose,
  onOpenSettings,
  onToggleShelf,
  isPinned,
  onTogglePin,
  batteryLevel,
  isCharging,
}) {
  const isPlaying = media.status === 'Playing';
  const [progress, setProgress] = useState(38); // 38% for demo scrub

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        padding: '2px 4px',
      }}
    >
      {/* Top Header: Album Art & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {/* Album Cover Art */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1f1f2e 0%, #3a3a52 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              flexShrink: 0,
            }}
          >
            <Disc3
              size={24}
              color="#64d2ff"
              style={{
                animation: isPlaying ? 'spin 8s linear infinite' : 'none',
              }}
            />
          </div>

          {/* Titles */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: '700',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '260px',
              }}
            >
              {media.title || 'Bohemian Rhapsody'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '500',
                color: '#86868b',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '260px',
              }}
            >
              {media.artist || 'Queen'} • {media.album || 'A Night at the Opera'}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          className="control-btn"
          onClick={onClose}
          title="Tutup Kartu"
          style={{ padding: '6px' }}
        >
          <X size={15} color="#86868b" />
        </button>
      </div>

      {/* Progress Track */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
        <div
          className="progress-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setProgress(Math.round(clickPos * 100));
          }}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9.5px',
            color: '#86868b',
            fontWeight: '600',
          }}
        >
          <span>01:45</span>
          <span>04:12</span>
        </div>
      </div>

      {/* Playback Controls & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left Toggles: Shelf & Pin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="control-btn"
            onClick={onToggleShelf}
            title="Buka Quick Shelf (Drop file)"
          >
            <FolderDown size={14} color="#64d2ff" />
          </button>
          <button
            className="control-btn"
            onClick={onTogglePin}
            title={isPinned ? 'Lepas Pin Notch' : 'Pin Selalu Tampil'}
          >
            {isPinned ? <Pin size={14} color="#30d158" /> : <PinOff size={14} color="#86868b" />}
          </button>
        </div>

        {/* Center Media Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="control-btn" onClick={onPrev} title="Lagu Sebelumnya">
            <SkipBack size={15} fill="#f5f5f7" color="#f5f5f7" />
          </button>
          <button
            className="control-btn primary"
            onClick={onTogglePlay}
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause size={16} fill="#000000" color="#000000" />
            ) : (
              <Play size={16} fill="#000000" color="#000000" />
            )}
          </button>
          <button className="control-btn" onClick={onNext} title="Lagu Berikutnya">
            <SkipForward size={15} fill="#f5f5f7" color="#f5f5f7" />
          </button>
        </div>

        {/* Right Settings & Battery Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10.5px',
              fontWeight: '600',
              color: isCharging ? '#30d158' : '#86868b',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '3px 7px',
              borderRadius: '8px',
            }}
          >
            {isCharging ? <Zap size={11} color="#30d158" fill="#30d158" /> : <Battery size={12} />}
            <span>{batteryLevel}%</span>
          </div>

          <button
            className="control-btn"
            onClick={onOpenSettings}
            title="Pengaturan Notch"
          >
            <Settings size={14} color="#86868b" />
          </button>
        </div>
      </div>
    </div>
  );
}

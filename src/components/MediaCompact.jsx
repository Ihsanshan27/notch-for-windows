import React from 'react';
import { Play, Pause } from 'lucide-react';

export default function MediaCompact({ media, onTogglePlay }) {
  const isPlaying = media.status === 'Playing';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 4px',
        gap: '10px',
      }}
    >
      {/* Audio Visualizer Wave */}
      <div className="audio-wave">
        <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`} />
        <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`} />
        <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`} />
        <div className={`audio-bar ${!isPlaying ? 'paused' : ''}`} />
      </div>

      {/* Song Title & Artist */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: '600',
            color: '#ffffff',
            maxWidth: '180px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {media.title || 'Playing Audio'}
        </div>
        <div
          style={{
            fontSize: '9.5px',
            fontWeight: '500',
            color: '#86868b',
            maxWidth: '180px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {media.artist || 'Windows Media'}
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        className="control-btn"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        style={{ padding: '4px' }}
      >
        {isPlaying ? (
          <Pause size={12} fill="#ffffff" color="#ffffff" />
        ) : (
          <Play size={12} fill="#ffffff" color="#ffffff" />
        )}
      </button>
    </div>
  );
}

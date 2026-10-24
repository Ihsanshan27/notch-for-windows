import React from 'react';
import { Play, Pause, RotateCcw, Flame, Coffee } from 'lucide-react';

export const PRESETS = [
  { label: '25/5', work: 25, rest: 5 },
  { label: '50/10', work: 50, rest: 10 },
  { label: '15/3',  work: 15, rest: 3  },
];

export default function PomodoroTimer({
  timerState,
  onToggle,
  onReset,
  onChangePreset,
}) {
  const { running, phase, remaining, presetIdx, sessions, total } = timerState;
  const currentPreset = PRESETS[presetIdx] || PRESETS[0];

  const pct = total > 0 ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100)) : 0;
  const min = String(Math.floor(remaining / 60)).padStart(2, '0');
  const sec = String(remaining % 60).padStart(2, '0');

  const r = 36;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center', width:'100%' }}>
      {/* Preset pills */}
      <div style={{ display:'flex', gap:5 }}>
        {PRESETS.map((p, i) => {
          const isActive = i === presetIdx;
          return (
            <button
              key={p.label}
              onClick={() => onChangePreset(i)}
              style={{
                background: isActive ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)',
                border: isActive ? '1px solid rgba(255,255,255,.18)' : '1px solid transparent',
                borderRadius: 7,
                color: isActive ? '#fff' : 'var(--text-2)',
                padding: '2px 8px',
                fontSize: 9.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .16s ease',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* SVG Ring & Countdown */}
      <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', width:84, height:84 }}>
        <svg width={84} height={84} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={42} cy={42} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={4}/>
          <circle
            cx={42} cy={42} r={r} fill="none"
            stroke={phase === 'work' ? 'var(--purple)' : 'var(--green)'}
            strokeWidth={4} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: running ? 'stroke-dashoffset 0.9s linear' : 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>

        <div style={{ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 }}>{min}:{sec}</span>
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            color: phase === 'work' ? 'var(--purple)' : 'var(--green)',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            {phase === 'work' ? <Flame size={8}/> : <Coffee size={8}/>}
            {phase === 'work' ? 'Fokus' : 'Istirahat'}
          </span>
        </div>
      </div>

      {/* Controls & Sessions Counter */}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button className="btn" onClick={onReset} title="Reset Timer" style={{ padding: 4 }}>
          <RotateCcw size={13} color="var(--text-2)"/>
        </button>

        <button
          className="btn primary"
          onClick={onToggle}
          style={{ borderRadius: 50, padding: 6 }}
        >
          {running
            ? <Pause size={14} fill="#000" color="#000"/>
            : <Play  size={14} fill="#000" color="#000"/>}
        </button>

        <span style={{ fontSize: 9.5, color: 'var(--text-2)', fontWeight: 600 }}>
          Sesi: <b style={{ color: '#fff' }}>{sessions}</b>
        </span>
      </div>
    </div>
  );
}

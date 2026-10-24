import React from 'react';
import { Droplets, Plus, RotateCcw } from 'lucide-react';

const QUICK = [
  { label: '+150ml', ml: 150 },
  { label: '+250ml', ml: 250 },
  { label: '+600ml', ml: 600 },
];

export default function WaterReminder({ todayMl = 0, targetMl = 2000, onAdd, onReset }) {
  const pct = Math.min(100, Math.round((todayMl / targetMl) * 100));
  const cups = Math.round(todayMl / 250);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Droplets size={14} color="var(--cyan)"/>
          <span style={{ fontSize:12, fontWeight:700 }}>Pencatat Minum</span>
        </div>
        <button className="btn" onClick={onReset} title="Reset hari ini" style={{ padding:3 }}>
          <RotateCcw size={12} color="var(--text-2)"/>
        </button>
      </div>

      {/* Progress */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          <div className="water-bar-track">
            <div className="water-bar-fill" style={{ width:`${pct}%` }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9.5, color:'var(--text-2)', fontWeight:600 }}>
            <span>{todayMl} ml</span>
            <span>Target: {targetMl} ml</span>
          </div>
        </div>
        <div style={{ textAlign:'center', minWidth:36 }}>
          <div style={{ fontSize:16, fontWeight:800, color: pct>=100 ? 'var(--green)' : 'var(--cyan)' }}>{pct}%</div>
          <div style={{ fontSize:8, color:'var(--text-2)', fontWeight:600 }}>{cups} gls</div>
        </div>
      </div>

      {/* Quick add buttons */}
      <div style={{ display:'flex', gap:6 }}>
        {QUICK.map(q => (
          <button key={q.ml} onClick={() => onAdd(q.ml)}
            style={{ flex:1, background:'rgba(100,210,255,.1)', border:'1px solid rgba(100,210,255,.2)',
                     borderRadius:9, color:'var(--cyan)', fontSize:10, fontWeight:700,
                     padding:'5px 0', cursor:'pointer', fontFamily:'inherit',
                     transition:'all .18s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(100,210,255,.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(100,210,255,.1)'}>
            <Plus size={10} style={{ display:'inline', marginRight:2 }}/>{q.label}
          </button>
        ))}
      </div>

      {pct >= 100 && (
        <div style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--green)' }}>
          ✓ Target harian tercapai!
        </div>
      )}
    </div>
  );
}

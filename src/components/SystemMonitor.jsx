import React from 'react';
import { Cpu, HardDrive, Wifi, ArrowDown, ArrowUp } from 'lucide-react';

function MiniBar({ pct, color }) {
  return (
    <div style={{ width:'100%', height:4, background:'rgba(255,255,255,.08)', borderRadius:3 }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3, transition:'width .8s ease' }}/>
    </div>
  );
}

function Stat({ icon, label, value, pct, color, sub }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3,
                  background:'rgba(255,255,255,.04)', borderRadius:10, padding:'6px 9px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:5, alignItems:'center', color }}>
          {icon}
          <span style={{ fontSize:9.5, fontWeight:600, color:'var(--text-2)' }}>{label}</span>
        </div>
        <span style={{ fontSize:12, fontWeight:800, color }}>{value}</span>
      </div>
      {pct !== undefined && <MiniBar pct={pct} color={color}/>}
      {sub && <span style={{ fontSize:9, color:'var(--text-3)' }}>{sub}</span>}
    </div>
  );
}

export default function SystemMonitor({ metrics = {} }) {
  const { cpu=0, ramUsed=0, ramTotal=0, ramPct=0, downKBs=0, upKBs=0 } = metrics;

  const fmtNet = (kb) => kb >= 1024 ? `${(kb/1024).toFixed(1)} MB/s` : `${kb} KB/s`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ fontSize:11, fontWeight:700, marginBottom:2 }}>Sistem & Jaringan</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
        <Stat icon={<Cpu size={11}/>} label="CPU" value={`${cpu}%`} pct={cpu}
              color={cpu>80?'var(--red)':cpu>50?'var(--orange)':'var(--cyan)'}/>
        <Stat icon={<HardDrive size={11}/>} label="RAM"
              value={`${ramUsed}/${ramTotal}GB`} pct={ramPct}
              color={ramPct>85?'var(--red)':ramPct>65?'var(--orange)':'var(--purple)'}
              sub={`${ramPct}% terpakai`}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
        <Stat icon={<ArrowDown size={11}/>} label="↓ Download" value={fmtNet(downKBs)}
              color="var(--green)" sub="Kecepatan turun"/>
        <Stat icon={<ArrowUp size={11}/>} label="↑ Upload" value={fmtNet(upKBs)}
              color="var(--cyan)" sub="Kecepatan naik"/>
      </div>
    </div>
  );
}

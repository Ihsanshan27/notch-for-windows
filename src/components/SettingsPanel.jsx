import React from 'react';
import { X, Check, Power, Volume2, Music, Monitor, Pin, Bell, BellOff, LogIn, Eye, EyeOff, Settings, Sparkles, Square } from 'lucide-react';

const Toggle = ({ label, icon: Icon, iconColor, checked, onClick }) => (
  <div onClick={onClick}
    style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
             background:'rgba(255,255,255,.05)', padding:'7px 10px', borderRadius:10, cursor:'pointer',
             transition:'background .15s', fontSize:10.5, color:'var(--text-1)' }}
    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.09)'}
    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}>
    <div style={{ display:'flex', gap:7, alignItems:'center' }}>
      <Icon size={12} color={iconColor}/>
      <span>{label}</span>
    </div>
    <div style={{ width:14, height:14, borderRadius:4,
                  background: checked ? 'var(--green)' : 'rgba(255,255,255,.1)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {checked && <Check size={10} color="#000" strokeWidth={3}/>}
    </div>
  </div>
);

export default function SettingsPanel({
  settings, onUpdate, onClose,
  onTestHUD, onTestChime,
  onToggleSimMusic, isSimMusic,
  onQuit,
}) {
  const MODE_OPTIONS = [
    { value:'island',  label:'Default Island' },
    { value:'minimal', label:'Minimal Strip'   },
    { value:'mascot',  label:'Mascot Mode'     },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:800 }}>
          <Settings size={13} color="var(--cyan)"/>
          <span>Pengaturan Notch</span>
        </div>
        <button className="btn" onClick={onClose} style={{ padding:3 }}><X size={14} color="var(--text-2)"/></button>
      </div>

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:7 }}>
        {/* Perilaku Notch: Stay vs Auto-Hide */}
        <div>
          <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.6, marginBottom:5 }}>
            Perilaku Notch (Stay / Auto-Hide)
          </div>
          <div style={{ display:'flex', gap:5 }}>
            <button
              onClick={() => onUpdate({ autoHideMode: false })}
              style={{ flex:1, padding:'6px 4px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit',
                       fontSize:9.5, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                       background: !settings.autoHideMode ? 'rgba(48,209,88,.2)' : 'rgba(255,255,255,.05)',
                       color: !settings.autoHideMode ? 'var(--green)' : 'var(--text-2)',
                       border: !settings.autoHideMode ? '1px solid rgba(48,209,88,.4)' : '1px solid transparent',
                       transition:'all .18s' }}>
              <Eye size={11}/> Tetap Muncul (Stay)
            </button>
            <button
              onClick={() => onUpdate({ autoHideMode: true })}
              style={{ flex:1, padding:'6px 4px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit',
                       fontSize:9.5, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                       background: settings.autoHideMode ? 'rgba(100,210,255,.2)' : 'rgba(255,255,255,.05)',
                       color: settings.autoHideMode ? 'var(--cyan)' : 'var(--text-2)',
                       border: settings.autoHideMode ? '1px solid rgba(100,210,255,.4)' : '1px solid transparent',
                       transition:'all .18s' }}>
              <EyeOff size={11}/> Auto-Hide
            </button>
          </div>
        </div>

        {/* Pilihan Tema Warna */}
        <div>
          <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.6, marginBottom:5 }}>
            Tema Warna Notch
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button
              onClick={() => onUpdate({ theme: 'midnight' })}
              style={{
                flex: 1, padding: '7px 8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                background: (settings.theme || 'midnight') === 'midnight' ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.04)',
                color: (settings.theme || 'midnight') === 'midnight' ? '#fff' : 'var(--text-2)',
                border: (settings.theme || 'midnight') === 'midnight' ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent',
                transition: 'all .18s'
              }}>
              <div style={{ width: 12, height: 12, borderRadius: 50, background: '#050505', border: '1px solid rgba(255,255,255,.4)', flexShrink: 0 }} />
              <span>Midnight (Black)</span>
            </button>
            <button
              onClick={() => onUpdate({ theme: 'graphite' })}
              style={{
                flex: 1, padding: '7px 8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                background: settings.theme === 'graphite' ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.04)',
                color: settings.theme === 'graphite' ? '#fff' : 'var(--text-2)',
                border: settings.theme === 'graphite' ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent',
                transition: 'all .18s'
              }}>
              <div style={{ width: 12, height: 12, borderRadius: 50, background: '#2d2d2d', border: '1px solid rgba(255,255,255,.4)', flexShrink: 0 }} />
              <span>Dark (#2d2d2d)</span>
            </button>
          </div>
        </div>

        {/* Gaya Tampilan Material: Glass vs Solid */}
        <div>
          <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.6, marginBottom:5 }}>
            Gaya Tampilan (Glass / Solid)
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button
              onClick={() => onUpdate({ surfaceStyle: 'glass' })}
              style={{
                flex: 1, padding: '7px 8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: (settings.surfaceStyle || 'glass') === 'glass' ? 'rgba(100,210,255,.18)' : 'rgba(255,255,255,.04)',
                color: (settings.surfaceStyle || 'glass') === 'glass' ? 'var(--cyan)' : 'var(--text-2)',
                border: (settings.surfaceStyle || 'glass') === 'glass' ? '1px solid rgba(100,210,255,.4)' : '1px solid transparent',
                transition: 'all .18s'
              }}>
              <Sparkles size={11} />
              <span>Glass (Transparan Blur)</span>
            </button>
            <button
              onClick={() => onUpdate({ surfaceStyle: 'solid' })}
              style={{
                flex: 1, padding: '7px 8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: settings.surfaceStyle === 'solid' ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.04)',
                color: settings.surfaceStyle === 'solid' ? '#fff' : 'var(--text-2)',
                border: settings.surfaceStyle === 'solid' ? '1px solid rgba(255,255,255,.4)' : '1px solid transparent',
                transition: 'all .18s'
              }}>
              <Square size={11} />
              <span>Solid (Pekat)</span>
            </button>
          </div>
        </div>

        {/* Mode default tampilan */}
        <div>
          <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:.6, marginBottom:5 }}>
            Bentuk Tampilan Saat Idle
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {MODE_OPTIONS.map(m => (
              <button key={m.value} onClick={() => onUpdate({ notchDefaultMode: m.value })}
                style={{ flex:1, padding:'5px 4px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit',
                         fontSize:9.5, fontWeight:600,
                         background: settings.notchDefaultMode===m.value ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.05)',
                         color: settings.notchDefaultMode===m.value ? '#fff' : 'var(--text-2)',
                         transition:'all .18s' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <Toggle label="Selalu di Atas (Always on Top)" icon={Pin} iconColor="var(--yellow)"
          checked={settings.alwaysOnTop} onClick={() => onUpdate({ alwaysOnTop: !settings.alwaysOnTop })}/>
        <Toggle label="Auto-Hide saat Layar Penuh (Fullscreen)" icon={Monitor} iconColor="var(--cyan)"
          checked={settings.autoHideFullscreen} onClick={() => onUpdate({ autoHideFullscreen: !settings.autoHideFullscreen })}/>
        <Toggle label="Start with Windows (Mulai otomatis)" icon={LogIn} iconColor="var(--green)"
          checked={settings.openAtLogin} onClick={() => {
            onUpdate({ openAtLogin: !settings.openAtLogin });
            window.notchAPI?.setOpenAtLogin(!settings.openAtLogin);
          }}/>
        <Toggle label="Nada Notifikasi Aktif (Chime)" icon={settings.chimeEnabled ? Bell : BellOff}
          iconColor={settings.chimeEnabled ? 'var(--orange)' : 'var(--text-3)'}
          checked={settings.chimeEnabled} onClick={() => onUpdate({ chimeEnabled: !settings.chimeEnabled })}/>
      </div>

      {/* Action row */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', flexShrink:0, borderTop:'1px solid var(--border-glass)', paddingTop:7 }}>
        <button onClick={onTestHUD}
          style={{ flex:1, minWidth:60, background:'rgba(255,255,255,.07)', border:'none', borderRadius:8,
                   color:'var(--text-1)', fontSize:9.5, fontWeight:700, padding:'5px 4px', cursor:'pointer', fontFamily:'inherit',
                   display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Volume2 size={11} color="var(--cyan)"/> Tes HUD
        </button>
        <button onClick={onTestChime}
          style={{ flex:1, minWidth:60, background:'rgba(255,255,255,.07)', border:'none', borderRadius:8,
                   color:'var(--text-1)', fontSize:9.5, fontWeight:700, padding:'5px 4px', cursor:'pointer', fontFamily:'inherit',
                   display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Bell size={11} color="var(--orange)"/> Tes Chime
        </button>
        <button onClick={onToggleSimMusic}
          style={{ flex:1, minWidth:60,
                   background: isSimMusic ? 'rgba(48,209,88,.15)' : 'rgba(255,255,255,.07)',
                   border:'none', borderRadius:8,
                   color: isSimMusic ? 'var(--green)' : 'var(--text-1)',
                   fontSize:9.5, fontWeight:700, padding:'5px 4px', cursor:'pointer', fontFamily:'inherit',
                   display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Music size={11}/> {isSimMusic ? 'Demo: ON' : 'Tes Musik'}
        </button>
        <button onClick={onQuit}
          style={{ flex:1, minWidth:60, background:'rgba(255,69,58,.12)', border:'none', borderRadius:8,
                   color:'var(--red)', fontSize:9.5, fontWeight:700, padding:'5px 4px', cursor:'pointer', fontFamily:'inherit',
                   display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Power size={11}/> Keluar
        </button>
      </div>
    </div>
  );
}

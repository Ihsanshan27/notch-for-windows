import React, { useState } from 'react';
import { FileText, Image, Film, Music, Trash2, X, FolderUp, Copy, FolderOpen } from 'lucide-react';

const ICON_MAP = { image: Image, video: Film, audio: Music, default: FileText };

function getFileType(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (['mp4','mov','mkv','avi','webm'].includes(ext)) return 'video';
  if (['mp3','wav','flac','ogg','aac'].includes(ext)) return 'audio';
  return 'default';
}

export default function FileShelf({ files = [], onSave }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (!e.dataTransfer.files?.length) return;
    const newFiles = Array.from(e.dataTransfer.files).map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      path: f.path || f.name,  // Electron provides .path
      size: f.size,
      type: getFileType(f.name),
    }));
    onSave([...files, ...newFiles]);
  };

  const remove = (id) => onSave(files.filter(f => f.id !== id));
  const copyPath = (path) => navigator.clipboard?.writeText(path);
  const fmtSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024**2) return `${(bytes/1024).toFixed(1)}KB`;
    return `${(bytes/1024**2).toFixed(1)}MB`;
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{ display:'flex', flexDirection:'column', height:'100%', gap:6 }}
    >
      {/* Drop zone header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <FolderUp size={13} color="var(--cyan)"/>
          <span style={{ fontSize:11, fontWeight:700 }}>File Shelf</span>
          <span style={{ fontSize:9.5, color:'var(--text-3)' }}>({files.length} file)</span>
        </div>
        {files.length > 0 && (
          <button className="btn" onClick={() => onSave([])} style={{ padding:2, fontSize:9 }} title="Kosongkan shelf">
            <Trash2 size={11} color="var(--red)"/>
          </button>
        )}
      </div>

      {/* File list or empty state */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4,
                    ...(dragging ? { border:'1.5px dashed var(--cyan)', borderRadius:10, padding:6,
                                     background:'rgba(100,210,255,.05)' } : {}) }}>
        {files.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        flex:1, gap:6, color:'var(--text-3)' }}>
            <FolderUp size={22}/>
            <span style={{ fontSize:10, textAlign:'center' }}>Tarik & lepas file di sini<br/>untuk menyimpan sementara</span>
          </div>
        ) : (
          files.map(f => {
            const Icon = ICON_MAP[f.type] || FileText;
            return (
              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:7,
                                        background:'rgba(255,255,255,.05)', borderRadius:8, padding:'4px 8px' }}>
                <Icon size={13} color={f.type==='image'?'var(--cyan)':f.type==='video'?'var(--purple)':f.type==='audio'?'var(--green)':'var(--yellow)'}/>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontSize:10.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize:8.5, color:'var(--text-3)' }}>{fmtSize(f.size)}</div>
                </div>
                <div style={{ display:'flex', gap:3 }}>
                  <button className="btn" onClick={() => copyPath(f.path)} style={{ padding:2 }} title="Salin path">
                    <Copy size={10} color="var(--text-2)"/>
                  </button>
                  <button className="btn" onClick={() => remove(f.id)} style={{ padding:2 }} title="Hapus dari shelf">
                    <X size={10} color="var(--red)"/>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

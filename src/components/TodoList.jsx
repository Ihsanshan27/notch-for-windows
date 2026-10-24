import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Plus, Clock } from 'lucide-react';

export default function TodoList({ todos = [], onSave }) {
  const [input, setInput] = useState('');

  const addTodo = () => {
    const t = input.trim();
    if (!t) return;
    const next = [...todos, { id: Date.now(), text: t, done: false, time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }];
    onSave(next);
    setInput('');
  };

  const toggle = (id) => onSave(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => onSave(todos.filter(t => t.id !== id));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {/* Add input */}
      <div style={{ display:'flex', gap:6 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && addTodo()}
          placeholder="Tambah tugas..."
          style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid var(--border)',
                   borderRadius:9, padding:'5px 10px', color:'var(--text-1)',
                   fontSize:11, fontFamily:'inherit', outline:'none',
                   border:'1px solid var(--border-glass)' }}
        />
        <button onClick={addTodo} className="btn"
          style={{ background:'rgba(255,255,255,.1)', borderRadius:9, padding:'5px 8px' }}>
          <Plus size={13}/>
        </button>
      </div>

      {/* Task list */}
      <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:110, overflowY:'auto' }}>
        {todos.length === 0 && (
          <p style={{ fontSize:10.5, color:'var(--text-3)', textAlign:'center', padding:'8px 0' }}>
            Belum ada tugas hari ini
          </p>
        )}
        {todos.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:7,
            background:'rgba(255,255,255,.04)', borderRadius:8, padding:'5px 8px' }}>
            <button className="btn" onClick={() => toggle(t.id)} style={{ padding:1 }}>
              {t.done
                ? <CheckSquare size={13} color="var(--green)"/>
                : <Square size={13} color="var(--text-3)"/>}
            </button>
            <span style={{ flex:1, fontSize:11, color: t.done?'var(--text-3)':'var(--text-1)',
                           textDecoration: t.done?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {t.text}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:9, color:'var(--text-3)' }}>{t.time}</span>
              <button className="btn" onClick={() => remove(t.id)} style={{ padding:1 }}>
                <Trash2 size={11} color="var(--red)"/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {todos.length > 0 && (
        <div style={{ fontSize:9.5, color:'var(--text-3)', textAlign:'right' }}>
          {todos.filter(t => t.done).length}/{todos.length} selesai
        </div>
      )}
    </div>
  );
}

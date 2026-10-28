import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check, Plus, Trash2 } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_NAMES_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewYear, setViewYear]       = useState(currentDate.getFullYear());
  const [viewMonth, setViewMonth]     = useState(currentDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  );
  const [notes, setNotes]             = useState(() => {
    try {
      const saved = localStorage.getItem('notch_calendar_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  // Update current time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveNotes = (updated) => {
    setNotes(updated);
    try {
      localStorage.setItem('notch_calendar_notes', JSON.stringify(updated));
    } catch {}
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill up to 35 or 42 grid cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedNotes = notes[selectedKey] || [];

  const handleAddNote = (e) => {
    e?.preventDefault();
    if (!newNoteText.trim()) return;
    const updated = {
      ...notes,
      [selectedKey]: [...selectedNotes, newNoteText.trim()]
    };
    saveNotes(updated);
    setNewNoteText('');
  };

  const handleDeleteNote = (idx) => {
    const filtered = selectedNotes.filter((_, i) => i !== idx);
    const updated = { ...notes };
    if (filtered.length > 0) {
      updated[selectedKey] = filtered;
    } else {
      delete updated[selectedKey];
    }
    saveNotes(updated);
  };

  const isToday = (d) => {
    const today = new Date();
    return d.day === today.getDate() &&
           d.month === today.getMonth() &&
           d.year === today.getFullYear();
  };

  const isSelected = (d) => {
    return d.day === selectedDate.getDate() &&
           d.month === selectedDate.getMonth() &&
           d.year === selectedDate.getFullYear();
  };

  const hasNote = (d) => {
    const key = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    return notes[key] && notes[key].length > 0;
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', gap: 10 }}>
      {/* ── Left Side: Interactive Calendar Grid ── */}
      <div style={{ flex: '1.25', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Header & Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={jumpToToday}
              className="btn"
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 5,
                background: 'rgba(100,210,255,0.12)',
                color: 'var(--cyan)',
                border: '1px solid rgba(100,210,255,0.25)',
              }}
              title="Kembali ke Hari Ini"
            >
              Hari Ini
            </button>
          </div>

          <div style={{ display: 'flex', gap: 3 }}>
            <button
              onClick={prevMonth}
              className="btn"
              style={{ padding: '3px 5px' }}
              title="Bulan sebelumnya"
            >
              <ChevronLeft size={12} color="var(--text-2)" />
            </button>
            <button
              onClick={nextMonth}
              className="btn"
              style={{ padding: '3px 5px' }}
              title="Bulan berikutnya"
            >
              <ChevronRight size={12} color="var(--text-2)" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontSize: 8.5,
          fontWeight: 700,
          color: 'var(--text-3)',
          paddingBottom: 2,
        }}>
          {DAY_NAMES.map((d, i) => (
            <span key={d} style={{ color: i === 0 ? 'var(--red)' : 'var(--text-3)' }}>
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          flex: 1,
        }}>
          {days.map((d, idx) => {
            const today = isToday(d);
            const sel = isSelected(d);
            const noted = hasNote(d);

            let bg = 'transparent';
            let color = d.isCurrentMonth ? 'var(--text-1)' : 'rgba(255,255,255,0.18)';
            let border = '1px solid transparent';

            if (sel) {
              bg = 'rgba(100,210,255,0.22)';
              color = '#ffffff';
              border = '1px solid rgba(100,210,255,0.5)';
            } else if (today) {
              bg = 'rgba(48,209,88,0.20)';
              color = 'var(--green)';
              border = '1px solid rgba(48,209,88,0.4)';
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(new Date(d.year, d.month, d.day))}
                style={{
                  background: bg,
                  color,
                  border,
                  borderRadius: 6,
                  padding: '3px 0',
                  fontSize: 10,
                  fontWeight: today || sel ? 800 : 500,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                <span>{d.day}</span>
                {noted && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 1.5,
                      width: 3,
                      height: 3,
                      borderRadius: 50,
                      background: sel ? '#fff' : 'var(--cyan)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, background: 'var(--border-glass)', margin: '2px 0' }} />

      {/* ── Right Side: Selected Date & Quick Agenda ── */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        {/* Date Big Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '5px 8px',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-1)' }}>
              {DAY_NAMES_FULL[selectedDate.getDay()]}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-2)' }}>
              {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--cyan)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {String(selectedDate.getDate()).padStart(2, '0')}
          </div>
        </div>

        {/* Notes List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          paddingRight: 2,
        }}>
          {selectedNotes.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: 9.5,
              color: 'var(--text-3)',
              textAlign: 'center',
              padding: '6px 0',
            }}>
              <span>Tidak ada agenda</span>
              <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.18)' }}>Ketik catatan di bawah</span>
            </div>
          ) : (
            selectedNotes.map((note, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 6,
                  padding: '3px 6px',
                  fontSize: 9.5,
                  color: 'var(--text-1)',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                  <div style={{ width: 4, height: 4, borderRadius: 50, background: 'var(--cyan)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteNote(i)}
                  className="btn"
                  style={{ padding: 2, color: 'var(--text-3)' }}
                  title="Hapus agenda"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Note Input */}
        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 4 }}>
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Tambah agenda / note..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '4px 6px',
              fontSize: 9,
              color: 'var(--text-1)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            className="btn"
            style={{
              padding: '4px 7px',
              background: 'rgba(100,210,255,0.15)',
              color: 'var(--cyan)',
              border: '1px solid rgba(100,210,255,0.3)',
              borderRadius: 6,
              fontSize: 9,
              fontWeight: 700,
            }}
            title="Simpan agenda"
          >
            <Plus size={10} />
          </button>
        </form>
      </div>
    </div>
  );
}

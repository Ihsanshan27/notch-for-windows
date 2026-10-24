import React, { useState, useEffect, useRef } from 'react';
import { Music, AlignLeft, Disc } from 'lucide-react';

// Built-in synced lyrics for the demo song "Starboy"
const STARBOY_LRC = `
[00:00.00] ♪ (Intro: Starboy) ♪
[00:04.00] I'm tryna put you in the worst mood, ah
[00:08.50] P1 cleaner than your church shoes, ah
[00:12.50] Milli point two just to hurt you, ah
[00:16.80] All red Lamb' just to tease you, ah
[00:21.00] None of these toys on lease too, ah
[00:25.20] Made your whole year in a week too, yah
[00:29.50] Main bitch out your league too, ah
[00:33.80] Side bitch out of your league too, ah
[00:38.00] Look what you've done
[00:41.50] I'm a motherfuckin' starboy
[00:46.20] Look what you've done
[00:50.00] I'm a motherfuckin' starboy
[00:55.00] Every day a nigga try to test me, ah
[00:59.20] Every day a nigga try to end me, ah
[01:03.50] Pull off in that Roadster sv, ah
[01:07.80] Pockets overweight, gettin' hefty, ah
[01:12.00] Coming for the king, that's a far cry, ah
[01:16.20] I come alive in the fall time, I
[01:20.50] No competition, don't hesitate
[01:24.00] Let's celebrate, let's celebrate
[01:28.00] Look what you've done
[01:32.00] I'm a motherfuckin' starboy
[01:36.50] Look what you've done
[01:40.50] I'm a motherfuckin' starboy
`;

function parseLRC(raw) {
  const lines = [];
  for (const line of raw.split('\n')) {
    const match = line.match(/\[(\d+):(\d+)\.?(\d+)?\]\s*(.*)/);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms  = match[3] ? parseInt(match[3]) / 100 : 0;
      const time = min * 60 + sec + ms;
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export default function SyncedLyrics({ title, artist, isPlaying, progressSeconds = 0, onSeek }) {
  const [lyrics,    setLyrics]    = useState([]);
  const [plain,     setPlain]     = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // Fetch or load lyrics
  useEffect(() => {
    if (!title) return;

    // Check for demo Starboy
    if (title.toLowerCase().includes('starboy')) {
      setLyrics(parseLRC(STARBOY_LRC));
      setPlain('');
      setError('');
      setLoading(false);
      return;
    }

    if (!artist) return;
    setLyrics([]); setPlain(''); setError(''); setLoading(true);
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.syncedLyrics) {
          setLyrics(parseLRC(data.syncedLyrics));
        } else if (data.plainLyrics) {
          setPlain(data.plainLyrics);
        } else {
          setError('Lirik tidak ditemukan di LRCLIB');
        }
      })
      .catch(() => setError('Tidak dapat memuat lirik'))
      .finally(() => setLoading(false));
  }, [title, artist]);

  // Track currently active lyric line with exact highlight
  useEffect(() => {
    if (!lyrics.length) return;
    let idx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= progressSeconds + 0.3) {
        idx = i;
      } else {
        break;
      }
    }
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      // Auto-scroll active line to center smoothly
      const el = itemRefs.current[idx];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [progressSeconds, lyrics, activeIdx]);

  if (loading) {
    return (
      <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-2)' }}>
        Memuat lirik karaoke…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)' }}>
        {error}
      </div>
    );
  }

  if (plain) {
    return (
      <div className="lyrics-container" style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {plain}
      </div>
    );
  }

  if (!lyrics.length) return null;

  return (
    <div ref={containerRef} className="lyrics-container">
      {lyrics.map((l, i) => {
        const isActive = i === activeIdx;
        return (
          <div
            key={i}
            ref={el => itemRefs.current[i] = el}
            className={`lyric-line${isActive ? ' active' : ''}`}
            onClick={() => onSeek?.(l.time)}
            title={`Lompat ke ${Math.floor(l.time / 60)}:${String(Math.floor(l.time % 60)).padStart(2, '0')}`}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
}

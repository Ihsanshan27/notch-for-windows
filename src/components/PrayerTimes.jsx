import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Compass, Clock } from 'lucide-react';

const PRAYER_NAMES = ['Subuh', 'Syuruk', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

// Convert "HH:MM" to minutes from midnight
const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const nowMin = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

const fmtCountdown = (mins) => {
  if (mins <= 0) return 'Sekarang';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}j ${m}m` : `${m} menit`;
};

export default function PrayerTimes({ chimeEnabled }) {
  const [city,    setCity]    = useState('');
  const [country, setCountry] = useState('ID');
  const [times,   setTimes]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [editCity, setEditCity] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [currentTimeMin, setCurrentTimeMin] = useState(nowMin());

  // Update real-time minute tick
  useEffect(() => {
    const id = setInterval(() => setCurrentTimeMin(nowMin()), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchPrayer = async (c, ct) => {
    if (!c) return;
    setLoading(true); setError('');
    try {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${encodeURIComponent(c)}&country=${ct}&method=11`
      );
      const data = await res.json();
      if (data.code === 200) {
        const t = data.data.timings;
        setTimes({ Subuh: t.Fajr, Syuruk: t.Sunrise, Dzuhur: t.Dhuhr, Ashar: t.Asr, Maghrib: t.Maghrib, Isya: t.Isha });
      } else {
        setError('Kota tidak ditemukan');
      }
    } catch {
      setError('Gagal memuat jadwal sholat');
    } finally { setLoading(false); }
  };

  // Auto-detect city from IP
  useEffect(() => {
    fetch('http://ip-api.com/json/?fields=city,countryCode')
      .then(r => r.json())
      .then(d => {
        if (d.city) {
          setCity(d.city);
          setCountry(d.countryCode || 'ID');
          fetchPrayer(d.city, d.countryCode || 'ID');
        } else {
          setCity('Jakarta');
          fetchPrayer('Jakarta', 'ID');
        }
      })
      .catch(() => {
        setCity('Jakarta');
        fetchPrayer('Jakarta', 'ID');
      });
  }, []);

  // ── Calculate Current & Next Prayer with Precision ──────────────────────────
  const now = currentTimeMin;
  let current = null;
  let next = null;
  let remainingMins = 0;

  if (times) {
    const subuh   = toMin(times.Subuh);
    const syuruk  = toMin(times.Syuruk);
    const dzuhur  = toMin(times.Dzuhur);
    const ashar   = toMin(times.Ashar);
    const maghrib = toMin(times.Maghrib);
    const isya    = toMin(times.Isya);

    if (now >= isya || now < subuh) {
      current = 'Isya';
      next = 'Subuh';
      remainingMins = now >= isya ? (subuh + 1440) - now : subuh - now;
    } else if (now >= subuh && now < syuruk) {
      current = 'Subuh';
      next = 'Syuruk';
      remainingMins = syuruk - now;
    } else if (now >= syuruk && now < dzuhur) {
      current = 'Syuruk';
      next = 'Dzuhur';
      remainingMins = dzuhur - now;
    } else if (now >= dzuhur && now < ashar) {
      current = 'Dzuhur';
      next = 'Ashar';
      remainingMins = ashar - now;
    } else if (now >= ashar && now < maghrib) {
      current = 'Ashar';
      next = 'Maghrib';
      remainingMins = maghrib - now;
    } else if (now >= maghrib && now < isya) {
      current = 'Maghrib';
      next = 'Isya';
      remainingMins = isya - now;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Compass size={13} color="var(--cyan)"/>
          <span style={{ fontSize: 11, fontWeight: 700 }}>Waktu Sholat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {editCity ? (
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const c = cityInput.trim();
                  if (c) { setCity(c); setEditCity(false); fetchPrayer(c, country); }
                }
              }}
              placeholder="Nama kota..."
              style={{
                background: 'rgba(255,255,255,.08)', border: '1px solid var(--border-glass)', borderRadius: 6,
                padding: '2px 6px', color: 'var(--text-1)', fontSize: 9.5, fontFamily: 'inherit', outline: 'none', width: 80
              }}
              autoFocus
              onBlur={() => setEditCity(false)}
            />
          ) : (
            <button
              className="btn"
              onClick={() => { setCityInput(city); setEditCity(true); }}
              style={{ padding: '2px 6px', fontSize: 9, fontWeight: 600, borderRadius: 6, background: 'rgba(255,255,255,.06)', display: 'flex', gap: 3, alignItems: 'center' }}
            >
              <MapPin size={9}/> {city || 'Pilih Kota'}
            </button>
          )}
          <button className="btn" onClick={() => fetchPrayer(city, country)} style={{ padding: 3 }} disabled={loading}>
            <RefreshCw size={10} className={loading ? 'spin' : ''}/>
          </button>
        </div>
      </div>

      {/* ── Highlight Banner: Current Prayer (GREEN) vs Next Prayer (ORANGE) ── */}
      {times && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {/* Current Active Prayer Card */}
          <div style={{
            background: 'rgba(48, 209, 88, 0.12)',
            border: '1px solid rgba(48, 209, 88, 0.40)',
            borderRadius: 8,
            padding: '5px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            boxShadow: '0 0 10px rgba(48, 209, 88, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--green)', letterSpacing: .4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
                Waktu Saat Ini
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--green)', opacity: 0.9 }}>Sedang Berjalan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>{current}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{times[current]}</span>
            </div>
          </div>

          {/* Next Prayer Card */}
          <div style={{
            background: 'rgba(255, 159, 10, 0.12)',
            border: '1px solid rgba(255, 159, 10, 0.40)',
            borderRadius: 8,
            padding: '5px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            boxShadow: '0 0 10px rgba(255, 159, 10, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--orange)', letterSpacing: .4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={9} color="var(--orange)" />
                Selanjutnya
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--text-2)' }}>
                {fmtCountdown(remainingMins)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>{next}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>{times[next]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && <p style={{ fontSize: 9.5, color: 'var(--text-2)', textAlign: 'center', padding: '6px 0' }}>Memuat jadwal...</p>}
      {error   && <p style={{ fontSize: 9.5, color: 'var(--red)', textAlign: 'center', padding: '6px 0' }}>{error}</p>}

      {/* ── Prayer Grid: 6 Prayer Times with Color Badges ── */}
      {times && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
          {PRAYER_NAMES.map(n => {
            const t = times[n];
            const isCurrent = n === current;
            const isNext = n === next;

            let bg = 'rgba(255, 255, 255, 0.04)';
            let border = '1px solid var(--border-glass)';
            let nameColor = 'var(--text-2)';
            let timeColor = 'var(--text-1)';
            let shadow = 'none';

            if (isCurrent) {
              bg = 'rgba(48, 209, 88, 0.18)';
              border = '1px solid rgba(48, 209, 88, 0.55)';
              nameColor = 'var(--green)';
              timeColor = '#ffffff';
              shadow = '0 0 10px rgba(48, 209, 88, 0.25)';
            } else if (isNext) {
              bg = 'rgba(255, 159, 10, 0.18)';
              border = '1px solid rgba(255, 159, 10, 0.55)';
              nameColor = 'var(--orange)';
              timeColor = '#ffffff';
              shadow = '0 0 10px rgba(255, 159, 10, 0.25)';
            }

            return (
              <div
                key={n}
                style={{
                  background: bg,
                  border: border,
                  boxShadow: shadow,
                  borderRadius: 7,
                  padding: '5px 2px',
                  textAlign: 'center',
                  transition: 'all .25s ease',
                  position: 'relative',
                }}
              >
                {/* Visual marker dot */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: 2.5, right: 2.5, width: 4.5, height: 4.5,
                    borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 5px var(--green)'
                  }} />
                )}
                {isNext && (
                  <div style={{
                    position: 'absolute', top: 2.5, right: 2.5, width: 4.5, height: 4.5,
                    borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 5px var(--orange)'
                  }} />
                )}

                <div style={{ fontSize: 8.5, fontWeight: isCurrent || isNext ? 800 : 600, color: nameColor, marginBottom: 1 }}>
                  {n}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: isCurrent || isNext ? 800 : 700, color: timeColor }}>
                  {t}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

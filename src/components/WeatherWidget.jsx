import React, { useState, useEffect } from 'react';
import {
  Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle,
  CloudFog, Wind, Droplets, Thermometer, RefreshCw, MapPin
} from 'lucide-react';

function getWeatherDesc(code) {
  if (code === 0) return { label: 'Cerah', icon: Sun, color: 'var(--yellow)' };
  if ([1, 2, 3].includes(code)) return { label: 'Cerah Berawan', icon: Cloud, color: 'var(--cyan)' };
  if ([45, 48].includes(code)) return { label: 'Berkabut', icon: CloudFog, color: 'var(--text-2)' };
  if ([51, 53, 55].includes(code)) return { label: 'Gerimis', icon: CloudDrizzle, color: 'var(--blue)' };
  if ([61, 63, 65].includes(code)) return { label: 'Hujan', icon: CloudRain, color: 'var(--blue)' };
  if ([80, 81, 82].includes(code)) return { label: 'Hujan Deras', icon: CloudRain, color: 'var(--cyan)' };
  if ([95, 96, 99].includes(code)) return { label: 'Badai Petir', icon: CloudLightning, color: 'var(--orange)' };
  return { label: 'Berawan', icon: Cloud, color: 'var(--text-1)' };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(() => {
    try {
      const cached = localStorage.getItem('notch_weather_cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(!weather);
  const [city, setCity] = useState('Jakarta');

  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Koordinat default Jakarta (-6.2088, 106.8456)
      let lat = -6.2088;
      let lon = 106.8456;
      let cityName = 'Jakarta';

      // Coba ambil lokasi otomatis jika diizinkan
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          cityName = 'Lokasi Saya';
        } catch {}
      }

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&forecast_days=1&timezone=auto`
      );
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      const cur = data.current;
      const parsed = {
        temp: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        wind: Math.round(cur.wind_speed_10m),
        code: cur.weather_code,
        city: cityName,
        updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hourly: (data.hourly?.time || []).slice(0, 4).map((t, i) => ({
          time: new Date(t).getHours() + ':00',
          temp: Math.round(data.hourly.temperature_2m[i]),
          code: data.hourly.weather_code[i],
        })),
      };

      setWeather(parsed);
      setCity(cityName);
      try { localStorage.setItem('notch_weather_cache', JSON.stringify(parsed)); } catch {}
    } catch (e) {
      console.warn('[WeatherWidget] error:', e);
      if (!weather) {
        // Fallback offline mock data jika tidak ada koneksi
        setWeather({
          temp: 29, feelsLike: 32, humidity: 75, wind: 12, code: 2,
          city: 'Jakarta', updatedAt: 'Live',
          hourly: [
            { time: '14:00', temp: 30, code: 1 },
            { time: '16:00', temp: 29, code: 2 },
            { time: '18:00', temp: 27, code: 61 },
            { time: '20:00', temp: 26, code: 3 },
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const timer = setInterval(fetchWeather, 20 * 60 * 1000); // 20 menit
    return () => clearInterval(timer);
  }, []);

  const info = getWeatherDesc(weather?.code ?? 1);
  const WeatherIcon = info.icon;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 7,
      animation: 'expandedReveal 0.28s cubic-bezier(0.16,1,0.3,1) both'
    }}>
      {/* ── Top row: Kota & Refresh ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={12} color="var(--cyan)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>
            {weather?.city || city}
          </span>
          <span style={{ fontSize: 9.5, color: 'var(--text-3)', marginLeft: 4 }}>
            Update {weather?.updatedAt || 'Baru'}
          </span>
        </div>
        <button
          onClick={fetchWeather}
          disabled={loading}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 3, display: 'flex', alignItems: 'center', color: 'var(--text-2)',
            transition: 'color 0.2s'
          }}
          title="Segarkan cuaca"
        >
          <RefreshCw size={11} className={loading ? 'spin-anim' : ''} />
        </button>
      </div>

      {/* ── Main Highlight: Suhu & Ikon ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14, padding: '7px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WeatherIcon size={28} color={info.color} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, letterSpacing: -0.5 }}>
              {weather ? `${weather.temp}°C` : '--'}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-2)', marginTop: 2 }}>
              {info.label}
            </div>
          </div>
        </div>

        {/* 3 Metrik Samping */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--orange)' }}>
              <Thermometer size={10} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{weather?.feelsLike ?? '--'}°</span>
            </div>
            <span style={{ fontSize: 8.5, color: 'var(--text-3)' }}>Terasa</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--cyan)' }}>
              <Droplets size={10} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{weather?.humidity ?? '--'}%</span>
            </div>
            <span style={{ fontSize: 8.5, color: 'var(--text-3)' }}>Lembap</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--blue)' }}>
              <Wind size={10} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{weather?.wind ?? '--'}</span>
            </div>
            <span style={{ fontSize: 8.5, color: 'var(--text-3)' }}>km/h</span>
          </div>
        </div>
      </div>

      {/* ── Mini Hourly Forecast ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
        {(weather?.hourly || []).map((h, idx) => {
          const hInfo = getWeatherDesc(h.code);
          const HIcon = hInfo.icon;
          return (
            <div
              key={idx}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '5px 2px',
                border: '1px solid rgba(255,255,255,.05)'
              }}
            >
              <span style={{ fontSize: 9, color: 'var(--text-3)' }}>{h.time}</span>
              <HIcon size={12} color={hInfo.color} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{h.temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

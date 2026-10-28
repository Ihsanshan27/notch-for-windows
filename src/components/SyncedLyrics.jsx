import React, { useState, useEffect, useRef } from "react";
import { Music, AlignLeft, RotateCcw, Search, AlertCircle } from "lucide-react";

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

function cleanMetadata(title, artist) {
   let t = (title || "")
      .replace(/\s*\(feat\.?[^)]*\)/gi, "")
      .replace(/\s*\[feat\.?[^\]]*\]/gi, "")
      .replace(/\s*\(with[^)]*\)/gi, "")
      .replace(/\s*\[with[^\]]*\]/gi, "")
      .replace(/\s*\(official[^)]*\)/gi, "")
      .replace(/\s*\[official[^\]]*\]/gi, "")
      .replace(/\s*\(remastered[^)]*\)/gi, "")
      .replace(/\s*\[remastered[^\]]*\]/gi, "")
      .replace(/\s*-\s*remastered.*/gi, "")
      .replace(/\s*\(lyrics?\)/gi, "")
      .replace(/\s*\[lyrics?\]/gi, "")
      .replace(/\s*\(audio\)/gi, "")
      .replace(/\s*\[audio\]/gi, "")
      .trim();

   let a = (artist || "")
      .replace(/\s*-\s*topic/gi, "")
      .replace(/\s*vevo/gi, "")
      .trim();

   // Ambil nama artis utama (sebelum koma / feat)
   if (a) {
      a = a.split(/[,;&\/]| feat\.? | ft\.? /i)[0].trim();
   }

   return { cleanTitle: t, cleanArtist: a };
}

function parseLRC(raw) {
   if (!raw) return [];
   const lines = [];
   const regex = /\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g;

   for (const rawLine of raw.split("\n")) {
      const text = rawLine.replace(/\[\d+:\d{2}(?:[.:]\d{1,3})?\]/g, "").trim();
      if (!text) continue;

      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(rawLine)) !== null) {
         const min = parseInt(match[1], 10);
         const sec = parseInt(match[2], 10);
         const fracStr = match[3] || "0";
         const frac = parseFloat("0." + fracStr);
         const time = min * 60 + sec + frac;
         lines.push({ time, text });
      }
   }

   return lines.sort((a, b) => a.time - b.time);
}

export default function SyncedLyrics({ title, artist, isPlaying, progressSeconds = 0, onSeek }) {
   const [lyrics, setLyrics] = useState([]);
   const [plain, setPlain] = useState("");
   const [activeIdx, setActiveIdx] = useState(-1);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [lyricOffset, setLyricOffset] = useState(0); // Offset dalam detik
   const [manualSearch, setManualSearch] = useState("");
   const [showManualInput, setShowManualInput] = useState(false);

   const containerRef = useRef(null);
   const itemRefs = useRef([]);

   const fetchLyrics = async (qTitle, qArtist) => {
      setLyrics([]);
      setPlain("");
      setError("");
      setLoading(true);

      try {
         // 1. Direct query via /api/get jika artis tersedia
         if (qArtist) {
            const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(qTitle)}&artist_name=${encodeURIComponent(qArtist)}`;
            try {
               const r = await fetch(getUrl);
               if (r.ok) {
                  const data = await r.json();
                  if (data.syncedLyrics) {
                     setLyrics(parseLRC(data.syncedLyrics));
                     setLoading(false);
                     return;
                  } else if (data.plainLyrics) {
                     setPlain(data.plainLyrics);
                     setLoading(false);
                     return;
                  }
               }
            } catch {}
         }

         // 2. Query search via /api/search
         const queryStr = qArtist ? `${qTitle} ${qArtist}` : qTitle;
         const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(queryStr)}`;
         const sRes = await fetch(searchUrl);
         if (sRes.ok) {
            const list = await sRes.json();
            if (Array.isArray(list) && list.length > 0) {
               const withSynced = list.find((item) => item.syncedLyrics);
               if (withSynced) {
                  setLyrics(parseLRC(withSynced.syncedLyrics));
                  setLoading(false);
                  return;
               }
               const withPlain = list.find((item) => item.plainLyrics);
               if (withPlain) {
                  setPlain(withPlain.plainLyrics);
                  setLoading(false);
                  return;
               }
            }
         }

         // 3. Fallback search hanya dengan judul lagu
         if (qArtist) {
            const trackOnlyUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(qTitle)}`;
            try {
               const tRes = await fetch(trackOnlyUrl);
               if (tRes.ok) {
                  const tList = await tRes.json();
                  if (Array.isArray(tList) && tList.length > 0) {
                     const match = tList.find((item) => item.syncedLyrics) || tList.find((item) => item.plainLyrics);
                     if (match?.syncedLyrics) {
                        setLyrics(parseLRC(match.syncedLyrics));
                        setLoading(false);
                        return;
                     } else if (match?.plainLyrics) {
                        setPlain(match.plainLyrics);
                        setLoading(false);
                        return;
                     }
                  }
               }
            } catch {}
         }

         setError("Lirik tidak ditemukan di LRCLIB");
         setShowManualInput(true);
      } catch (err) {
         setError("Koneksi gagal memuat lirik");
         setShowManualInput(true);
      } finally {
         setLoading(false);
      }
   };

   // Fetch lirik saat lagu berubah
   useEffect(() => {
      if (!title) return;
      setShowManualInput(false);

      if (title.toLowerCase().includes("starboy")) {
         setLyrics(parseLRC(STARBOY_LRC));
         setPlain("");
         setError("");
         setLoading(false);
         return;
      }

      const { cleanTitle: cTitle, cleanArtist: cArtist } = cleanMetadata(title, artist);
      const searchTarget = cTitle || title;
      if (!searchTarget) return;

      setManualSearch(`${searchTarget} ${cArtist || ""}`.trim());
      fetchLyrics(searchTarget, cArtist);
   }, [title, artist]);

   // Lacak baris aktif dengan presisi sub-detik
   useEffect(() => {
      if (!lyrics.length) return;

      const effectiveTime = progressSeconds + lyricOffset;
      let idx = -1;

      for (let i = 0; i < lyrics.length; i++) {
         if (lyrics[i].time <= effectiveTime) {
            idx = i;
         } else {
            break;
         }
      }

      if (idx !== activeIdx) {
         setActiveIdx(idx);
         if (idx >= 0) {
            const el = itemRefs.current[idx];
            const container = containerRef.current;
            if (el && container) {
               const targetTop =
                  el.offsetTop -
                  container.clientHeight / 2 +
                  el.clientHeight / 2;
               container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
            }
         }
      }
   }, [progressSeconds, lyrics, activeIdx, lyricOffset]);

   const handleManualSubmit = (e) => {
      e?.preventDefault();
      if (!manualSearch.trim()) return;
      fetchLyrics(manualSearch.trim(), "");
   };

   if (loading) {
      return (
         <div style={{ padding: "14px 0", textAlign: "center", fontSize: 11, color: "var(--text-2)" }}>
            Memuat lirik karaoke…
         </div>
      );
   }

   if (error && !lyrics.length && !plain) {
      return (
         <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 4px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 10.5, color: "var(--text-3)" }}>
               <AlertCircle size={11} color="var(--orange)" />
               <span>{error}</span>
            </div>
            {showManualInput && (
               <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 4, marginTop: 2 }}>
                  <input
                     type="text"
                     value={manualSearch}
                     onChange={(e) => setManualSearch(e.target.value)}
                     placeholder="Cari lagu / artis manual..."
                     style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 10,
                        color: "var(--text-1)",
                        outline: "none",
                     }}
                  />
                  <button
                     type="submit"
                     className="btn"
                     style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700 }}
                  >
                     <Search size={10} />
                  </button>
               </form>
            )}
         </div>
      );
   }

   if (plain) {
      return (
         <div
            className="lyrics-container"
            style={{
               fontSize: 11,
               color: "var(--text-2)",
               lineHeight: 1.6,
               whiteSpace: "pre-wrap",
            }}
         >
            {plain}
         </div>
      );
   }

   if (!lyrics.length) return null;

   return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
         {/* Stream lirik karaoke yang sinkron */}
         <div ref={containerRef} className="lyrics-container">
            {lyrics.map((l, i) => {
               const isActive = i === activeIdx;
               return (
                  <div
                     key={i}
                     ref={(el) => (itemRefs.current[i] = el)}
                     className={`lyric-line${isActive ? " active" : ""}`}
                     onClick={() => onSeek?.(l.time)}
                     title={`Lompat ke ${Math.floor(l.time / 60)}:${String(Math.floor(l.time % 60)).padStart(2, "0")}`}
                  >
                     {l.text}
                  </div>
               );
            })}
         </div>

         {/* Bar Kalibrasi Sync Karaoke */}
         <div
            style={{
               display: "flex",
               alignItems: "center",
               justifyContent: "space-between",
               padding: "3px 4px 0 4px",
               fontSize: 9,
               color: "var(--text-3)",
               borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
         >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
               <span>Sync:</span>
               <span
                  style={{
                     color: lyricOffset === 0 ? "var(--text-2)" : "var(--cyan)",
                     fontWeight: 700,
                     fontVariantNumeric: "tabular-nums",
                  }}
               >
                  {lyricOffset > 0 ? `+${lyricOffset.toFixed(1)}s` : `${lyricOffset.toFixed(1)}s`}
               </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
               <button
                  className="btn"
                  style={{ padding: "1px 5px", fontSize: 8.5 }}
                  onClick={() => setLyricOffset((prev) => +(prev - 0.5).toFixed(1))}
                  title="Perlambat lirik 0.5s"
               >
                  -0.5s
               </button>
               {lyricOffset !== 0 && (
                  <button
                     className="btn"
                     style={{ padding: "1px 4px" }}
                     onClick={() => setLyricOffset(0)}
                     title="Reset offset"
                  >
                     <RotateCcw size={8} />
                  </button>
               )}
               <button
                  className="btn"
                  style={{ padding: "1px 5px", fontSize: 8.5 }}
                  onClick={() => setLyricOffset((prev) => +(prev + 0.5).toFixed(1))}
                  title="Percepat lirik 0.5s"
               >
                  +0.5s
               </button>
            </div>
         </div>
      </div>
   );
}

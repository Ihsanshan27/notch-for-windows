import React, { useState, useEffect, useRef } from 'react';

// Tracks cursor and provides (dx, dy) normalised offsets (-1..1) relative to window centre
export default function MascotEye({ isPlaying = false, isIdle = false }) {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [blinkLeft,  setBlinkLeft]  = useState(false);
  const [blinkRight, setBlinkRight] = useState(false);
  const animRef = useRef(null);

  // Track mouse globally
  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / (window.innerWidth  / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      // Clamp pupil offset to max 4px
      setEyeOffset({ x: Math.max(-4, Math.min(4, dx * 4)), y: Math.max(-4, Math.min(4, dy * 4)) });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Natural random blink
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 4000;
      animRef.current = setTimeout(() => {
        const both = Math.random() > 0.7;
        setBlinkLeft(true);
        if (both) setBlinkRight(true);
        setTimeout(() => { setBlinkLeft(false); setBlinkRight(false); }, 140);
        setTimeout(() => {
          if (Math.random() > 0.6) { // double blink
            setBlinkLeft(true); if (both) setBlinkRight(true);
            setTimeout(() => { setBlinkLeft(false); setBlinkRight(false); }, 120);
          }
        }, 250);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(animRef.current);
  }, []);

  // Eye mood: playing → happy squint; idle → sleepy half; default → normal
  const eyeH    = isIdle ? 9 : 18;
  const pupilSz = isIdle ? 4 : isPlaying ? 6 : 8;

  const Eye = ({ blink }) => (
    <div className={`eye${blink ? ' blink' : ''}`} style={{ height: eyeH, width: 18, borderRadius: isPlaying ? '50% 50% 40% 40%' : '50%' }}>
      <div
        className="pupil"
        style={{
          width: pupilSz, height: pupilSz,
          transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
        }}
      />
    </div>
  );

  return (
    <div className="eye-container">
      <Eye blink={blinkLeft} />
      <Eye blink={blinkRight} />
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';

// Idle screensaver with a few moods. One is chosen at random each time it wakes
// (or forced via the `matrix` / `starfield` CLI commands). Any key or the mouse
// dismisses it (handled by the engine).
const LOGO_COLORS = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#fc7c54', '#f0f0f0', '#7ca8fc'];
const MODES = ['logo', 'stars', 'matrix', 'pipes'];

export default function Screensaver({ logo, mode }) {
  // lock in a mode for this activation (respect a forced one, else pick random)
  const [chosen] = useState(() => mode || MODES[(Math.random() * MODES.length) | 0]);
  const reduce = typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden cursor-none">
      {chosen === 'logo' || reduce
        ? <LogoSaver logo={logo} reduce={reduce} />
        : <CanvasSaver mode={chosen} />}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[#3a3a3a] text-[11px]">
        press any key or move the mouse
      </div>
    </div>
  );
}

// The classic DVD-style bouncing ROHAN-DOS logo.
function LogoSaver({ logo, reduce }) {
  const boxRef = useRef(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (reduce) { box.style.left = '50%'; box.style.top = '50%'; box.style.transform = 'translate(-50%,-50%)'; return; }
    let x = 90, y = 70, vx = 1.7, vy = 1.25, ci = 0, raf = 0;
    box.style.color = LOGO_COLORS[0];
    const step = () => {
      const W = window.innerWidth, H = window.innerHeight, bw = box.offsetWidth, bh = box.offsetHeight;
      x += vx; y += vy;
      let hit = false;
      if (x <= 0) { x = 0; vx = -vx; hit = true; } else if (x + bw >= W) { x = W - bw; vx = -vx; hit = true; }
      if (y <= 0) { y = 0; vy = -vy; hit = true; } else if (y + bh >= H) { y = H - bh; vy = -vy; hit = true; }
      if (hit) { ci = (ci + 1) % LOGO_COLORS.length; box.style.color = LOGO_COLORS[ci]; }
      box.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  return (
    <pre ref={boxRef} className="nc-viz absolute top-0 left-0 m-0 text-[13px] leading-[1.05] will-change-transform" style={{ color: '#54fcfc' }}>
      {logo}
    </pre>
  );
}

// Canvas-backed savers: warp starfield, Matrix rain, or drifting DOS "pipes".
function CanvasSaver({ mode }) {
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let raf = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let W = 0, H = 0;
    const resize = () => { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    window.addEventListener('resize', resize);
    const w = () => W / dpr, h = () => H / dpr;

    let run;
    if (mode === 'stars') {
      const N = 240, stars = [];
      for (let i = 0; i < N; i++) stars.push({ x: (Math.random() * 2 - 1), y: (Math.random() * 2 - 1), z: Math.random() });
      run = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, w(), h());
        const cx = w() / 2, cy = h() / 2;
        for (let i = 0; i < N; i++) {
          const s = stars[i]; s.z -= 0.006; if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
          const px = cx + (s.x / s.z) * cx, py = cy + (s.y / s.z) * cy;
          const pz = 0.9 / s.z, r = Math.min(2.4, pz * 0.7);
          const g = Math.min(255, 120 + pz * 60) | 0;
          ctx.fillStyle = 'rgb(' + (g * 0.5 | 0) + ',' + g + ',' + g + ')';
          ctx.fillRect(px, py, r, r);
        }
        raf = requestAnimationFrame(run);
      };
    } else if (mode === 'matrix') {
      const glyphs = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾﾀﾁﾂﾃ0123456789@#$%&ABCDEF<>=/'.split('');
      const fs = 16, cols = Math.floor(w() / fs);
      const drops = new Array(cols).fill(0).map(() => (Math.random() * -40) | 0);
      run = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, w(), h());
        ctx.font = fs + "px 'DejaVu Sans Mono', monospace";
        for (let i = 0; i < cols; i++) {
          const ch = glyphs[(Math.random() * glyphs.length) | 0];
          const x = i * fs, y = drops[i] * fs;
          ctx.fillStyle = '#c8ffd0'; ctx.fillText(ch, x, y);            // bright leading glyph
          ctx.fillStyle = '#22c04a'; ctx.fillText(ch, x, y - fs);      // green trail
          if (y > h() && Math.random() > 0.975) drops[i] = 0; else drops[i]++;
        }
        raf = requestAnimationFrame(run);
      };
    } else { // pipes: growing coloured DOS pipes
      const PC = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#7ca8fc'];
      const grid = 22; let cx = 0, cy = 0, dir = 0, color = PC[0], steps = 0;
      const reseed = () => { cx = (Math.random() * (w() / grid)) | 0; cy = (Math.random() * (h() / grid)) | 0; color = PC[(Math.random() * PC.length) | 0]; dir = (Math.random() * 4) | 0; };
      reseed(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w(), h());
      run = () => {
        for (let k = 0; k < 3; k++) {
          if (Math.random() < 0.16) dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
          const dx = [1, 0, -1, 0][dir], dy = [0, 1, 0, -1][dir];
          cx += dx; cy += dy;
          if (cx < 0 || cy < 0 || cx * grid > w() || cy * grid > h()) { reseed(); }
          ctx.fillStyle = color;
          ctx.fillRect(cx * grid, cy * grid, grid - 4, grid - 4);
          if (++steps % 260 === 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, w(), h()); reseed(); }
        }
        raf = requestAnimationFrame(run);
      };
    }
    raf = requestAnimationFrame(run);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [mode]);

  return <canvas ref={cvRef} className="absolute inset-0 w-full h-full" />;
}

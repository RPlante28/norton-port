import { useRef, useEffect, useState } from 'react';

// Idle screensaver with several moods, each with its own speed and options set
// in Configuration. A random enabled mode is chosen when it wakes (or one is
// forced via the matrix / starfield / pipes CLI commands). Any key or the mouse
// dismisses it (handled by the engine).
const LOGO_COLORS = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#fc7c54', '#f0f0f0', '#7ca8fc'];

export default function Screensaver({ logo, mode, cfg }) {
  const [chosen] = useState(() => mode || 'logo');
  const reduce = typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = (cfg && cfg.speed && cfg.speed[chosen]) || 1;

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden cursor-none">
      {chosen === 'logo' || reduce
        ? <LogoSaver logo={logo} reduce={reduce} speed={speed} />
        : <CanvasSaver mode={chosen} speed={speed} cfg={cfg} />}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[#3a3a3a] text-[11px]">
        press any key or move the mouse
      </div>
    </div>
  );
}

// The classic DVD-style bouncing ROHAN-DOS logo.
function LogoSaver({ logo, reduce, speed }) {
  const boxRef = useRef(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (reduce) { box.style.left = '50%'; box.style.top = '50%'; box.style.transform = 'translate(-50%,-50%)'; return; }
    const sp = speed || 1;
    let x = 90, y = 70, vx = 1.15 * sp, vy = 0.85 * sp, ci = 0, raf = 0;
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
  }, [reduce, speed]);
  return (
    <pre ref={boxRef} className="nc-viz absolute top-0 left-0 m-0 text-[13px] leading-[1.05] will-change-transform" style={{ color: '#54fcfc' }}>
      {logo}
    </pre>
  );
}

function CanvasSaver({ mode, speed, cfg }) {
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
    const sp = speed || 1;
    let last = 0;

    let tick;
    if (mode === 'stars') tick = starsMode(ctx, w, h, sp, cfg);
    else if (mode === 'matrix') tick = matrixMode(ctx, w, h, sp, cfg);
    else tick = pipesMode(ctx, w, h, sp);

    const loop = (t) => {
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [mode, speed, cfg]);

  return <canvas ref={cvRef} className="absolute inset-0 w-full h-full" />;
}

// ---- warp starfield in the site's phosphor palette, with optional shooting stars
function starsMode(ctx, w, h, sp, cfg) {
  const opt = (cfg && cfg.stars) || { shooting: true };
  const N = 220, stars = [];
  for (let i = 0; i < N; i++) stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() });
  const shots = [];
  return (dt) => {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(0, 0, w(), h());
    const cx = w() / 2, cy = h() / 2;
    for (let i = 0; i < N; i++) {
      const s = stars[i]; s.z -= 0.0032 * sp; if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
      const px = cx + (s.x / s.z) * cx, py = cy + (s.y / s.z) * cy, pz = 0.9 / s.z, r = Math.min(2.4, pz * 0.6);
      const b = Math.min(255, 150 + pz * 55) | 0;                    // near stars = brighter cyan-white
      ctx.fillStyle = 'rgb(' + (b * 0.55 | 0) + ',' + b + ',' + b + ')';
      ctx.fillRect(px, py, r, r);
    }
    if (opt.shooting) {
      if (Math.random() < 0.012) shots.push({ x: Math.random() * w() * 0.6, y: Math.random() * h() * 0.4, vx: 240 + Math.random() * 170, vy: 110 + Math.random() * 80, life: 0 });
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.life += dt; const nx = s.x + s.vx * dt * sp, ny = s.y + s.vy * dt * sp;
        ctx.strokeStyle = 'rgba(120,252,252,' + Math.max(0, 0.85 - s.life) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(nx, ny); ctx.stroke();
        s.x = nx; s.y = ny; if (s.life > 1.1 || s.x > w() || s.y > h()) shots.splice(i, 1); }
    }
  };
}

// ---- Matrix rain with a configurable colour (or rainbow)
function matrixMode(ctx, w, h, sp, cfg) {
  const color = (cfg && cfg.matrixColor) || 'green';
  const glyphs = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾﾀﾁﾂﾃ0123456789@#$%&ABCDEF<>=/'.split('');
  const fs = 16; let cols = Math.floor(w() / fs);
  let drops = new Array(cols).fill(0).map(() => (Math.random() * -40) | 0);
  let acc = 0, tt = 0;
  const stepEvery = 0.085 / Math.max(0.3, sp);
  const palette = (i) => {
    if (color === 'rainbow') { const hue = (i * 7 + tt * 40) % 360; return ['hsl(' + hue + ',100%,82%)', 'hsl(' + hue + ',90%,50%)']; }
    if (color === 'amber') return ['#ffe7b4', '#c8902a'];
    if (color === 'cyan') return ['#ccffff', '#2ab6c8'];
    return ['#c8ffd0', '#22c04a'];
  };
  return (dt) => {
    tt += dt; acc += dt;
    ctx.font = fs + "px 'DejaVu Sans Mono', monospace";
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, w(), h());
    if (acc < stepEvery) return; acc = 0;
    const nc = Math.floor(w() / fs); if (nc !== cols) { cols = nc; drops = new Array(cols).fill(0).map(() => (Math.random() * -40) | 0); }
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[(Math.random() * glyphs.length) | 0], x = i * fs, y = drops[i] * fs, pal = palette(i);
      ctx.fillStyle = pal[1]; ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], x, y - fs);
      ctx.fillStyle = pal[0]; ctx.fillText(ch, x, y);
      if (y > h() && Math.random() > 0.975) drops[i] = 0; else drops[i]++;
    }
  };
}

// ---- Blocky pipes: connected square tiles that grow from an edge, turn, branch
// at junctions, and run to the ends of the screen (never a lone pop-in/out).
function pipesMode(ctx, w, h, sp) {
  // bright foreground pipes + dimmed background pipes -> a sense of depth
  const BRIGHT = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#7ca8fc', '#fca85c'];
  const DIM = BRIGHT.map((c) => '#' + c.slice(1).match(/../g).map((h2) => Math.round(parseInt(h2, 16) * 0.34).toString(16).padStart(2, '0')).join(''));
  const G = 18, DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const cols = () => Math.floor(w() / G), rows = () => Math.floor(h() / G);
  const MIN = 6;
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w(), h());
  let heads = [], trail = [], drawn = 0, sinceReset = 0;

  function pickColor() { const i = (Math.random() * BRIGHT.length) | 0; return Math.random() < 0.5 ? DIM[i] : BRIGHT[i]; }
  // a discrete square with a small gap, the way the pipes were originally drawn;
  // consecutive squares chain together into a connected pipe, dim vs bright give depth
  function cell(gx, gy, color) { ctx.fillStyle = color; ctx.fillRect(gx * G + 1, gy * G + 1, G - 3, G - 3); }
  function newHead(gx, gy, dir, color) { return { gx, gy, dir, color, acc: 0, speed: (3 + Math.random() * 6) * sp }; }
  function seedEdge() {                   // start on a screen edge, heading inward
    const side = (Math.random() * 4) | 0, C = cols(), R = rows(); let gx, gy, dir;
    if (side === 0) { gx = 0; gy = (Math.random() * R) | 0; dir = 0; }
    else if (side === 1) { gx = C - 1; gy = (Math.random() * R) | 0; dir = 2; }
    else if (side === 2) { gx = (Math.random() * C) | 0; gy = 0; dir = 1; }
    else { gx = (Math.random() * C) | 0; gy = R - 1; dir = 3; }
    heads.push(newHead(gx, gy, dir, pickColor()));
  }
  function branchFromTrail() {            // a new pipe grows out of an existing one (stays connected)
    if (!trail.length) { seedEdge(); return; }
    const c = trail[(Math.random() * trail.length) | 0];
    heads.push(newHead(c.gx, c.gy, (Math.random() * 4) | 0, pickColor()));
  }
  for (let i = 0; i < MIN; i++) seedEdge();

  return (dt) => {
    sinceReset += dt;
    for (let i = heads.length - 1; i >= 0; i--) {
      const hd = heads[i]; hd.acc += hd.speed * dt; let steps = 0, dead = false;
      while (hd.acc >= 1 && steps < 4) {
        hd.acc -= 1; steps++;
        cell(hd.gx, hd.gy, hd.color); drawn++;
        if (trail.length < 1200) trail.push({ gx: hd.gx, gy: hd.gy }); else trail[(Math.random() * trail.length) | 0] = { gx: hd.gx, gy: hd.gy };
        let dir = hd.dir; const r = Math.random();
        if (r < 0.18) dir = (hd.dir + 1) % 4; else if (r < 0.36) dir = (hd.dir + 3) % 4;
        if (Math.random() < 0.05 && heads.length < 16) { const bd = (hd.dir + (Math.random() < 0.5 ? 1 : 3)) % 4; heads.push(newHead(hd.gx, hd.gy, bd, hd.color)); }   // junction
        const nx = hd.gx + DIRS[dir][0], ny = hd.gy + DIRS[dir][1];
        if (nx < 0 || ny < 0 || nx >= cols() || ny >= rows()) {   // reached an edge: end here, sprout a connected branch
          heads.splice(i, 1); dead = true; break;
        }
        hd.dir = dir; hd.gx = nx; hd.gy = ny;
      }
      if (dead) continue;
    }
    while (heads.length < MIN) branchFromTrail();
    if (sinceReset > 55 || drawn > cols() * rows() * 1.7) { sinceReset = 0; drawn = 0; ctx.fillStyle = 'rgba(5,6,10,0.92)'; ctx.fillRect(0, 0, w(), h()); trail = []; heads = []; for (let i = 0; i < MIN; i++) seedEdge(); }
  };
}

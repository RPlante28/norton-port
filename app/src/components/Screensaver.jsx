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
  const color = (cfg && cfg.starColor) || 'white';
  const N = 220, stars = [];
  for (let i = 0; i < N; i++) stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), hue: Math.random() * 360 });
  const shots = [];
  function starRGB(b, s) {
    switch (color) {
      case 'cyan': return 'rgb(' + (b * 0.4 | 0) + ',' + b + ',' + b + ')';
      case 'amber': return 'rgb(' + b + ',' + (b * 0.74 | 0) + ',' + (b * 0.32 | 0) + ')';
      case 'green': return 'rgb(' + (b * 0.4 | 0) + ',' + b + ',' + (b * 0.5 | 0) + ')';
      case 'rainbow': return 'hsl(' + (s.hue | 0) + ',85%,' + Math.min(82, 46 + b / 5) + '%)';
      default: return 'rgb(' + b + ',' + b + ',' + b + ')';
    }
  }
  const shotColor = { cyan: '120,252,252', amber: '252,206,120', green: '120,252,160', white: '220,235,255' }[color] || '220,235,255';
  return (dt) => {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(0, 0, w(), h());
    const cx = w() / 2, cy = h() / 2;
    for (let i = 0; i < N; i++) {
      const s = stars[i]; s.z -= 0.0032 * sp; if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; s.hue = Math.random() * 360; }
      const px = cx + (s.x / s.z) * cx, py = cy + (s.y / s.z) * cy, pz = 0.9 / s.z, r = Math.min(2.4, pz * 0.6);
      const b = Math.min(255, 150 + pz * 55) | 0;
      ctx.fillStyle = starRGB(b, s);
      ctx.fillRect(px, py, r, r);
    }
    if (opt.shooting) {
      if (Math.random() < 0.012) shots.push({ x: Math.random() * w() * 0.6, y: Math.random() * h() * 0.4, vx: 240 + Math.random() * 170, vy: 110 + Math.random() * 80, life: 0, hue: Math.random() * 360 });
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.life += dt; const nx = s.x + s.vx * dt * sp, ny = s.y + s.vy * dt * sp;
        ctx.strokeStyle = color === 'rainbow' ? 'hsla(' + (s.hue | 0) + ',90%,70%,' + Math.max(0, 0.85 - s.life) + ')' : 'rgba(' + shotColor + ',' + Math.max(0, 0.85 - s.life) + ')';
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(nx, ny); ctx.stroke();
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

// ---- Pipes: emulates the real 3D Pipes screensaver in 2D. Square pipe segments
// with spherical ball-joints at every start and turn, confined to the box, that
// grow, cross over one another, occasionally finish (a new pipe then begins), and
// reset once the screen fills.
function pipesMode(ctx, w, h, sp) {
  const PC = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#7ca8fc', '#fca85c'];
  const grid = 24, seg = 10, half = grid / 2;    // seg = pipe thickness, so joints (radius ~half) read bigger
  const cols = () => Math.floor(w() / grid), rows = () => Math.floor(h() / grid);
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const inb = (x, y) => x >= 0 && y >= 0 && x < cols() && y < rows();
  let occ = new Set(), pipes = [], acc = 0;

  function joint(gx, gy, color) {                 // a square junction fitting (bigger than the pipe)
    const s = seg + 6, x = gx * grid + half - s / 2, y = gy * grid + half - s / 2;
    ctx.fillStyle = color; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.fillRect(x + 2, y + 2, s - 4, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + 2, y + s - 4, s - 4, 2);
  }
  function tube(gx, gy, px, py, color, over) {    // straight segment from prev cell to this one
    const dx = gx - px, dy = gy - py;
    const x = Math.min(gx, px) * grid + half - seg / 2, y = Math.min(gy, py) * grid + half - seg / 2;
    if (over) { ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(gx * grid + half - seg / 2 - 2, gy * grid + half - seg / 2 - 2, seg + 4, seg + 4); }  // dim what's underneath at a crossing
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.abs(dx) * grid + seg, Math.abs(dy) * grid + seg);
  }
  function spawn() {
    const x = (Math.random() * cols()) | 0, y = (Math.random() * rows()) | 0;
    const color = PC[(Math.random() * PC.length) | 0], dir = (Math.random() * 4) | 0;
    joint(x, y, color); occ.add(x + ',' + y);
    pipes.push({ cx: x, cy: y, dir, color });
  }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w(), h());
  for (let i = 0; i < 4; i++) spawn();

  return (dt) => {
    acc += 11 * sp * dt;                           // cells/sec per pipe (calm; slowest setting is very gentle)
    let n = acc | 0; acc -= n; if (n > 10) n = 10;
    for (let k = 0; k < n; k++) {
      for (let pi = pipes.length - 1; pi >= 0; pi--) {
        const p = pipes[pi];
        let turned = false;
        if (Math.random() < 0.20) { p.dir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4; turned = true; }  // random elbow
        if (!inb(p.cx + DX[p.dir], p.cy + DY[p.dir])) {                                                     // hit the box wall: pick an inward dir
          const opts = [0, 1, 2, 3].filter((d) => inb(p.cx + DX[d], p.cy + DY[d]));
          p.dir = opts[(Math.random() * opts.length) | 0]; turned = true;
        }
        if (turned) joint(p.cx, p.cy, p.color);                                                             // ball-joint at the bend
        const opx = p.cx, opy = p.cy;
        p.cx += DX[p.dir]; p.cy += DY[p.dir];
        const key = p.cx + ',' + p.cy;
        tube(p.cx, p.cy, opx, opy, p.color, occ.has(key));
        occ.add(key);
        if (Math.random() < 0.004) { joint(p.cx, p.cy, p.color); pipes.splice(pi, 1); spawn(); }            // this pipe finishes; a new one begins with a joint
      }
      if (occ.size > cols() * rows() * 0.78) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, w(), h()); occ.clear(); pipes = []; for (let i = 0; i < 4; i++) spawn(); }   // screen filled: reset
  };
}

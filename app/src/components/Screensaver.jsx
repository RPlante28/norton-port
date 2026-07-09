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

// ---- warp starfield with optional shooting stars, asteroids, galaxies, planets
function starsMode(ctx, w, h, sp, cfg) {
  const opt = (cfg && cfg.stars) || { shooting: true, asteroids: true, galaxies: true, planets: true };
  const N = 200, stars = [];
  for (let i = 0; i < N; i++) stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() });
  const shots = [], rocks = [], planets = [], galaxies = [];
  if (opt.galaxies) for (let i = 0; i < 2; i++) galaxies.push({ x: Math.random() * w(), y: Math.random() * h() * 0.7, r: 40 + Math.random() * 40, vx: (Math.random() - 0.5) * 4, hue: 200 + Math.random() * 120, rot: Math.random() * 6 });
  function spawnRock() { rocks.push({ x: w() + 20, y: Math.random() * h(), vx: -(18 + Math.random() * 26), size: 4 + Math.random() * 7, rot: 0, vr: (Math.random() - 0.5) * 2 }); }
  function spawnPlanet() { planets.push({ x: w() + 60, y: 40 + Math.random() * (h() * 0.5), vx: -(10 + Math.random() * 10), r: 16 + Math.random() * 16, hue: Math.random() * 360, ring: Math.random() < 0.5 }); }
  if (opt.asteroids) for (let i = 0; i < 3; i++) spawnRock();
  if (opt.planets && Math.random() < 0.6) spawnPlanet();

  return (dt) => {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, w(), h());
    for (const g of galaxies) {
      g.x += g.vx * dt * sp; g.rot += dt * 0.2; if (g.x < -g.r * 2) g.x = w() + g.r;
      const grd = ctx.createRadialGradient(g.x, g.y, 2, g.x, g.y, g.r);
      grd.addColorStop(0, 'hsla(' + g.hue + ',70%,80%,0.5)'); grd.addColorStop(1, 'hsla(' + g.hue + ',70%,40%,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 7); ctx.fill();
      ctx.fillStyle = 'hsla(' + g.hue + ',60%,85%,0.5)';
      for (let a = 0; a < 40; a++) { const rr = (a / 40) * g.r, an = a * 0.5 + g.rot; ctx.fillRect(g.x + Math.cos(an) * rr, g.y + Math.sin(an) * rr, 1, 1); }
    }
    const cx = w() / 2, cy = h() / 2;
    for (let i = 0; i < N; i++) {
      const s = stars[i]; s.z -= 0.0032 * sp; if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
      const px = cx + (s.x / s.z) * cx, py = cy + (s.y / s.z) * cy, pz = 0.9 / s.z, r = Math.min(2.4, pz * 0.6), g = Math.min(255, 130 + pz * 55) | 0;
      ctx.fillStyle = 'rgb(' + (g * 0.55 | 0) + ',' + g + ',' + g + ')'; ctx.fillRect(px, py, r, r);
    }
    if (opt.planets) { if (Math.random() < 0.0016) spawnPlanet();
      for (let i = planets.length - 1; i >= 0; i--) { const p = planets[i]; p.x += p.vx * dt * sp; if (p.x < -80) { planets.splice(i, 1); continue; }
        ctx.fillStyle = 'hsl(' + p.hue + ',45%,55%)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        ctx.fillStyle = 'hsla(' + p.hue + ',45%,30%,0.6)'; ctx.beginPath(); ctx.arc(p.x + p.r * 0.3, p.y - p.r * 0.2, p.r * 0.7, 0, 7); ctx.fill();
        if (p.ring) { ctx.strokeStyle = 'hsla(' + p.hue + ',50%,75%,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.7, p.r * 0.55, 0.5, 0, 7); ctx.stroke(); } }
    }
    if (opt.asteroids) { if (Math.random() < 0.02) spawnRock(); ctx.fillStyle = '#8a8f98';
      for (let i = rocks.length - 1; i >= 0; i--) { const r = rocks[i]; r.x += r.vx * dt * sp; r.rot += r.vr * dt; if (r.x < -20) { rocks.splice(i, 1); continue; }
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot); ctx.beginPath();
        for (let a = 0; a < 7; a++) { const an = (a / 7) * 6.28, rr = r.size * (0.7 + (a % 2) * 0.4); ctx[a ? 'lineTo' : 'moveTo'](Math.cos(an) * rr, Math.sin(an) * rr); }
        ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    if (opt.shooting) { if (Math.random() < 0.014) shots.push({ x: Math.random() * w() * 0.6, y: Math.random() * h() * 0.4, vx: 260 + Math.random() * 180, vy: 120 + Math.random() * 90, life: 0 });
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.life += dt; const nx = s.x + s.vx * dt * sp, ny = s.y + s.vy * dt * sp;
        ctx.strokeStyle = 'rgba(220,235,255,' + Math.max(0, 0.9 - s.life) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(nx, ny); ctx.stroke();
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
  const PC = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#7ca8fc', '#fca85c'];
  const G = 18, DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const cols = () => Math.floor(w() / G), rows = () => Math.floor(h() / G);
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w(), h());
  let heads = [], trail = [], drawn = 0, sinceReset = 0;

  function cell(gx, gy, color) {          // one connected square with a little 3D shading
    const x = gx * G, y = gy * G;
    ctx.fillStyle = color; ctx.fillRect(x, y, G, G);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x + 2, y + 2, G - 4, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(x + 2, y + G - 4, G - 4, 2);
  }
  function newHead(gx, gy, dir, color) { return { gx, gy, dir, color, acc: 0, speed: (3 + Math.random() * 6) * sp }; }
  function seedEdge() {                   // start on a screen edge, heading inward
    const side = (Math.random() * 4) | 0, C = cols(), R = rows(); let gx, gy, dir;
    if (side === 0) { gx = 0; gy = (Math.random() * R) | 0; dir = 0; }
    else if (side === 1) { gx = C - 1; gy = (Math.random() * R) | 0; dir = 2; }
    else if (side === 2) { gx = (Math.random() * C) | 0; gy = 0; dir = 1; }
    else { gx = (Math.random() * C) | 0; gy = R - 1; dir = 3; }
    heads.push(newHead(gx, gy, dir, PC[(Math.random() * PC.length) | 0]));
  }
  function branchFromTrail() {            // a new pipe grows out of an existing one (stays connected)
    if (!trail.length) { seedEdge(); return; }
    const c = trail[(Math.random() * trail.length) | 0];
    heads.push(newHead(c.gx, c.gy, (Math.random() * 4) | 0, PC[(Math.random() * PC.length) | 0]));
  }
  seedEdge(); seedEdge();

  return (dt) => {
    sinceReset += dt;
    for (let i = heads.length - 1; i >= 0; i--) {
      const hd = heads[i]; hd.acc += hd.speed * dt; let steps = 0, dead = false;
      while (hd.acc >= 1 && steps < 4) {
        hd.acc -= 1; steps++;
        cell(hd.gx, hd.gy, hd.color); drawn++;
        if (trail.length < 700) trail.push({ gx: hd.gx, gy: hd.gy }); else trail[(Math.random() * trail.length) | 0] = { gx: hd.gx, gy: hd.gy };
        let dir = hd.dir; const r = Math.random();
        if (r < 0.18) dir = (hd.dir + 1) % 4; else if (r < 0.36) dir = (hd.dir + 3) % 4;
        if (Math.random() < 0.04 && heads.length < 7) { const bd = (hd.dir + (Math.random() < 0.5 ? 1 : 3)) % 4; heads.push(newHead(hd.gx, hd.gy, bd, hd.color)); }   // junction
        const nx = hd.gx + DIRS[dir][0], ny = hd.gy + DIRS[dir][1];
        if (nx < 0 || ny < 0 || nx >= cols() || ny >= rows()) {   // reached an edge: end here, sprout a connected branch
          heads.splice(i, 1); if (heads.length < 3) branchFromTrail(); dead = true; break;
        }
        hd.dir = dir; hd.gx = nx; hd.gy = ny;
      }
      if (dead) continue;
    }
    if (!heads.length) branchFromTrail();
    if (sinceReset > 34 || drawn > cols() * rows() * 1.5) { sinceReset = 0; drawn = 0; ctx.fillStyle = 'rgba(5,6,10,0.9)'; ctx.fillRect(0, 0, w(), h()); trail = []; heads = []; seedEdge(); seedEdge(); }
  };
}

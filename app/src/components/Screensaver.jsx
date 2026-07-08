import { useRef, useEffect } from 'react';

// A DVD-style bouncing-logo screensaver that appears after a stretch of idle.
// The ROHAN-DOS logo drifts around and changes colour every time it hits a wall.
const COLORS = ['#54fcfc', '#fcfc54', '#fc7cf0', '#54fc7c', '#fc7c54', '#f0f0f0', '#7ca8fc'];

export default function Screensaver({ logo }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      // no motion: just centre the logo
      box.style.left = '50%';
      box.style.top = '50%';
      box.style.transform = 'translate(-50%,-50%)';
      return;
    }
    let x = 90,
      y = 70,
      vx = 1.7,
      vy = 1.25,
      ci = 0,
      raf = 0;
    box.style.color = COLORS[0];
    const step = () => {
      const W = window.innerWidth,
        H = window.innerHeight,
        bw = box.offsetWidth,
        bh = box.offsetHeight;
      x += vx;
      y += vy;
      let hit = false;
      if (x <= 0) { x = 0; vx = -vx; hit = true; }
      else if (x + bw >= W) { x = W - bw; vx = -vx; hit = true; }
      if (y <= 0) { y = 0; vy = -vy; hit = true; }
      else if (y + bh >= H) { y = H - bh; vy = -vy; hit = true; }
      if (hit) { ci = (ci + 1) % COLORS.length; box.style.color = COLORS[ci]; }
      box.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden cursor-none">
      <pre
        ref={boxRef}
        className="nc-viz absolute top-0 left-0 m-0 text-[13px] leading-[1.05] will-change-transform"
        style={{ color: '#54fcfc' }}
      >
        {logo}
      </pre>
      <div className="absolute bottom-4 left-0 right-0 text-center text-[#3a3a3a] text-[11px]">
        press any key or move the mouse
      </div>
    </div>
  );
}

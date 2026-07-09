import { useState, useEffect } from 'react';

// Live clock in the top-right, like Norton Commander. Self-contained so only it
// re-renders each second, not the whole menu bar.
function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  let h = t.getHours();
  const ap = h < 12 ? 'a' : 'p';
  h = h % 12 || 12;
  const mm = String(t.getMinutes()).padStart(2, '0');
  const ss = String(t.getSeconds()).padStart(2, '0');
  return <span className="px-2">{`${h}:${mm}:${ss}${ap}`}</span>;
}

// Top pull-down menu bar (Left / Files / Commands / Options / Right).
// Tailwind for structure; dynamic tab/item colors stay inline since they're
// computed per-state in the engine.
export default function MenuBar({ menus, anyMenuOpen, closeMenu }) {
  return (
    <>
      <div className="relative z-[60] flex flex-none items-center h-[22px] px-1 text-[13px] bg-cyan text-dos-blue">
        {menus.map((m) => (
          <div key={m.id} className="relative" onMouseEnter={m.onEnter}>
            <span
              onClick={m.onClick}
              className="nc-mtab inline-block cursor-pointer px-3 max-[700px]:px-1.5 py-px"
              style={{ background: m.tabBg, color: m.tabFg }}
            >
              {m.label}
            </span>
            {m.isOpen && (
              <div className="absolute top-[21px] left-0 min-w-[230px] py-0.5 bg-cyan text-dos-blue border border-dos-blue shadow-[3px_3px_0_#000050]">
                {m.items.map((it, ii) => (
                  <div
                    key={ii}
                    onClick={it.onClick}
                    className="nc-mitem cursor-pointer whitespace-nowrap px-3.5 py-0.5"
                    style={{ color: it.color }}
                  >
                    {it.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <span className="flex-1" />
        <Clock />
        <span className="px-1.5 max-[700px]:hidden">ROHAN-DOS</span>
      </div>
      {anyMenuOpen && <div onClick={closeMenu} className="fixed inset-0 z-[55]" />}
    </>
  );
}

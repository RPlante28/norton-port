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
              className="nc-mtab inline-block cursor-pointer px-3 py-px"
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
        <span className="px-1.5">ROHAN-DOS</span>
      </div>
      {anyMenuOpen && <div onClick={closeMenu} className="fixed inset-0 z-[55]" />}
    </>
  );
}

// Configuration dialog: panel toggles, CRT-intensity slider, and the keyboard /
// mouse sound "jumper" tuning bars. Dynamic per-state values (opacity, chosen
// colors/weights) stay inline; everything structural is Tailwind.
export default function ConfigDialog({ v }) {
  const bar = 'flex shrink-0 cursor-ew-resize select-none text-dos-blue text-[15px] leading-none';
  const seg = 'px-[0.5px] pointer-events-none';
  const val = 'text-[#06457a] whitespace-nowrap text-[12px]';

  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[420px] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}
    >
      <div className="bg-dos-blue text-cyan text-center p-[3px] font-bold">Configuration</div>
      <div className="border-2 border-black m-2.5">
        <div className="bg-dos-blue text-cyan text-center text-[12px] p-px">Panel Options</div>
        <div className="px-4 py-3">
          {v.cfgRows.map((c, i) => (
            <div key={i} onClick={c.onClick} className="nc-cfg cursor-pointer py-0.5 flex gap-2.5 items-baseline">
              <span className="font-bold" style={{ color: c.boxColor }}>
                {c.box}
              </span>
              <span>{c.label}</span>
            </div>
          ))}
          <div className="flex gap-[9px] items-center mt-1" style={{ opacity: v.crtOpacity }}>
            <span className="whitespace-nowrap w-[148px] shrink-0">CRT line intensity</span>
            <span
              className={bar}
              onMouseDown={v.crtBar.down}
              onMouseMove={v.crtBar.move}
              onMouseUp={v.crtBar.up}
              onMouseLeave={v.crtBar.up}
            >
              {v.crtSegs.map((s, i) => (
                <span key={i} className={seg}>
                  {s.ch}
                </span>
              ))}
            </span>
            <span className={val}>{v.crtPct}</span>
          </div>
          <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]"></div>
          <div className="flex gap-x-[11px] gap-y-[7px] items-baseline flex-wrap" style={{ opacity: v.soundOpacity }}>
            <span className="whitespace-nowrap">Key sound profile:</span>
            {v.soundProfiles.map((p, i) => (
              <span
                key={i}
                onClick={p.onClick}
                className="nc-cfg cursor-pointer whitespace-nowrap"
                style={{ color: p.color, fontWeight: p.weight }}
              >
                {p.mark}
                {p.name}
              </span>
            ))}
          </div>
          <div
            onClick={v.kbAdvToggle}
            className="nc-cfg cursor-pointer mt-[5px] text-[#06457a] text-[12px]"
            title="fine-tune like setting jumpers on a sound card"
          >
            {v.kbAdvCaret} Jumpers (keyboard tuning)
          </div>
          {v.kbAdv && (
            <div className="mt-[3px] mb-0.5 ml-3.5" style={{ opacity: v.soundOpacity }}>
              <div className="flex gap-[9px] items-center mt-1">
                <span className="whitespace-nowrap w-[92px] shrink-0">Pitch</span>
                <span
                  className={bar}
                  onMouseDown={v.pitchBar.down}
                  onMouseMove={v.pitchBar.move}
                  onMouseUp={v.pitchBar.up}
                  onMouseLeave={v.pitchBar.up}
                >
                  {v.pitchSegs.map((s, i) => (
                    <span key={i} className={seg}>
                      {s.ch}
                    </span>
                  ))}
                </span>
                <span className={val}>{v.pitchLabel}</span>
              </div>
              <div className="flex gap-[9px] items-center mt-[5px]">
                <span className="whitespace-nowrap w-[92px] shrink-0">Clickiness</span>
                <span
                  className={bar}
                  onMouseDown={v.clickBar.down}
                  onMouseMove={v.clickBar.move}
                  onMouseUp={v.clickBar.up}
                  onMouseLeave={v.clickBar.up}
                >
                  {v.clickSegs.map((s, i) => (
                    <span key={i} className={seg}>
                      {s.ch}
                    </span>
                  ))}
                </span>
                <span className={val}>{v.clickLabel}</span>
              </div>
            </div>
          )}
          <div className="flex gap-x-[11px] gap-y-[7px] items-baseline flex-wrap mt-[9px]">
            <span className="whitespace-nowrap">Mouse click:</span>
            {v.clickProfiles.map((p, i) => (
              <span
                key={i}
                onClick={p.onClick}
                className="nc-cfg cursor-pointer whitespace-nowrap"
                style={{ color: p.color, fontWeight: p.weight }}
              >
                {p.mark}
                {p.name}
              </span>
            ))}
          </div>
          <div
            onClick={v.mouseAdvToggle}
            className="nc-cfg cursor-pointer mt-[5px] text-[#06457a] text-[12px]"
            title="fine-tune like setting jumpers on a sound card"
          >
            {v.mouseAdvCaret} Jumpers (mouse tuning)
          </div>
          {v.mouseAdv && (
            <div className="mt-[3px] mb-0.5 ml-3.5">
              <div className="flex gap-[9px] items-center mt-1">
                <span className="whitespace-nowrap w-[92px] shrink-0">Pitch</span>
                <span
                  className={bar}
                  onMouseDown={v.mPitchBar.down}
                  onMouseMove={v.mPitchBar.move}
                  onMouseUp={v.mPitchBar.up}
                  onMouseLeave={v.mPitchBar.up}
                >
                  {v.mPitchSegs.map((s, i) => (
                    <span key={i} className={seg}>
                      {s.ch}
                    </span>
                  ))}
                </span>
                <span className={val}>{v.mPitchLabel}</span>
              </div>
              <div className="flex gap-[9px] items-center mt-[5px]">
                <span className="whitespace-nowrap w-[92px] shrink-0">Clickiness</span>
                <span
                  className={bar}
                  onMouseDown={v.mClickBar.down}
                  onMouseMove={v.mClickBar.move}
                  onMouseUp={v.mClickBar.up}
                  onMouseLeave={v.mClickBar.up}
                >
                  {v.mClickSegs.map((s, i) => (
                    <span key={i} className={seg}>
                      {s.ch}
                    </span>
                  ))}
                </span>
                <span className={val}>{v.mClickLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3.5 justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px]">
          &nbsp;Ok&nbsp;
        </span>
        <span onClick={v.closeDialog} className="nc-dlgbtn px-4 py-[3px]">
          Cancel
        </span>
      </div>
    </div>
  );
}

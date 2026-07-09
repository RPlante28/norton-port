import { useState } from 'react';

// Configuration dialog, organised into clickable tabbed sections so it isn't one
// long cluttered list: Panels, Display, Sound, Screensaver. Dynamic per-state
// values (opacity, chosen colors/weights) come from the engine; layout is Tailwind.
export default function ConfigDialog({ v }) {
  const [tab, setTab] = useState('panels');
  const bar = 'flex shrink-0 cursor-ew-resize select-none text-dos-blue text-[15px] leading-none';
  const seg = 'px-[0.5px] pointer-events-none';
  const val = 'text-[#06457a] whitespace-nowrap text-[12px]';

  const byKey = (keys) => v.cfgRows.filter((c) => keys.includes(c.k));
  const Toggle = (c, i) => (
    <div key={i} onClick={c.onClick} className="nc-cfg cursor-pointer py-0.5 flex gap-2.5 items-baseline">
      <span className="font-bold" style={{ color: c.boxColor }}>{c.box}</span>
      <span>{c.label}</span>
    </div>
  );
  const Radio = (items) => items.map((p, i) => (
    <span key={i} onClick={p.onClick} className="nc-cfg cursor-pointer whitespace-nowrap" style={{ color: p.color, fontWeight: p.weight }}>
      {p.mark}{p.name}
    </span>
  ));
  const Slider = (b, segs, label, w) => (
    <div className="flex gap-[9px] items-center mt-1">
      {w && <span className="whitespace-nowrap shrink-0" style={{ width: w }}>{label}</span>}
      <span className={bar} onMouseDown={b.down} onMouseMove={b.move} onMouseUp={b.up} onMouseLeave={b.up}>
        {segs.map((s, i) => <span key={i} className={seg}>{s.ch}</span>)}
      </span>
    </div>
  );

  const tabs = [['panels', 'Panels'], ['display', 'Display'], ['sound', 'Sound'], ['saver', 'Screensaver']];

  return (
    <div onClick={v.stop} className="bg-[#b8b8b8] text-black w-[460px] max-w-[94vw] text-[13.5px]" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}>
      <div className="bg-dos-blue text-cyan text-center p-[3px] font-bold">Configuration</div>

      {/* clickable section tabs, styled like the dialog buttons; active = pressed */}
      <div className="flex gap-2 px-2.5 pt-2.5">
        {tabs.map(([id, label]) => (
          <span key={id} onClick={() => setTab(id)}
            className={'nc-dlgbtn px-3 py-[3px] text-[12.5px] ' + (tab === id ? 'nc-dlgbtn-on font-bold' : '')}>
            {label}
          </span>
        ))}
      </div>

      <div className="border-2 border-black m-2.5 min-h-[232px]">
        <div className="px-4 py-3">

          {tab === 'panels' && (
            <>{byKey(['hidden', 'ins', 'autodir', 'automenu', 'mini']).map(Toggle)}</>
          )}

          {tab === 'display' && (
            <>
              <div className="flex gap-x-[11px] gap-y-[7px] items-baseline flex-wrap">
                <span className="whitespace-nowrap">Monitor:</span>{Radio(v.themes)}
              </div>
              <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]" />
              {byKey(['crt']).map(Toggle)}
              <div className="flex gap-[9px] items-center mt-1" style={{ opacity: v.crtOpacity }}>
                <span className="whitespace-nowrap w-[148px] shrink-0">CRT line intensity</span>
                <span className={bar} onMouseDown={v.crtBar.down} onMouseMove={v.crtBar.move} onMouseUp={v.crtBar.up} onMouseLeave={v.crtBar.up}>
                  {v.crtSegs.map((s, i) => <span key={i} className={seg}>{s.ch}</span>)}
                </span>
                <span className={val}>{v.crtPct}</span>
              </div>
              <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]" />
              <div className="flex gap-x-[11px] gap-y-[7px] items-baseline flex-wrap">
                <span className="whitespace-nowrap">Motion:</span>{Radio(v.motionOpts)}
              </div>
              <div className="text-[#06457a] text-[11.5px] mt-1">Reduced stops the animations and screensavers.</div>
            </>
          )}

          {tab === 'sound' && (
            <>
              {byKey(['keysound', 'bootSound']).map(Toggle)}
              <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]" />
              <div className="flex gap-x-[11px] gap-y-[7px] items-baseline flex-wrap" style={{ opacity: v.soundOpacity }}>
                <span className="whitespace-nowrap">Key sound:</span>{Radio(v.soundProfiles)}
              </div>
              <div onClick={v.kbAdvToggle} className="nc-cfg cursor-pointer mt-[5px] text-[#06457a] text-[12px]" title="fine-tune like setting jumpers on a sound card">
                {v.kbAdvCaret} Jumpers (keyboard tuning)
              </div>
              {v.kbAdv && (
                <div className="mt-[3px] mb-0.5 ml-3.5" style={{ opacity: v.soundOpacity }}>
                  <div className="flex gap-[9px] items-center mt-1"><span className="whitespace-nowrap w-[92px] shrink-0">Pitch</span>
                    <span className={bar} onMouseDown={v.pitchBar.down} onMouseMove={v.pitchBar.move} onMouseUp={v.pitchBar.up} onMouseLeave={v.pitchBar.up}>{v.pitchSegs.map((s, i) => <span key={i} className={seg}>{s.ch}</span>)}</span>
                    <span className={val}>{v.pitchLabel}</span></div>
                  <div className="flex gap-[9px] items-center mt-[5px]"><span className="whitespace-nowrap w-[92px] shrink-0">Clickiness</span>
                    <span className={bar} onMouseDown={v.clickBar.down} onMouseMove={v.clickBar.move} onMouseUp={v.clickBar.up} onMouseLeave={v.clickBar.up}>{v.clickSegs.map((s, i) => <span key={i} className={seg}>{s.ch}</span>)}</span>
                    <span className={val}>{v.clickLabel}</span></div>
                </div>
              )}
              <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]" />
              <div className="flex gap-x-[11px] gap-y-[7px] items-baseline flex-wrap">
                <span className="whitespace-nowrap">Mouse click:</span>{Radio(v.clickProfiles)}
              </div>
              <div onClick={v.mouseAdvToggle} className="nc-cfg cursor-pointer mt-[5px] text-[#06457a] text-[12px]" title="fine-tune like setting jumpers on a sound card">
                {v.mouseAdvCaret} Jumpers (mouse tuning)
              </div>
              {v.mouseAdv && (
                <div className="mt-[3px] mb-0.5 ml-3.5">
                  <div className="flex gap-[9px] items-center mt-1"><span className="whitespace-nowrap w-[92px] shrink-0">Pitch</span>
                    <span className={bar} onMouseDown={v.mPitchBar.down} onMouseMove={v.mPitchBar.move} onMouseUp={v.mPitchBar.up} onMouseLeave={v.mPitchBar.up}>{v.mPitchSegs.map((s, i) => <span key={i} className={seg}>{s.ch}</span>)}</span>
                    <span className={val}>{v.mPitchLabel}</span></div>
                  <div className="flex gap-[9px] items-center mt-[5px]"><span className="whitespace-nowrap w-[92px] shrink-0">Clickiness</span>
                    <span className={bar} onMouseDown={v.mClickBar.down} onMouseMove={v.mClickBar.move} onMouseUp={v.mClickBar.up} onMouseLeave={v.mClickBar.up}>{v.mClickSegs.map((s, i) => <span key={i} className={seg}>{s.ch}</span>)}</span>
                    <span className={val}>{v.mClickLabel}</span></div>
                </div>
              )}
            </>
          )}

          {tab === 'saver' && (
            <>
              <div onClick={v.saverToggle} className="nc-cfg cursor-pointer py-0.5 flex gap-2.5 items-baseline">
                <span className="font-bold" style={{ color: v.saverEnabled ? '#0000a8' : '#06457a' }}>{v.saverEnabledBox}</span>
                <span>Screensavers enabled</span>
              </div>
              <div style={{ opacity: v.saverOpacity }} className={v.saverEnabled ? '' : 'pointer-events-none'}>
                <div className="flex gap-x-2 gap-y-[6px] items-baseline flex-wrap mt-1.5">
                  <span className="whitespace-nowrap">Idle after:</span>
                  {v.saverTimeouts.map((t, i) => (
                    <span key={i} onClick={t.onClick} className="nc-cfg cursor-pointer whitespace-nowrap" style={{ color: t.color, fontWeight: t.weight }}>{t.sel ? '(o) ' : '( ) '}{t.label}</span>
                  ))}
                </div>
                <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]" />
                <div className="whitespace-nowrap mb-1">Enabled savers &amp; speed:</div>
                {v.saverModes.map((m, i) => {
                  const spd = v.saverSpeeds.find((s) => s.key === m.key);
                  return (
                    <div key={i} className="flex items-center gap-2.5 py-[3px]">
                      <span onClick={m.onClick} className="nc-cfg cursor-pointer flex gap-2 items-baseline w-[150px]">
                        <span className="font-bold" style={{ color: m.boxColor }}>{m.box}</span>
                        <span>{m.label}</span>
                      </span>
                      <span className="text-[#06457a] text-[12px]">speed</span>
                      <select className="nc-sel" value={String(spd.value)} onClick={(e) => e.stopPropagation()}
                        onChange={(e) => spd.onChange(parseFloat(e.target.value))}>
                        {v.saverSpeedOpts.map((o, j) => <option key={j} value={String(o.v)}>{o.label}</option>)}
                      </select>
                    </div>
                  );
                })}
                <div className="border-t border-[#8a8a8a] mt-[9px] mb-[7px]" />
                <div className="flex gap-x-[11px] gap-y-[6px] items-baseline flex-wrap">
                  <span className="whitespace-nowrap">Matrix colour:</span>{Radio(v.matrixColors)}
                </div>
                <div className="flex gap-x-2 gap-y-[6px] items-center flex-wrap mt-2">
                  <span className="whitespace-nowrap">Pipes busyness:</span>
                  <select className="nc-sel" value={v.pipeBusy} onClick={(e) => e.stopPropagation()} onChange={(e) => v.setPipeBusy(e.target.value)}>
                    {v.pipeBusyOpts.map((o, j) => <option key={j} value={o.v}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-x-[11px] gap-y-[6px] items-baseline flex-wrap mt-2">
                  <span className="whitespace-nowrap">Star colour:</span>{Radio(v.starColors)}
                </div>
                <div className="flex gap-x-3 gap-y-[6px] items-baseline flex-wrap mt-2">
                  <span className="whitespace-nowrap">Starfield:</span>
                  {v.starOpts.map((o, i) => (
                    <span key={i} onClick={o.onClick} className="nc-cfg cursor-pointer flex gap-1.5 items-baseline">
                      <span className="font-bold" style={{ color: o.boxColor }}>{o.box}</span><span>{o.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      <div className="flex gap-3.5 justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px]">&nbsp;Ok&nbsp;</span>
        <span onClick={v.closeDialog} className="nc-dlgbtn px-4 py-[3px]">Cancel</span>
        <span onClick={v.resetCfg} className="nc-dlgbtn px-4 py-[3px]" title="restore all settings to defaults">Defaults</span>
      </div>
    </div>
  );
}

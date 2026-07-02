import { s } from '../util/style.js';

// Configuration dialog: panel toggles, CRT-intensity slider, and the keyboard /
// mouse sound "jumper" tuning bars.
export default function ConfigDialog({ v }) {
  return (
    <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:6px 6px 0 rgba(0,0,0,0.45); width:420px; font-size:13.5px;")}>
      <div style={s("background:#0000a8; color:#54fcfc; text-align:center; padding:3px; font-weight:700;")}>Configuration</div>
      <div style={s("border:2px solid #000; margin:10px; padding:0;")}>
        <div style={s("background:#0000a8; color:#54fcfc; text-align:center; font-size:12px; padding:1px;")}>Panel Options</div>
        <div style={s("padding:12px 16px;")}>
          {v.cfgRows.map((c, i) => (
            <div key={i} onClick={c.onClick} className="nc-cfg" style={s("cursor:pointer; padding:2px 0; display:flex; gap:10px; align-items:baseline;")}>
              <span style={{ ...s("font-weight:700;"), color: c.boxColor }}>{c.box}</span>
              <span>{c.label}</span>
            </div>
          ))}
          <div style={{ ...s("display:flex; gap:9px; align-items:center; margin-top:4px;"), opacity: v.crtOpacity }}>
            <span style={s("white-space:nowrap; width:148px; flex-shrink:0;")}>CRT line intensity</span>
            <span onMouseDown={v.crtBar.down} onMouseMove={v.crtBar.move} onMouseUp={v.crtBar.up} onMouseLeave={v.crtBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
              {v.crtSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
            </span>
            <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.crtPct}</span>
          </div>
          <div style={s("border-top:1px solid #8a8a8a; margin:9px 0 7px;")}></div>
          <div style={{ ...s("display:flex; gap:7px 11px; align-items:baseline; flex-wrap:wrap;"), opacity: v.soundOpacity }}>
            <span style={s("white-space:nowrap;")}>Key sound profile:</span>
            {v.soundProfiles.map((p, i) => (
              <span key={i} onClick={p.onClick} className="nc-cfg" style={{ ...s("cursor:pointer; white-space:nowrap;"), color: p.color, fontWeight: p.weight }}>{p.mark}{p.name}</span>
            ))}
          </div>
          <div onClick={v.kbAdvToggle} className="nc-cfg" style={s("cursor:pointer; margin-top:5px; color:#06457a; font-size:12px;")} title="fine-tune like setting jumpers on a sound card">{v.kbAdvCaret} Jumpers (keyboard tuning)</div>
          {v.kbAdv && (
            <div style={{ ...s("margin:3px 0 2px 14px;"), opacity: v.soundOpacity }}>
              <div style={s("display:flex; gap:9px; align-items:center; margin-top:4px;")}>
                <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Pitch</span>
                <span onMouseDown={v.pitchBar.down} onMouseMove={v.pitchBar.move} onMouseUp={v.pitchBar.up} onMouseLeave={v.pitchBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                  {v.pitchSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                </span>
                <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.pitchLabel}</span>
              </div>
              <div style={s("display:flex; gap:9px; align-items:center; margin-top:5px;")}>
                <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Clickiness</span>
                <span onMouseDown={v.clickBar.down} onMouseMove={v.clickBar.move} onMouseUp={v.clickBar.up} onMouseLeave={v.clickBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                  {v.clickSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                </span>
                <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.clickLabel}</span>
              </div>
            </div>
          )}
          <div style={s("display:flex; gap:7px 11px; align-items:baseline; flex-wrap:wrap; margin-top:9px;")}>
            <span style={s("white-space:nowrap;")}>Mouse click:</span>
            {v.clickProfiles.map((p, i) => (
              <span key={i} onClick={p.onClick} className="nc-cfg" style={{ ...s("cursor:pointer; white-space:nowrap;"), color: p.color, fontWeight: p.weight }}>{p.mark}{p.name}</span>
            ))}
          </div>
          <div onClick={v.mouseAdvToggle} className="nc-cfg" style={s("cursor:pointer; margin-top:5px; color:#06457a; font-size:12px;")} title="fine-tune like setting jumpers on a sound card">{v.mouseAdvCaret} Jumpers (mouse tuning)</div>
          {v.mouseAdv && (
            <div style={s("margin:3px 0 2px 14px;")}>
              <div style={s("display:flex; gap:9px; align-items:center; margin-top:4px;")}>
                <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Pitch</span>
                <span onMouseDown={v.mPitchBar.down} onMouseMove={v.mPitchBar.move} onMouseUp={v.mPitchBar.up} onMouseLeave={v.mPitchBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                  {v.mPitchSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                </span>
                <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.mPitchLabel}</span>
              </div>
              <div style={s("display:flex; gap:9px; align-items:center; margin-top:5px;")}>
                <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Clickiness</span>
                <span onMouseDown={v.mClickBar.down} onMouseMove={v.mClickBar.move} onMouseUp={v.mClickBar.up} onMouseLeave={v.mClickBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                  {v.mClickSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                </span>
                <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.mClickLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={s("display:flex; gap:14px; justify-content:center; padding:0 0 14px;")}>
        <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 22px;")}>&nbsp;Ok&nbsp;</span>
        <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 16px;")}>Cancel</span>
      </div>
    </div>
  );
}

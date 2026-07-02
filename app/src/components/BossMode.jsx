import { s } from '../util/style.js';

// Boss key: an instant fake spreadsheet that covers the whole screen (Esc closes).
export default function BossMode({ v }) {
  return (
    <div style={s("position:fixed; inset:0; z-index:200; background:#ffffff; color:#1a1a1a; font-family:'Space Mono',monospace; display:flex; flex-direction:column; font-size:13px;")}>
      <div style={s("flex:0 0 auto; background:#107c41; color:#fff; display:flex; align-items:center; gap:10px; padding:3px 10px; font-size:12px;")}>
        <span style={s("font-weight:700;")}>QuattroCalc</span><span style={s("opacity:0.85;")}>- FY2026_Operating_Plan.xls</span>
        <span style={s("flex:1;")}></span>
        <span style={s("opacity:0.85;")}>[CONFIDENTIAL · FINANCE]</span>
        <span style={s("background:#0e6b38; padding:0 7px;")}>–</span><span style={s("background:#0e6b38; padding:0 7px;")}>□</span><span style={s("background:#c0392b; padding:0 7px;")}>×</span>
      </div>
      <div style={s("flex:0 0 auto; background:#f1f1f1; border-bottom:1px solid #c8c8c8; display:flex; gap:18px; padding:3px 12px; font-size:12px; color:#333;")}>
        <span style={s("text-decoration:underline;")}>F</span><span>ile</span>
        <span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Data</span><span>Tools</span><span>Window</span><span>Help</span>
      </div>
      <div style={s("flex:0 0 auto; display:flex; align-items:stretch; border-bottom:1px solid #c8c8c8; font-size:12px;")}>
        <div style={s("width:64px; border-right:1px solid #c8c8c8; padding:3px 8px; color:#444;")}>N14</div>
        <div style={s("flex:1; padding:3px 10px; color:#666; font-style:italic;")}>fx  ="may or may not have been built on a little company time"</div>
      </div>
      <div style={s("flex:1 1 auto; min-height:0; overflow:auto; background:#fff;")}>
        <div style={s("display:grid; grid-template-columns:46px 230px repeat(4,1fr); position:sticky; top:0;")}>
          <div style={s("background:#f1f1f1; border:1px solid #d4d4d4;")}>&nbsp;</div>
          <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>A</div>
          <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>B</div>
          <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>C</div>
          <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>D</div>
          <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>E</div>
        </div>
        {v.bossRows.map((r, i) => (
          <div key={i} style={s("display:grid; grid-template-columns:46px 230px repeat(4,1fr);")}>
            <div style={s("background:#f1f1f1; border:1px solid #e2e2e2; text-align:center; color:#777;")}>{r.n}</div>
            <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px;"), fontWeight: r.wt, color: r.lc }}>{r.a}</div>
            <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.b}</div>
            <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.c}</div>
            <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.d}</div>
            <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.e}</div>
          </div>
        ))}
      </div>
      <div style={s("flex:0 0 auto; background:#f1f1f1; border-top:1px solid #c8c8c8; display:flex; align-items:center; gap:16px; padding:3px 12px; font-size:11px; color:#555;")}>
        <span>Ready</span><span>Sum=0</span><span>NUM</span>
        <span style={s("flex:1;")}></span>
        <span style={s("color:#999;")}>press Esc to recalculate</span>
      </div>
    </div>
  );
}

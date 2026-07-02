import { s } from '../util/style.js';

// Tableau dashboard popup (iframe).
export default function DashDialog({ v }) {
  return (
    <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:8px 8px 0 rgba(0,0,0,0.5); width:92vw; max-width:1100px; height:84vh; display:flex; flex-direction:column;")}>
      <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; gap:8px; padding:3px 8px; font-weight:700; flex:0 0 auto;")}>
        <span style={s("flex:1;")}>{v.dashTitle}</span>
        <a className="nc-link" href={v.dashLink} target="_blank" rel="noopener" style={s("font-size:11px; color:#fcfc54;")}>OPEN ON TABLEAU ▸</a>
        <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
      </div>
      <iframe src={v.dashSrc} title={v.dashTitle} style={s("flex:1 1 auto; width:100%; border:none; display:block; background:#fff;")}></iframe>
    </div>
  );
}

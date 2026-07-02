import { s } from '../util/style.js';

// NC-authentic directory preview: shows a highlighted folder's contents in the
// right pane; click a row to open it or browse deeper (delegated in the engine).
export default function DirPreview({ v }) {
  return (
    <div style={s("padding:10px 12px;")}>
      <div style={s("color:#fcfc54; font-size:12px; letter-spacing:0.06em; margin-bottom:8px;")}>{v.dirPreviewName}</div>
      <div style={s("border-top:1px solid #2746b8; margin-bottom:6px;")}></div>
      {v.dirPreviewEmpty && (
        <div style={s("color:#6f93d8; font-size:12.5px; font-style:italic;")}>(empty directory)</div>
      )}
      <div onClick={v.dirPreviewOpen}>
        {v.dirPreviewItems.map((dp, i) => (
          <div key={i} className="nc-dprow" data-dpidx={dp.i} style={{ ...s("display:flex; gap:8px; font-size:12.5px; line-height:1.7; cursor:pointer; padding:0 4px;"), color: dp.color }}>
            <span style={s("flex:1; min-width:0; overflow:hidden; white-space:nowrap; pointer-events:none;")}>{dp.n}</span>
            <span style={s("color:#6f93d8; flex:0 0 auto; pointer-events:none;")}>{dp.s}</span>
          </div>
        ))}
      </div>
      <div style={s("border-top:1px solid #2746b8; margin-top:8px; padding-top:6px; font-size:11px; color:#6f93d8;")}>Click an item to open it or go deeper · or press Enter</div>
    </div>
  );
}

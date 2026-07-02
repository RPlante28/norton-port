import { s } from '../util/style.js';

// Plain text / ASCII-art viewer for user files and read-only program text.
export default function TextView({ v }) {
  return (
    <div style={s("padding:14px 16px;")}>
      <div style={s("display:flex; align-items:center; gap:10px; margin-bottom:10px;")}>
        <span style={s("font-size:12px; color:#fcfc54;")}>{v.rightTitle}</span>
        <span style={s("flex:1;")}></span>
        {v.textEditable && (<span className="nc-vbtn" onClick={v.editSelected}>edit (e)</span>)}
        {v.textReadonly && (<span style={s("font-size:11px; color:#6f93d8;")}>read-only</span>)}
      </div>
      <pre style={s("margin:0; white-space:pre; overflow:auto; color:#d4d8dc; font-size:13px; line-height:1.32;")}>{v.textBody}</pre>
    </div>
  );
}

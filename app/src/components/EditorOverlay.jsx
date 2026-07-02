import { s } from '../util/style.js';

// The vim-style editor chrome (header + textarea + block cursor + status/command
// line). Shared by the right-panel overlay and the CLI full-screen; `cli` just
// bumps a few sizes to match the original.
export default function EditorOverlay({ v, cli }) {
  return (
    <>
      <div
        style={s(
          cli
            ? 'flex:0 0 auto; background:#000060; color:#54fcfc; font-size:13px; padding:4px 8px; display:flex; align-items:center; gap:8px;'
            : 'flex:0 0 auto; background:#000060; color:#54fcfc; font-size:12px; padding:3px 8px; display:flex; align-items:center; gap:8px;',
        )}
      >
        <span style={s("font-weight:700;")}>VIM</span>
        <span>{v.edName}</span>
        <span style={s("flex:1;")}></span>
        <span className="nc-vbtn" onClick={v.saveEditor}>:w save</span>
        <span className="nc-vbtn" onClick={v.closeEditor}>:q quit</span>
      </div>
      <textarea
        className="nc-ed"
        ref={v.edRef}
        onKeyDown={v.onEdKey}
        onKeyUp={v.onEdCaret}
        onClick={v.onEdCaret}
        onScroll={v.onEdCaret}
        spellCheck="false"
        readOnly={v.edRo}
        style={cli ? s('flex:1 1 auto;') : undefined}
      ></textarea>
      <div className="nc-edcurs" ref={v.edCursRef}></div>
      <div
        style={s(
          cli
            ? 'flex:0 0 auto; background:#000060; color:#d4d8dc; font-size:13px; padding:3px 8px; display:flex; align-items:center; gap:8px;'
            : 'flex:0 0 auto; background:#000060; color:#d4d8dc; font-size:12px; padding:2px 8px; display:flex; align-items:center; gap:8px;',
        )}
      >
        <span style={s("color:#fcfc54;")}>{v.edMode}</span>
        <span style={s("color:#54fcfc; font-size:11px;")}>{v.edCursor}</span>
        <span style={s("color:#8fb0e8;")}>{v.edStatus}</span>
        <span style={s("flex:1;")}></span>
        <span style={s("color:#8fb0e8; font-size:11px;")}>{v.edHint}</span>
        <input
          className="nc-edcmd"
          ref={v.edCmdRef}
          onKeyDown={v.onEdCmdKey}
          type="text"
          spellCheck="false"
          placeholder="w  q  wq  q!"
          style={s(cli ? 'max-width:160px;' : 'max-width:140px;')}
        />
      </div>
    </>
  );
}

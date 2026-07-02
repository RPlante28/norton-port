import { s } from '../util/style.js';

export default function HelpDialog({ v }) {
  return (
    <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:6px 6px 0 rgba(0,0,0,0.45); width:520px; max-width:94vw; font-size:13px;")}>
      <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; padding:3px 8px; font-weight:700;")}>
        <span style={s("flex:1;")}>Help &amp; Keyboard Shortcuts</span>
        <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
      </div>
      <div style={s("padding:14px 16px; line-height:1.55;")}>
        <div style={s("display:grid; grid-template-columns:auto 1fr; gap:4px 14px;")}>
          <span style={s("color:#0000a8; font-weight:700;")}>Arrows</span><span>move the highlight in the active panel</span>
          <span style={s("color:#0000a8; font-weight:700;")}>Enter</span><span>open the highlighted file or folder</span>
          <span style={s("color:#0000a8; font-weight:700;")}>Backspace / ..</span><span>go up a level (lands on the folder you left)</span>
          <span style={s("color:#0000a8; font-weight:700;")}>O</span><span>toggle full-screen CLI mode</span>
          <span style={s("color:#0000a8; font-weight:700;")}>F1</span><span>this help window</span>
          <span style={s("color:#0000a8; font-weight:700;")}>Esc</span><span>close a window / menu / go back</span>
        </div>
        <div style={s("border-top:2px solid #8a8a8a; margin:12px 0 10px;")}></div>
        <div style={s("color:#06457a; font-weight:700; margin-bottom:5px;")}>Useful commands (type below or in CLI)</div>
        <div style={s("font-family:'Space Mono',monospace; font-size:12px; color:#222; line-height:1.7;")}>help · tree · ls · cd &lt;dir&gt; · cat &lt;file&gt; (try  cat *.txt )<br />open &lt;name&gt; · mail · 6502 · go github · clear</div>
      </div>
      <div style={s("display:flex; justify-content:center; padding:0 0 14px;")}>
        <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 22px;")}>&nbsp;Ok&nbsp;</span>
      </div>
    </div>
  );
}

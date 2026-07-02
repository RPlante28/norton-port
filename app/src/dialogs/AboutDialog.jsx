import { s } from '../util/style.js';

export default function AboutDialog({ v }) {
  return (
    <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:6px 6px 0 rgba(0,0,0,0.45); width:440px; font-size:13.5px;")}>
      <div style={s("background:#0000a8; color:#54fcfc; text-align:center; padding:3px; font-weight:700;")}>About</div>
      <div style={s("padding:16px 18px; line-height:1.6;")}>
        <div style={s("font-weight:700; font-size:15px; margin-bottom:6px;")}>ROHAN-DOS Portfolio Commander</div>
        <div>Version 5.51 · Computer Science Edition</div>
        <div style={s("margin:8px 0;")}>A one-file homage to Norton Commander. Built by Rohan Plante. Navigate with the mouse, the arrow keys, or the command line below.</div>
        <div style={s("color:#06457a;")}>© MMXXVI · Middleton, MA · thanks for stopping by</div>
      </div>
      <div style={s("display:flex; justify-content:center; padding:0 0 14px;")}>
        <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 22px;")}>&nbsp;Ok&nbsp;</span>
      </div>
    </div>
  );
}

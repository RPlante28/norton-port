import { s } from '../util/style.js';

// Full-screen image viewer (shows the untouched colour original of a dithered
// thumbnail); click anywhere or Esc to close.
export default function ImageViewer({ v }) {
  return (
    <div onClick={v.closeImg} style={s("position:fixed; inset:0; z-index:9500; background:rgba(0,0,42,0.86); display:flex; align-items:center; justify-content:center; cursor:zoom-out;")}>
      <div style={s("position:relative; max-width:90vw; max-height:88vh; display:flex; flex-direction:column; border:2px solid #54fcfc; box-shadow:0 0 0 1px #0000a8, 8px 8px 0 rgba(0,0,0,0.5);")}>
        <div style={s("display:flex; align-items:center; justify-content:space-between; gap:18px; background:#0000a8; color:#fff; padding:4px 10px; font-size:13px; letter-spacing:0.04em;")}>
          <span style={s("color:#54fcfc;")}>IMAGE VIEWER</span>
          <span style={s("color:#fcfc54;")}>{v.imgViewName}</span>
          <span onClick={v.closeImg} style={s("cursor:pointer; color:#fff; padding:0 4px;")}>[X]</span>
        </div>
        <div style={s("background:#000; padding:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;")}>
          {v.imgViewNode}
        </div>
        <div style={s("background:#0000a8; color:#a8d4ff; padding:3px 10px; font-size:11px; letter-spacing:0.05em; display:flex; justify-content:space-between; gap:18px;")}>
          <span>{v.imgViewMeta}</span>
          <span style={s("color:#9fc0f0;")}>click anywhere or press Esc to close</span>
        </div>
      </div>
    </div>
  );
}

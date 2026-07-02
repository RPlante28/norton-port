import { s } from '../util/style.js';

// Full-screen POST/boot splash with the teletype text (engine-driven).
export default function BootScreen({ v }) {
  return (
    <div onClick={v.skipBoot} style={s("position:fixed; inset:0; z-index:100; background:#000; color:#c8c8c8; font-family:'Space Mono',monospace; font-size:14px; line-height:1.45; padding:24px 30px; cursor:pointer;")}>
      <div style={s("display:flex; justify-content:space-between; color:#e8e8e8;")}>
        <span>Plante Systems, Inc. - ROHAN-DOS 5.51</span>
        <span>Energy Star Ally ✦</span>
      </div>
      <pre style={s("margin:14px 0 6px; color:#54fcfc; font-size:12px; line-height:1.05;")}>{v.bootLogo}</pre>
      <div style={s("white-space:pre-wrap; color:#c8c8c8; margin-top:10px;")}>{v.bootText}<span style={s("display:inline-block; width:8px; height:15px; background:#c8c8c8; vertical-align:-3px; animation:ncblink 0.85s steps(1) infinite;")}></span></div>
      <div style={s("position:absolute; left:0; right:0; bottom:18px; text-align:center; color:#6a6a6a; font-size:12px;")}>press any key or click anywhere to skip</div>
    </div>
  );
}

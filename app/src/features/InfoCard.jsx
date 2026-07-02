import { s } from '../util/style.js';

// The default WHOAMI / home info card: portrait, identity grid, blurb, quick
// links, and the full skills list.
export default function InfoCard({ v }) {
  return (
    <div style={s("padding:16px 18px 14px;")}>
      <div style={s("display:flex; align-items:baseline; justify-content:flex-end; margin-bottom:10px;")}>
        <span style={s("color:#fcfc54; font-size:11px;")}>v5.51 · JUN 2026</span>
      </div>
      <div style={s("border-top:1px solid #2746b8; margin-bottom:14px;")}></div>

      <div style={s("display:flex; gap:14px; align-items:flex-start; margin-bottom:14px;")}>
        <div style={s("flex:0 0 auto;")}>
          <img src="assets/dither-bw.png" alt="Rohan Plante" onClick={v.viewImg} style={s("display:block; width:120px; cursor:zoom-in; image-rendering:pixelated; filter:grayscale(1) brightness(1.06) contrast(1.05); border:1px solid #2f6fd0;")} />
        </div>
        <div style={s("flex:1 1 auto; min-width:0;")}>
          <div style={s("font-size:22px; color:#fff; letter-spacing:0.03em; line-height:1;")}>ROHAN PLANTE</div>
          <div style={s("color:#54fcfc; font-size:12px; margin:3px 0 8px; letter-spacing:0.05em;")}>COMPUTER SCIENCE  ·  MARIST UNIVERSITY</div>
          <div style={s("display:grid; grid-template-columns:auto 1fr; gap:2px 10px; font-size:12.5px; line-height:1.7;")}>
            <span style={s("color:#fcfc54;")}>GPA</span><span>3.67 / 4.0 · Dean's List, every semester</span>
            <span style={s("color:#fcfc54;")}>FOCUS</span><span>Software Development</span>
            <span style={s("color:#fcfc54;")}>NOW</span><span>Data Analyst · Marist Office of Community &amp; Belonging</span>
            <span style={s("color:#fcfc54;")}>HOME</span><span>Middleton, MA  ·  school in Poughkeepsie, NY</span>
          </div>
          <div style={s("display:flex; align-items:center; gap:7px; margin-top:9px; font-size:12px;")}>
            <span style={s("width:8px; height:8px; background:#3cf06a; display:inline-block; animation:ncblink 1.3s steps(1) infinite;")}></span>
            <span style={s("color:#3cf06a;")}>AVAILABLE</span><span style={s("color:#9fc0f0;")}>- seeking software / data internships</span>
          </div>
        </div>
      </div>

      <div style={s("border-top:1px solid #2746b8; margin-bottom:12px;")}></div>

      <div style={s("font-size:13px; line-height:1.62; color:#d4d8dc; max-width:56ch; margin-bottom:12px;")}>
        I'm a Computer Science student at Marist University who likes building real, working systems, the kind with moving parts you can actually watch run. I've built a <a className="nc-link" href="https://github.com/RPlante28/MaristMaps" target="_blank" rel="noopener">campus navigator</a> with a voice-enabled AI agent, rebuilt a <a className="nc-link" href="https://github.com/RPlante28/6502-emulator" target="_blank" rel="noopener">6502 CPU</a> one pipeline stage at a time, and shipped full-stack apps, data pipelines, and interactive maps. This whole <a className="nc-link" href="#" style={s("color:#54fcfc;")}>portfolio</a> is one of those projects, a DOS-era interface you're exploring right now. I'm looking for software and data internships where I can build things that matter.
      </div>

      <div style={s("display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;")}>
        <a className="nc-btn" href="https://github.com/RPlante28" target="_blank" rel="noopener" style={s("text-decoration:none;")}>GitHub ▸</a>
        <a className="nc-btn" href="https://linkedin.com/in/rohan-plante" target="_blank" rel="noopener" style={s("text-decoration:none;")}>LinkedIn ▸</a>
        <a className="nc-btn" href="mailto:rohanplante@gmail.com" style={s("text-decoration:none;")}>E-mail ▸</a>
        <span className="nc-btn" onClick={v.openResume} style={s("cursor:pointer;")}>Resume ▸</span>
      </div>

      <div style={s("border-top:1px solid #2746b8; margin-bottom:10px;")}></div>
      <div style={s("color:#fcfc54; font-size:11px; letter-spacing:0.06em; margin-bottom:7px;")}>SKILLS</div>
      <div style={s("display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;")}>
        {v.homeSkills.map((sk, i) => (<span key={i} className="nc-tag">{sk}</span>))}
      </div>

      <div style={s("border-top:1px solid #2746b8; margin-bottom:10px;")}></div>
      <div style={s("display:flex; gap:14px; flex-wrap:wrap; font-size:11px; color:#6f93d8; margin-bottom:8px;")}>
        <span>MEM 640K OK</span><span>9 DIRS · 6 PROJECTS</span><span>SYS 6502 @ 1.79MHz</span><span>READY ▮</span>
      </div>
      <div style={s("font-size:11.5px; color:#6f93d8; line-height:1.55;")}>Press <span style={s("color:#54fcfc;")}>F1</span> for help, pick a folder on the left, or type <span style={s("color:#54fcfc;")}>help</span> below.  This is INFO.TXT - return any time with <span style={s("color:#54fcfc;")}>cat INFO.TXT</span>.</div>
    </div>
  );
}

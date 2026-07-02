import { s } from '../util/style.js';

// Education view: Marist, notes, coursework tags, and out-of-class links.
export default function EduView({ v }) {
  return (
    <div style={s("padding:16px 18px;")}>
      <div style={s("font-size:19px; color:#fff;")}><a className="nc-link" href="https://www.marist.edu" target="_blank" rel="noopener" style={s("color:#fff;")}>{v.edu.school}</a></div>
      <div style={s("font-size:12px; color:#fcfc54; margin:3px 0 8px; letter-spacing:0.04em;")}>{v.edu.meta}</div>
      <div style={s("font-style:italic; color:#9fc0f0; font-size:13.5px; margin-bottom:12px;")}>{v.edu.sub}</div>
      {v.edu.notes.map((n, i) => (
        <div key={i} style={s("font-size:13.5px; line-height:1.5; margin-bottom:6px; padding-left:16px; text-indent:-16px;")}><span style={s("color:#54fcfc;")}>› </span>{n}</div>
      ))}
      <div style={s("color:#8fb0e8; font-size:12px; margin:14px 0 8px;")}>C:\ROHAN&gt; dir coursework</div>
      <div style={s("display:flex; flex-wrap:wrap; gap:6px;")}>
        {v.edu.coursework.map((c, i) => (<span key={i} className="nc-tag">{c}</span>))}
      </div>
      <div style={s("border-top:1px solid #2746b8; margin:16px 0 12px;")}></div>
      <div style={s("font-size:12px; color:#9fc0f0; margin-bottom:8px;")}>Outside of class:</div>
      <div style={s("display:flex; flex-direction:column; gap:8px; align-items:flex-start;")}>
        <span className="nc-btn" onClick={v.openMcServer} style={s("cursor:pointer;")}>▣ Event Coordinator, Marist MC Server ▸</span>
        <span className="nc-btn" onClick={v.openCompSoc} style={s("cursor:pointer;")}>▣ VP / Secretary, Marist Computer Society ▸</span>
        <span className="nc-btn" onClick={v.openDataAnl} style={s("cursor:pointer;")}>▣ Data Analyst Assistant, Marist University ▸</span>
      </div>
    </div>
  );
}

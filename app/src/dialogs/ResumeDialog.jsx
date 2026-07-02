import { s } from '../util/style.js';

// Résumé PDF popup (iframe), with open-in-tab and download links.
export default function ResumeDialog({ v }) {
  return (
    <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:8px 8px 0 rgba(0,0,0,0.5); width:90vw; max-width:900px; height:88vh; display:flex; flex-direction:column;")}>
      <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; gap:10px; padding:3px 8px; font-weight:700; flex:0 0 auto;")}>
        <span style={s("flex:1;")}>RESUME.PDF - Rohan Plante</span>
        <a className="nc-link" href="uploads/Rohan_Plante_resume.pdf" target="_blank" rel="noopener" style={s("font-size:11px; color:#fcfc54; text-decoration:none;")}>OPEN IN NEW TAB ▸</a>
        <a className="nc-link" href="uploads/Rohan_Plante_resume.pdf" download style={s("font-size:11px; color:#fcfc54; text-decoration:none;")}>DOWNLOAD ▾</a>
        <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
      </div>
      <iframe src="uploads/Rohan_Plante_resume.pdf#toolbar=1&view=FitH" title="Rohan Plante resume" style={s("flex:1 1 auto; width:100%; border:none; display:block; background:#fff;")}></iframe>
    </div>
  );
}

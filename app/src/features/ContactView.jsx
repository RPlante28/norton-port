import { s } from '../util/style.js';

// SENDMAIL.EXE splash: ASCII hello, blurb, and a RUN button that opens the form.
export default function ContactView({ v }) {
  return (
    <div style={s("padding:18px; text-align:center;")}>
      <pre style={s("display:inline-block; text-align:left; margin:0 0 14px; color:#54fcfc; font-size:13px; line-height:1.2;")}>{v.helloArt}</pre>
      <div style={s("font-size:12px; color:#fcfc54; margin-bottom:6px;")}>SENDMAIL.EXE - executable</div>
      <div style={s("font-size:13.5px; line-height:1.6; max-width:46ch; margin:0 auto 16px;")}>I'm looking for internships and good problems to work on. E-mail is fastest, and I always write back.</div>
      <div style={s("display:flex; flex-wrap:wrap; gap:10px; justify-content:center;")}>
        <span className="nc-btn" onClick={v.openContact} style={s("cursor:pointer;")}>▶ RUN - Compose Email</span>
      </div>
      <div style={s("font-size:11px; color:#8fb0e8; margin-top:18px;")}>// press RUN, or type  mail  - middleton, ma · MMXXVI</div>
    </div>
  );
}

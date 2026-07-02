import { s } from '../util/style.js';

// Contact form dialog (posts to contact.php via the engine) plus social links.
export default function ContactDialog({ v }) {
  return (
    <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:6px 6px 0 rgba(0,0,0,0.45); width:480px; max-width:94vw; font-size:13.5px;")}>
      <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; padding:3px 8px; font-weight:700;")}>
        <span style={s("flex:1;")}>Send a Message</span>
        <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
      </div>
      <div style={s("padding:14px 16px;")}>
        {v.sent && (
          <div style={s("border:2px solid #000; background:#0000a8; color:#54fcfc; padding:18px 14px; text-align:center; line-height:1.6;")}>
            <div style={s("font-size:15px; font-weight:700;")}>✔ Message queued</div>
            <div style={s("font-size:12.5px; color:#9fc0f0;")}>C:\ROHAN&gt; sendmail - your note has been written to the outbox. Rohan will write back soon.</div>
          </div>
        )}
        {v.notSent && (
          <>
            <div style={s("display:grid; grid-template-columns:auto 1fr; gap:9px 10px; align-items:center;")}>
              <label style={s("font-size:13px;")}>Name</label>
              <input type="text" className="nc-field" ref={v.cNameRef} placeholder="Your name" />
              <label style={s("font-size:13px;")}>E-mail</label>
              <input type="text" className="nc-field" ref={v.cEmailRef} placeholder="you@domain.com" />
              <label style={s("font-size:13px; align-self:start; padding-top:4px;")}>Message</label>
              <textarea rows="4" className="nc-field" ref={v.cMsgRef} style={s("resize:none;")} placeholder="Say hello …"></textarea>
            </div>
            {v.hasContactErr && (
              <div style={s("color:#a80000; font-size:12px; margin-top:8px;")}>{v.contactErr}</div>
            )}
            <div style={s("display:flex; gap:12px; justify-content:flex-end; margin-top:14px;")}>
              <span onClick={v.sendContact} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:4px 20px; font-weight:700;")}>Send</span>
              <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:4px 16px;")}>Cancel</span>
            </div>
          </>
        )}
        <div style={s("border-top:2px solid #8a8a8a; margin-top:14px; padding-top:12px;")}>
          <div style={s("font-size:11px; color:#444; letter-spacing:0.08em; margin-bottom:8px;")}>OR FIND ME ON ───</div>
          <div style={s("display:flex; gap:10px; flex-wrap:wrap;")}>
            {v.socials.map((soc, i) => (
              <a key={i} className="nc-social" href={soc.href} target="_blank" rel="noopener noreferrer" style={s("text-decoration:none; color:#0000a8; display:flex; align-items:center; gap:8px; border:2px solid #000; background:#0000a8; padding:4px 10px 4px 4px; box-shadow:2px 2px 0 #5a5a5a;")}>
                <span style={s("width:26px; height:26px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; background:#54fcfc; color:#0000a8; border:1px solid #000; font-size:15px; font-weight:700;")}>{soc.glyph}</span>
                <span style={s("display:flex; flex-direction:column; line-height:1.15;")}>
                  <span style={s("color:#fff; font-size:12.5px; font-weight:700;")}>{soc.label}</span>
                  <span style={s("color:#9fc0f0; font-size:10.5px;")}>{soc.handle}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

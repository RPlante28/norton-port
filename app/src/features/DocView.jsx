import { s } from '../util/style.js';

// Project / experience / award document view: optional animated ASCII hero,
// logo/photo, title/meta/sub, bullets, tags, the Eagle timeline, dashboards,
// action buttons, and the RAVEN-V / trail photo sets.
export default function DocView({ v }) {
  const d = v.d;
  return (
    <div style={s("padding:16px 18px;")}>
      {d.hasViz && (
        <div style={s("border:1px solid #2f6fd0; background:#001b6e; margin-bottom:14px;")}>
          <div style={s("display:flex; align-items:center; gap:8px; background:#0a2da0; border-bottom:1px solid #2f6fd0; padding:3px 9px;")}>
            <span style={s("color:#54fcfc; font-size:10.5px; letter-spacing:0.12em;")}>{d.vizLabel}</span>
            <span style={s("flex:1;")}></span>
            <span style={s("color:#fcfc54; font-size:10px; letter-spacing:0.1em;")}>LIVE</span>
            <span style={s("width:7px; height:7px; background:#fcfc54; display:inline-block; animation:ncblink 1.2s steps(1) infinite;")}></span>
          </div>
          <pre ref={v.vizRef} style={s("margin:0; padding:11px 12px; color:#54fcfc; font-size:12.5px; line-height:1.14; white-space:pre; overflow:auto; min-height:172px;")}></pre>
        </div>
      )}
      {d.hasArt && (
        <pre style={s("margin:0 0 12px; color:#54fcfc; font-size:11px; line-height:1.15; white-space:pre;")}>{d.art}</pre>
      )}
      {v.isISWPImg && (
        <img src={v.docImgSrc} alt="project logo" onClick={v.viewImg} style={s("height:64px; width:auto; display:block; margin-bottom:12px; cursor:zoom-in; filter:brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(170deg);")} />
      )}
      {v.isMCWImg && (
        <img src={v.docImgSrc} data-full={v.docImgFull} alt="project image" className="nc-photo" onClick={v.viewImg} style={s("max-height:250px; width:auto; max-width:100%; display:block; margin-bottom:12px; cursor:zoom-in; border:1px solid #2f6fd0;")} />
      )}
      <div style={s("font-size:19px; color:#fff;")}><a className="nc-link" href={d.link} target="_blank" rel="noopener" style={s("color:#fff;")}>{d.title}</a></div>
      <div style={s("font-size:12px; color:#fcfc54; margin:3px 0 8px; letter-spacing:0.04em;")}>{d.meta}</div>
      {d.hasSub && (
        <div style={s("font-style:italic; color:#9fc0f0; font-size:13.5px; margin-bottom:12px;")}>{d.sub}</div>
      )}
      {d.bullets.map((b, i) => (
        <div key={i} style={s("font-size:13.5px; line-height:1.5; margin-bottom:6px; padding-left:16px; text-indent:-16px;")}><span style={s("color:#54fcfc;")}>› </span>{b}</div>
      ))}
      {d.hasTags && (
        <div style={s("display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;")}>
          {d.tags.map((t, i) => (<span key={i} className="nc-tag">{t}</span>))}
        </div>
      )}
      {d.hasTimeline && (
        <div style={s("margin-top:18px;")}>
          <div style={s("display:flex; align-items:center; gap:9px; margin-bottom:12px;")}>
            <span style={s("font-size:11px; color:#54fcfc; letter-spacing:0.11em;")}>PROJECT TIMELINE</span>
            <span style={s("flex:1; height:1px; background:#2746b8;")}></span>
            <span style={s("font-size:10px; color:#6f93d8; letter-spacing:0.09em;")}>KING PINES TRAIL</span>
          </div>
          {d.timeline.intro.map((p, i) => (
            <div key={i} style={s("font-size:13.5px; line-height:1.55; color:#c8d2e0; margin-bottom:9px;")}>{p}</div>
          ))}
          <div style={s("margin-top:8px;")}>
            {d.timeline.entries.map((e, i) => (
              <div key={i} style={s("position:relative; padding:0 0 22px 22px; border-left:2px solid #2746b8; margin-left:6px;")}>
                <span style={s("position:absolute; left:-7px; top:4px; width:11px; height:11px; background:#54fcfc; transform:rotate(45deg); box-shadow:0 0 0 2px #001b6e, 0 0 0 3px #2f6fd0;")}></span>
                <div style={s("font-size:10.5px; color:#fcfc54; letter-spacing:0.09em; text-transform:uppercase;")}>{e.date}</div>
                <div style={s("font-size:14.5px; color:#fff; margin:2px 0 5px; letter-spacing:0.01em;")}>{e.title}</div>
                <div style={s("font-size:13px; line-height:1.55; color:#c8d2e0; max-width:62ch;")}>{e.desc}</div>
                <div onClick={e.onImgClick} style={s("display:flex; gap:12px; flex-wrap:wrap; margin-top:12px;")}>
                  {e.imgs.map((im, ii) => (<img key={ii} src={im.t} data-full={im.f} className="nc-photo" alt="King Pines Trail" style={s("height:130px; width:auto; border:1px solid #54fcfc; box-shadow:3px 3px 0 #001b6e; cursor:zoom-in;")} />))}
                </div>
              </div>
            ))}
          </div>
          {d.timeline.hasFooter && (
            <>
              <div style={s("font-size:13px; color:#9fc0f0; margin-top:4px;")}>{d.timeline.footer.text} <a className="nc-link" href={d.timeline.footer.link} target="_blank" rel="noopener" style={s("color:#54fcfc;")}>{d.timeline.footer.linkLabel}</a></div>
              <div style={s("font-size:11px; color:#6f93d8; margin-top:2px;")}>{d.timeline.footer.note}</div>
            </>
          )}
        </div>
      )}
      {d.dataviz && (
        <div style={s("margin-top:16px;")}>
          <div style={s("font-size:11px; color:#54fcfc; letter-spacing:0.08em; margin-bottom:8px;")}>DASHBOARDS - TABLEAU PUBLIC  ·  click to open in a window</div>
          <div style={s("display:flex; gap:10px; flex-wrap:wrap;")}>
            <span className="nc-btn" onClick={v.openDash1} style={s("cursor:pointer;")}>▣ Automation Job-Threat ▸</span>
            <span className="nc-btn" onClick={v.openDash2} style={s("cursor:pointer;")}>▣ Marist Event Calendar ▸</span>
          </div>
        </div>
      )}
      <div style={s("margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;")}>
        {d.hasLink && (<a className="nc-btn" href={d.link} target="_blank" rel="noopener">{d.linkLabel}</a>)}
        {d.hasGoto && (<span className="nc-btn" onClick={v.gotoFile} style={s("cursor:pointer;")}>{d.gotoLabel}</span>)}
        {d.hasGoto2 && (<span className="nc-btn" onClick={v.gotoFile2} style={s("cursor:pointer;")}>{d.gotoLabel2}</span>)}
        {d.demo && (<span className="nc-btn" onClick={v.openVM} style={s("cursor:pointer;")}>▶ RUN THE LIVE DEMO ▸</span>)}
      </div>

      {v.isRavenPhotos && (
        <div style={s("margin-top:18px;")}>
          <div style={s("font-size:11px; color:#54fcfc; letter-spacing:0.08em; margin-bottom:8px;")}>FIELD PHOTOS - PROTOTYPE BUILD</div>
          <div style={s("display:flex; gap:8px; flex-wrap:wrap;")}>
            <img src="uploads/raven-1-dither.png" alt="RAVEN-V rover" data-full="uploads/rover_picture1.jpg" onClick={v.viewImg} style={s("height:150px; width:auto; border:1px solid #2f6fd0; cursor:zoom-in; image-rendering:pixelated; filter:brightness(1.05) contrast(1.04);")} />
            <img src="uploads/raven-2-dither.png" alt="RAVEN-V wiring" onClick={v.viewImg} style={s("height:150px; width:auto; border:1px solid #2f6fd0; cursor:zoom-in; image-rendering:pixelated; filter:brightness(1.05) contrast(1.04);")} />
            <img src="uploads/raven-3-dither.png" alt="RAVEN-V build" onClick={v.viewImg} style={s("height:150px; width:auto; border:1px solid #2f6fd0; cursor:zoom-in; image-rendering:pixelated; filter:brightness(1.05) contrast(1.04);")} />
          </div>
        </div>
      )}
      {v.isTrailPhotos && (
        <div style={s("margin-top:18px;")}>
          <div style={s("font-size:11px; color:#54fcfc; letter-spacing:0.08em; margin-bottom:8px;")}>FIELD PHOTO - BOARDWALK CONSTRUCTION</div>
          <img src="uploads/trail-1-dither.png" alt="King Pines Trail boardwalk build" onClick={v.viewImg} style={s("max-width:100%; width:420px; display:block; border:1px solid #2f6fd0; cursor:zoom-in; image-rendering:pixelated; filter:brightness(1.05) contrast(1.04);")} />
        </div>
      )}
    </div>
  );
}

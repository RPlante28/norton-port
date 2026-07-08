// Project / experience / award document view: optional animated ASCII hero,
// logo/photo, title/meta/sub, bullets, tags, the Eagle timeline, dashboards,
// action buttons, and the RAVEN-V / trail photo sets.
const photoFilter = { filter: 'brightness(1.05) contrast(1.04)' };

// Render [[n]] / [[word]] markup as a solid black redaction bar (n chars wide,
// or the placeholder's length). Used by the redacted "Internship" entry so the
// source never carries anything sensitive, only a bar length.
function redact(str) {
  const s = String(str == null ? '' : str);
  if (s.indexOf('[[') < 0) return s;
  return s.split(/(\[\[[^\]]*\]\])/g).map((p, i) => {
    const m = p.match(/^\[\[([^\]]*)\]\]$/);
    if (!m) return p;
    const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : m[1].length;
    return (
      <span
        key={i}
        title="redacted"
        style={{ background: '#000', color: '#000', borderRadius: '1px', padding: '0 1px' }}
      >
        {'█'.repeat(Math.max(2, n))}
      </span>
    );
  });
}

export default function DocView({ v }) {
  const d = v.d;
  return (
    <div className="px-[18px] py-4">
      {d.hasViz && (
        <div className="border border-edge bg-[#001b6e] mb-3.5">
          <div className="flex items-center gap-2 bg-[#0a2da0] border-b border-edge px-[9px] py-[3px]">
            <span className="text-cyan text-[10.5px] tracking-[0.12em]">{d.vizLabel}</span>
            <span className="flex-1"></span>
            <span className="text-yellow text-[10px] tracking-[0.1em]">LIVE</span>
            <span
              className="w-[7px] h-[7px] bg-yellow inline-block"
              style={{ animation: 'ncblink 1.2s steps(1) infinite' }}
            ></span>
          </div>
          <pre
            ref={v.vizRef}
            className="nc-viz m-0 px-3 py-[11px] text-cyan text-[12.5px] leading-[1.14] whitespace-pre overflow-auto min-h-[172px]"
          ></pre>
        </div>
      )}
      {d.hasArt && <pre className="mb-3 text-cyan text-[11px] leading-[1.15] whitespace-pre">{d.art}</pre>}
      {v.isISWPImg && (
        <img
          src={v.docImgSrc}
          alt="project logo"
          onClick={v.viewImg}
          className="h-16 w-auto block mb-3 cursor-zoom-in"
          style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(170deg)' }}
        />
      )}
      {v.isMCWImg && (
        <img
          src={v.docImgSrc}
          data-full={v.docImgFull}
          alt="project image"
          className="nc-photo max-h-[250px] w-auto max-w-full block mb-3 cursor-zoom-in border border-edge"
          onClick={v.viewImg}
        />
      )}
      <div className="text-[19px] text-white">
        <a className="nc-link" href={d.link} target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
          {d.title}
        </a>
      </div>
      <div className="text-[12px] text-yellow mt-[3px] mb-2 tracking-[0.04em]">{redact(d.meta)}</div>
      {d.hasSub && <div className="italic text-muted text-[13.5px] mb-3">{redact(d.sub)}</div>}
      {d.bullets.map((b, i) => (
        <div key={i} className="text-[13.5px] leading-[1.5] mb-1.5 pl-4 [text-indent:-16px]">
          <span className="text-cyan">› </span>
          {redact(b)}
        </div>
      ))}
      {d.hasTags && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {d.tags.map((t, i) => (
            <span key={i} className="nc-tag">
              {redact(t)}
            </span>
          ))}
        </div>
      )}
      {d.hasTimeline && (
        <div className="mt-[18px]">
          <div className="flex items-center gap-[9px] mb-3">
            <span className="text-[11px] text-cyan tracking-[0.11em]">PROJECT TIMELINE</span>
            <span className="flex-1 h-px bg-edge-dim"></span>
            <span className="text-[10px] text-dim tracking-[0.09em]">KING PINES TRAIL</span>
          </div>
          {d.timeline.intro.map((p, i) => (
            <div key={i} className="text-[13.5px] leading-[1.55] text-[#c8d2e0] mb-[9px]">
              {p}
            </div>
          ))}
          <div className="mt-2">
            {d.timeline.entries.map((e, i) => (
              <div key={i} className="relative pb-[22px] pl-[22px] border-l-2 border-edge-dim ml-1.5">
                <span
                  className="absolute left-[-7px] top-1 w-[11px] h-[11px] bg-cyan"
                  style={{ transform: 'rotate(45deg)', boxShadow: '0 0 0 2px #001b6e, 0 0 0 3px #2f6fd0' }}
                ></span>
                <div className="text-[10.5px] text-yellow tracking-[0.09em] uppercase">{e.date}</div>
                <div className="text-[14.5px] text-white mt-0.5 mb-[5px] tracking-[0.01em]">{e.title}</div>
                <div className="text-[13px] leading-[1.55] text-[#c8d2e0] max-w-[62ch]">{e.desc}</div>
                <div onClick={e.onImgClick} className="flex gap-3 flex-wrap mt-3">
                  {e.imgs.map((im, ii) => (
                    <img
                      key={ii}
                      src={im.t}
                      data-full={im.f}
                      className="nc-photo h-[130px] w-auto border border-cyan cursor-zoom-in"
                      alt="King Pines Trail"
                      style={{ boxShadow: '3px 3px 0 #001b6e' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {d.timeline.hasFooter && (
            <>
              <div className="text-[13px] text-muted mt-1">
                {d.timeline.footer.text}{' '}
                <a className="nc-link" href={d.timeline.footer.link} target="_blank" rel="noopener noreferrer">
                  {d.timeline.footer.linkLabel}
                </a>
              </div>
              <div className="text-[11px] text-dim mt-0.5">{d.timeline.footer.note}</div>
            </>
          )}
        </div>
      )}
      {d.dataviz && (
        <div className="mt-4">
          <div className="text-[11px] text-cyan tracking-[0.08em] mb-2">
            DASHBOARDS - TABLEAU PUBLIC  ·  click to open in a window
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <span className="nc-btn cursor-pointer" onClick={v.openDash1}>
              ▣ Automation Job-Threat ▸
            </span>
            <span className="nc-btn cursor-pointer" onClick={v.openDash2}>
              ▣ Marist Event Calendar ▸
            </span>
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-2.5 flex-wrap">
        {d.hasLink && (
          <a className="nc-btn" href={d.link} target="_blank" rel="noopener noreferrer">
            {d.linkLabel}
          </a>
        )}
        {d.hasGoto && (
          <span className="nc-btn cursor-pointer" onClick={v.gotoFile}>
            {d.gotoLabel}
          </span>
        )}
        {d.hasGoto2 && (
          <span className="nc-btn cursor-pointer" onClick={v.gotoFile2}>
            {d.gotoLabel2}
          </span>
        )}
        {d.demo && (
          <span className="nc-btn cursor-pointer" onClick={v.openVM}>
            ▶ RUN THE LIVE DEMO ▸
          </span>
        )}
      </div>

      {v.isRavenPhotos && (
        <div className="mt-[18px]">
          <div className="text-[11px] text-cyan tracking-[0.08em] mb-2">FIELD PHOTOS - PROTOTYPE BUILD</div>
          <div className="flex gap-2 flex-wrap">
            <img src="uploads/raven-1-dither.png" alt="RAVEN-V rover" data-full="uploads/rover_picture1.jpg" onClick={v.viewImg} className="h-[150px] w-auto border border-edge cursor-zoom-in [image-rendering:pixelated]" style={photoFilter} />
            <img src="uploads/raven-2-dither.png" alt="RAVEN-V wiring" onClick={v.viewImg} className="h-[150px] w-auto border border-edge cursor-zoom-in [image-rendering:pixelated]" style={photoFilter} />
            <img src="uploads/raven-3-dither.png" alt="RAVEN-V build" onClick={v.viewImg} className="h-[150px] w-auto border border-edge cursor-zoom-in [image-rendering:pixelated]" style={photoFilter} />
          </div>
        </div>
      )}
      {v.isTrailPhotos && (
        <div className="mt-[18px]">
          <div className="text-[11px] text-cyan tracking-[0.08em] mb-2">FIELD PHOTO - BOARDWALK CONSTRUCTION</div>
          <img
            src="uploads/trail-1-dither.png"
            alt="King Pines Trail boardwalk build"
            onClick={v.viewImg}
            className="max-w-full w-[420px] block border border-edge cursor-zoom-in [image-rendering:pixelated]"
            style={photoFilter}
          />
        </div>
      )}
    </div>
  );
}

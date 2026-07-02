import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import Engine from '../engine/Engine.js';
import { s } from '../util/style.js';
import MenuBar from './MenuBar.jsx';
import FunctionKeyBar from './FunctionKeyBar.jsx';

// The whole ROHAN-DOS screen. This is a faithful JSX port of the original
// x-dc template: it reads the single `vals` object produced by Engine.renderVals()
// and mirrors the markup 1:1. Inline styles are carried over via s() for pixel
// fidelity; a later pass factors these into Tailwind components/features.
export default function App() {
  const ref = useRef(null);
  if (!ref.current) ref.current = new Engine({});
  const engine = ref.current;

  useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  useEffect(() => {
    engine.componentDidMount();
    return () => engine.componentWillUnmount();
  }, [engine]);
  useEffect(() => {
    engine.componentDidUpdate();
  });

  const v = engine.renderVals();
  const d = v.d;

  return (
    <div style={s("height:100%; display:flex; flex-direction:column; padding:5px 8px 4px; gap:4px; font-size:14px; overflow:hidden;")}>

      {/* ===== BOOT / POST SCREEN ===== */}
      {v.booting && (
        <div onClick={v.skipBoot} style={s("position:fixed; inset:0; z-index:100; background:#000; color:#c8c8c8; font-family:'Space Mono',monospace; font-size:14px; line-height:1.45; padding:24px 30px; cursor:pointer;")}>
          <div style={s("display:flex; justify-content:space-between; color:#e8e8e8;")}>
            <span>Plante Systems, Inc. - ROHAN-DOS 5.51</span>
            <span>Energy Star Ally ✦</span>
          </div>
          <pre style={s("margin:14px 0 6px; color:#54fcfc; font-size:12px; line-height:1.05;")}>{v.bootLogo}</pre>
          <div style={s("white-space:pre-wrap; color:#c8c8c8; margin-top:10px;")}>{v.bootText}<span style={s("display:inline-block; width:8px; height:15px; background:#c8c8c8; vertical-align:-3px; animation:ncblink 0.85s steps(1) infinite;")}></span></div>
          <div style={s("position:absolute; left:0; right:0; bottom:18px; text-align:center; color:#6a6a6a; font-size:12px;")}>press any key or click anywhere to skip</div>
        </div>
      )}

      {/* ===== TOP MENU BAR ===== */}
      <MenuBar menus={v.menus} anyMenuOpen={v.anyMenuOpen} closeMenu={v.closeMenu} />

      {/* ===== TWO PANELS ===== */}
      <div style={s("flex:1 1 auto; min-height:0; margin-top:7px; display:grid; grid-template-columns:1fr 1fr; gap:8px;")}>

        {/* LEFT: FILE PANEL */}
        <div style={s("position:relative; border:3px double #54fcfc; display:flex; flex-direction:column; min-height:0;")}>
          <div style={s("position:absolute; top:-11px; left:0; right:0; text-align:center; pointer-events:none;")}>
            <span style={s("background:#0000a8; padding:0 12px; color:#54fcfc; font-size:13px;")}>{v.leftTitle}</span>
          </div>
          <div style={s("display:grid; grid-template-columns:1fr 104px 92px; color:#54fcfc; font-size:13px; padding:8px 0 3px; border-bottom:1px solid #2746b8;")}>
            <span style={s("padding:0 6px; text-align:center;")}>Name</span>
            <span style={s("padding:0 6px; text-align:center; border-left:1px solid #2746b8;")}>Size</span>
            <span style={s("padding:0 6px; text-align:center; border-left:1px solid #2746b8;")}>Date</span>
          </div>
          <div style={s("flex:1 1 auto; overflow:auto; padding-top:2px;")}>
            {v.rows.map((r, ri) => (
              <div key={ri} className={r.cls} onClick={r.onClick}>
                <span style={{ color: r.nameColor }}>{r.name}</span>
                <span>{r.size}</span>
                <span>{r.date}</span>
              </div>
            ))}
          </div>
          {v.showStatus && (
            <>
              <div style={s("border-top:1px solid #54fcfc; text-align:center; font-size:13px; padding:3px; color:#fff;")}>{v.selName} &nbsp; {v.selDate} &nbsp; 21:38</div>
              <div style={s("text-align:center; font-size:12px; color:#9fc0f0; padding:0 0 4px;")}>{v.fileCount} file(s) · {v.dirCount} dir(s)</div>
            </>
          )}
        </div>

        {/* RIGHT: INFO / VIEWER */}
        <div style={s("position:relative; border:3px double #54fcfc; min-height:0; display:flex; flex-direction:column;")}>
          <div style={s("position:absolute; top:-11px; left:0; right:0; text-align:center; pointer-events:none; z-index:2;")}>
            <span style={s("background:#0000a8; padding:0 12px; color:#fff; font-size:13px;")}>{v.rightTitle}</span>
          </div>
          <div style={s("flex:1 1 auto; min-height:0; overflow:auto;")}>

            {/* INFO (default) */}
            {v.isInfo && (
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
            )}

            {/* DIRECTORY PREVIEW */}
            {v.isDirPreview && (
              <div style={s("padding:10px 12px;")}>
                <div style={s("color:#fcfc54; font-size:12px; letter-spacing:0.06em; margin-bottom:8px;")}>{v.dirPreviewName}</div>
                <div style={s("border-top:1px solid #2746b8; margin-bottom:6px;")}></div>
                {v.dirPreviewEmpty && (
                  <div style={s("color:#6f93d8; font-size:12.5px; font-style:italic;")}>(empty directory)</div>
                )}
                <div onClick={v.dirPreviewOpen}>
                  {v.dirPreviewItems.map((dp, i) => (
                    <div key={i} className="nc-dprow" data-dpidx={dp.i} style={{ ...s("display:flex; gap:8px; font-size:12.5px; line-height:1.7; cursor:pointer; padding:0 4px;"), color: dp.color }}>
                      <span style={s("flex:1; min-width:0; overflow:hidden; white-space:nowrap; pointer-events:none;")}>{dp.n}</span>
                      <span style={s("color:#6f93d8; flex:0 0 auto; pointer-events:none;")}>{dp.s}</span>
                    </div>
                  ))}
                </div>
                <div style={s("border-top:1px solid #2746b8; margin-top:8px; padding-top:6px; font-size:11px; color:#6f93d8;")}>Click an item to open it or go deeper · or press Enter</div>
              </div>
            )}

            {/* DOC VIEW */}
            {v.isDoc && (
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
            )}

            {/* EDU VIEW */}
            {v.isEdu && (
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
            )}

            {/* CONTACT / SENDMAIL.EXE VIEW */}
            {v.isContact && (
              <div style={s("padding:18px; text-align:center;")}>
                <pre style={s("display:inline-block; text-align:left; margin:0 0 14px; color:#54fcfc; font-size:13px; line-height:1.2;")}>{v.helloArt}</pre>
                <div style={s("font-size:12px; color:#fcfc54; margin-bottom:6px;")}>SENDMAIL.EXE - executable</div>
                <div style={s("font-size:13.5px; line-height:1.6; max-width:46ch; margin:0 auto 16px;")}>I'm looking for internships and good problems to work on. E-mail is fastest, and I always write back.</div>
                <div style={s("display:flex; flex-wrap:wrap; gap:10px; justify-content:center;")}>
                  <span className="nc-btn" onClick={v.openContact} style={s("cursor:pointer;")}>▶ RUN - Compose Email</span>
                </div>
                <div style={s("font-size:11px; color:#8fb0e8; margin-top:18px;")}>// press RUN, or type  mail  - middleton, ma · MMXXVI</div>
              </div>
            )}

            {/* TEXT / ART VIEW */}
            {v.isText && (
              <div style={s("padding:14px 16px;")}>
                <div style={s("display:flex; align-items:center; gap:10px; margin-bottom:10px;")}>
                  <span style={s("font-size:12px; color:#fcfc54;")}>{v.rightTitle}</span>
                  <span style={s("flex:1;")}></span>
                  {v.textEditable && (<span className="nc-vbtn" onClick={v.editSelected}>edit (e)</span>)}
                  {v.textReadonly && (<span style={s("font-size:11px; color:#6f93d8;")}>read-only</span>)}
                </div>
                <pre style={s("margin:0; white-space:pre; overflow:auto; color:#d4d8dc; font-size:13px; line-height:1.32;")}>{v.textBody}</pre>
              </div>
            )}

            {/* 6502 VIRTUAL MACHINE */}
            {v.isVM && v.vm && (
              <div style={s("padding:10px 12px; overflow:auto;")}>
                <div style={s("display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;")}>
                  <span style={s("font-size:12px; color:#fcfc54;")}>CPU6502.SYS - scalar-pipeline 6502</span>
                  <span style={s("flex:1;")}></span>
                  <span style={s("font-size:11px; color:#8fb0e8;")}>program:</span>
                  <select className="nc-vsel" value={v.vm.progKey} onChange={v.vm.onPickProgram}>
                    {v.vm.programs.map((pg, i) => (<option key={i} value={pg.key}>{pg.label}</option>))}
                  </select>
                </div>

                <div style={s("border:1px solid #2f6fd0; padding:8px; margin-bottom:9px;")}>
                  <div style={s("color:#54fcfc; font-size:11px; margin-bottom:6px;")}>PIPELINE  ·  one instruction advances one stage per clock</div>
                  <div style={s("display:flex; gap:6px; align-items:stretch;")}>
                    {v.vm.stages.map((sg, i) => (
                      <div key={i} className={sg.cls}>
                        <div style={s("font-size:9.5px; color:#8fb0e8; letter-spacing:0.06em;")}>{sg.label}</div>
                        <div style={s("font-size:15px; font-weight:700; color:#fcfc54;")}>{sg.op}</div>
                        <div style={s("font-size:9.5px; color:#9fc0f0;")}>{sg.mnem}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={s("display:flex; gap:9px; flex-wrap:wrap; align-items:flex-start;")}>
                  <div style={s("border:1px solid #2f6fd0; padding:7px 9px; font-size:13px; min-width:118px;")}>
                    <div style={s("color:#54fcfc; border-bottom:1px solid #2746b8; margin-bottom:5px; padding-bottom:3px; font-size:11px;")}>REGISTERS</div>
                    <div>A&nbsp; $<span style={s("color:#fcfc54;")}>{v.vm.A}</span></div>
                    <div>X&nbsp; $<span style={s("color:#fcfc54;")}>{v.vm.X}</span></div>
                    <div>Y&nbsp; $<span style={s("color:#fcfc54;")}>{v.vm.Y}</span></div>
                    <div>PC $<span style={s("color:#fcfc54;")}>{v.vm.PC}</span></div>
                    <div style={s("margin-top:7px; color:#54fcfc; font-size:11px;")}>FLAGS</div>
                    <div style={s("display:flex; gap:8px; font-weight:700;")}>
                      {v.vm.flags.map((fl, i) => (<span key={i} style={{ color: fl.col }}>{fl.f}</span>))}
                    </div>
                  </div>

                  <div style={s("border:1px solid #2f6fd0; padding:7px 9px; font-size:12px; min-width:188px;")}>
                    <div style={s("color:#54fcfc; border-bottom:1px solid #2746b8; margin-bottom:5px; padding-bottom:3px; font-size:11px;")}>PIPELINE STATS</div>
                    <div style={s("display:grid; grid-template-columns:1fr auto; gap:0 10px; color:#9fc0f0;")}>
                      <span>cycles</span><span style={s("color:#fcfc54;")}>{v.vm.cycles}</span>
                      <span>retired</span><span style={s("color:#fcfc54;")}>{v.vm.retired}</span>
                      <span>IPC</span><span style={s("color:#fcfc54;")}>{v.vm.ipc}</span>
                      <span>fetch stalls</span><span style={s("color:#fcfc54;")}>{v.vm.fetchStalls}</span>
                      <span>INC stalls</span><span style={s("color:#fcfc54;")}>{v.vm.incStalls}</span>
                      <span>branch flush</span><span style={s("color:#fcfc54;")}>{v.vm.branchFlushes}</span>
                      <span>bubbles</span><span style={s("color:#fcfc54;")}>{v.vm.bubbles}</span>
                    </div>
                  </div>

                  <div style={s("border:1px solid #2f6fd0; padding:7px 9px; font-size:12.5px; flex:1; min-width:190px; align-self:stretch;")}>
                    <div style={s("color:#54fcfc; margin-bottom:5px; font-size:11px;")}>SYS OUTPUT</div>
                    <pre style={s("margin:0; white-space:pre-wrap; word-break:break-word; color:#fcfc54; min-height:54px; font-size:13px; line-height:1.4;")}>{v.vm.out}</pre>
                  </div>
                </div>

                <div style={s("border:1px solid #2f6fd0; padding:7px 9px; margin-top:9px;")}>
                  <div style={s("display:flex; align-items:center; gap:8px; margin-bottom:5px;")}>
                    <span style={s("color:#54fcfc; font-size:11px;")}>MEMORY  {v.vm.pageLabel}</span>
                    <span style={s("flex:1;")}></span>
                    <span className="nc-vbtn" onClick={v.vmPageDown}>◀ page</span>
                    <span className="nc-vbtn" onClick={v.vmPageUp}>page ▶</span>
                  </div>
                  <div style={s("font-family:'Space Mono',monospace; font-size:11px; overflow:auto;")}>
                    {v.vm.memRows.map((mr, i) => (
                      <div key={i} style={s("display:flex; gap:0; white-space:pre;")}>
                        <span style={s("color:#6f93d8; padding-right:8px;")}>{mr.addr}</span>
                        {mr.cells.map((mc, ci) => (<span key={ci} style={{ display: 'inline-block', width: '19px', textAlign: 'center', background: mc.bg, color: mc.fg }}>{mc.v}</span>))}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={s("display:flex; gap:8px; margin-top:10px; align-items:center; flex-wrap:wrap;")}>
                  <span className="nc-vbtn" onClick={v.vmStep}>Step ▷</span>
                  <span className="nc-vbtn" onClick={v.vmRun}>{v.vm.runLabel}</span>
                  <span className="nc-vbtn" onClick={v.vmReset}>⟲ Reload</span>
                  <span style={s("display:flex; align-items:center; gap:5px; color:#8fb0e8; font-size:11px;")}>clock
                    <select className="nc-vsel" value={v.vm.speedIdx} onChange={v.vm.onPickSpeed}>
                      {v.vm.speeds.map((sp, i) => (<option key={i} value={sp.i}>{sp.label}</option>))}
                    </select>
                  </span>
                  <span className="nc-vbtn" onClick={v.vmEdit}>✎ Edit code</span>
                  <span className="nc-vbtn" onClick={v.vmNew}>+ New program</span>
                  <span style={s("flex:1;")}></span>
                  <span style={s("color:#fcfc54; font-size:11px;")}>{v.vm.haltMsg}</span>
                </div>
                <div style={s("color:#8fb0e8; font-size:11px; margin-top:8px; line-height:1.5;")}>{v.vm.loadMsg}</div>
                <div style={s("color:#6f93d8; font-size:11px; margin-top:4px; line-height:1.5;")}>Faithful port of my <a className="nc-link" href="https://github.com/RPlante28/422-tsiraM/tree/scalar-pipeline" target="_blank" rel="noopener">tsiraM-6502</a> scalar pipeline (fetch→decode→execute→writeback→interrupt, with fetch / INC / branch hazard stalls). Pick a sample, Step through it, or write your own in hex or assembly with <b>+ New program</b>.</div>
              </div>
            )}

          </div>

          {/* EDITOR OVERLAY (right panel) */}
          {v.edInPanel && (
            <div style={s("position:absolute; inset:0; z-index:3; background:#0000a8; display:flex; flex-direction:column;")}>
              <div style={s("flex:0 0 auto; background:#000060; color:#54fcfc; font-size:12px; padding:3px 8px; display:flex; align-items:center; gap:8px;")}>
                <span style={s("font-weight:700;")}>VIM</span><span>{v.edName}</span><span style={s("flex:1;")}></span>
                <span className="nc-vbtn" onClick={v.saveEditor}>:w save</span>
                <span className="nc-vbtn" onClick={v.closeEditor}>:q quit</span>
              </div>
              <textarea className="nc-ed" ref={v.edRef} onKeyDown={v.onEdKey} onKeyUp={v.onEdCaret} onClick={v.onEdCaret} onScroll={v.onEdCaret} spellCheck="false" readOnly={v.edRo}></textarea>
              <div className="nc-edcurs" ref={v.edCursRef}></div>
              <div style={s("flex:0 0 auto; background:#000060; color:#d4d8dc; font-size:12px; padding:2px 8px; display:flex; align-items:center; gap:8px;")}>
                <span style={s("color:#fcfc54;")}>{v.edMode}</span>
                <span style={s("color:#54fcfc; font-size:11px;")}>{v.edCursor}</span>
                <span style={s("color:#8fb0e8;")}>{v.edStatus}</span>
                <span style={s("flex:1;")}></span>
                <span style={s("color:#8fb0e8; font-size:11px;")}>{v.edHint}</span>
                <input className="nc-edcmd" ref={v.edCmdRef} onKeyDown={v.onEdCmdKey} type="text" spellCheck="false" placeholder="w  q  wq  q!" style={s("max-width:140px;")} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== CLI-ONLY FULL SCREEN ===== */}
      {v.cliMode && (
        <div style={s("position:fixed; inset:0; z-index:70; background:#0000a8; display:flex; flex-direction:column; padding:10px 12px;")}>
          {v.cliTermView && (
            <>
              <div style={s("flex:0 0 auto; color:#fcfc54; font-size:12px; border-bottom:1px solid #2746b8; padding-bottom:4px; margin-bottom:6px;")}>ROHAN-DOS - CLI mode - type  help  for commands,  gui  to return</div>
              <div style={s("flex:1 1 auto; min-height:0; overflow:auto; white-space:pre-wrap; color:#d4d8dc; font-size:13.5px; line-height:1.45;")} ref={v.termScrollRef} onClick={v.focusCli}>{v.termText}</div>
              <div style={s("flex:0 0 auto; display:flex; align-items:center; font-size:13.5px; color:#d4d8dc; border-top:1px solid #2746b8; margin-top:4px; padding-top:4px;")}>
                <span style={{ ...s("white-space:nowrap;"), color: v.cliPromptColor }}>{v.cliPrompt}&nbsp;</span>
                <span style={s("position:relative; flex:1; display:flex; align-items:center;")}>
                  <input className="nc-cmd nc-cmd-bc" ref={v.cliRef} onKeyDown={v.onCliKey} onKeyUp={v.onCliCaret} onClick={v.onCliCaret} onFocus={v.onCliCaret} type={v.cliInputType} spellCheck="false" autoComplete="off" placeholder={v.cliPlaceholder} style={s("width:100%;")} />
                  <span className="nc-curs" ref={v.cliCursRef} style={s("left:0;")}>&nbsp;</span>
                </span>
              </div>
            </>
          )}
          {v.edInCli && (
            <>
              <div style={s("flex:0 0 auto; background:#000060; color:#54fcfc; font-size:13px; padding:4px 8px; display:flex; align-items:center; gap:8px;")}>
                <span style={s("font-weight:700;")}>VIM</span><span>{v.edName}</span><span style={s("flex:1;")}></span>
                <span className="nc-vbtn" onClick={v.saveEditor}>:w save</span>
                <span className="nc-vbtn" onClick={v.closeEditor}>:q quit</span>
              </div>
              <textarea className="nc-ed" ref={v.edRef} onKeyDown={v.onEdKey} onKeyUp={v.onEdCaret} onClick={v.onEdCaret} onScroll={v.onEdCaret} spellCheck="false" readOnly={v.edRo} style={s("flex:1 1 auto;")}></textarea>
              <div className="nc-edcurs" ref={v.edCursRef}></div>
              <div style={s("flex:0 0 auto; background:#000060; color:#d4d8dc; font-size:13px; padding:3px 8px; display:flex; align-items:center; gap:8px;")}>
                <span style={s("color:#fcfc54;")}>{v.edMode}</span>
                <span style={s("color:#54fcfc; font-size:11px;")}>{v.edCursor}</span>
                <span style={s("color:#8fb0e8;")}>{v.edStatus}</span>
                <span style={s("flex:1;")}></span>
                <span style={s("color:#8fb0e8; font-size:11px;")}>{v.edHint}</span>
                <input className="nc-edcmd" ref={v.edCmdRef} onKeyDown={v.onEdCmdKey} type="text" spellCheck="false" placeholder="w  q  wq  q!" style={s("max-width:160px;")} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== COMMAND LINE ===== */}
      <div style={s("flex:0 0 auto; padding:1px 2px;")}>
        <div style={s("display:flex; align-items:center; font-size:13.5px; color:#d4d8dc;")}>
          <span style={s("white-space:nowrap; color:#d4d8dc;")}>{v.pathLine}&gt;&nbsp;</span>
          <span style={s("position:relative; flex:1; display:flex; align-items:center;")}>
            <input className="nc-cmd nc-cmd-bc" ref={v.cmdRef} onKeyDown={v.onCmdKey} onKeyUp={v.onCmdCaret} onClick={v.onCmdCaret} onFocus={v.onCmdCaret} type="text" spellCheck="false" autoComplete="off" placeholder="type a command  (help, cd projects, open maps, go github, mail) and press Enter" style={s("width:100%;")} />
            <span className="nc-curs" ref={v.cmdCursRef} style={s("left:0;")}>&nbsp;</span>
          </span>
        </div>
        {v.hasCmdMsg && (
          <div style={s("font-size:12px; color:#fcfc54; padding:1px 2px 0;")}>{v.cmdMsg}</div>
        )}
      </div>

      {/* ===== FUNCTION KEY BAR ===== */}
      <FunctionKeyBar v={v} />

      {/* ===== DOS BLOCK MOUSE CURSOR ===== */}
      <div className="nc-mouse" ref={v.mouseRef}></div>

      {/* ===== MODAL DIALOGS ===== */}
      {v.dialog && (
        <div onClick={v.closeDialog} style={s("position:fixed; inset:0; z-index:80; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;")}>

          {/* CONFIGURATION */}
          {v.isConfig && (
            <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:6px 6px 0 rgba(0,0,0,0.45); width:420px; font-size:13.5px;")}>
              <div style={s("background:#0000a8; color:#54fcfc; text-align:center; padding:3px; font-weight:700;")}>Configuration</div>
              <div style={s("border:2px solid #000; margin:10px; padding:0;")}>
                <div style={s("background:#0000a8; color:#54fcfc; text-align:center; font-size:12px; padding:1px;")}>Panel Options</div>
                <div style={s("padding:12px 16px;")}>
                  {v.cfgRows.map((c, i) => (
                    <div key={i} onClick={c.onClick} className="nc-cfg" style={s("cursor:pointer; padding:2px 0; display:flex; gap:10px; align-items:baseline;")}>
                      <span style={{ ...s("font-weight:700;"), color: c.boxColor }}>{c.box}</span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                  <div style={{ ...s("display:flex; gap:9px; align-items:center; margin-top:4px;"), opacity: v.crtOpacity }}>
                    <span style={s("white-space:nowrap; width:148px; flex-shrink:0;")}>CRT line intensity</span>
                    <span onMouseDown={v.crtBar.down} onMouseMove={v.crtBar.move} onMouseUp={v.crtBar.up} onMouseLeave={v.crtBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                      {v.crtSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                    </span>
                    <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.crtPct}</span>
                  </div>
                  <div style={s("border-top:1px solid #8a8a8a; margin:9px 0 7px;")}></div>
                  <div style={{ ...s("display:flex; gap:7px 11px; align-items:baseline; flex-wrap:wrap;"), opacity: v.soundOpacity }}>
                    <span style={s("white-space:nowrap;")}>Key sound profile:</span>
                    {v.soundProfiles.map((p, i) => (
                      <span key={i} onClick={p.onClick} className="nc-cfg" style={{ ...s("cursor:pointer; white-space:nowrap;"), color: p.color, fontWeight: p.weight }}>{p.mark}{p.name}</span>
                    ))}
                  </div>
                  <div onClick={v.kbAdvToggle} className="nc-cfg" style={s("cursor:pointer; margin-top:5px; color:#06457a; font-size:12px;")} title="fine-tune like setting jumpers on a sound card">{v.kbAdvCaret} Jumpers (keyboard tuning)</div>
                  {v.kbAdv && (
                    <div style={{ ...s("margin:3px 0 2px 14px;"), opacity: v.soundOpacity }}>
                      <div style={s("display:flex; gap:9px; align-items:center; margin-top:4px;")}>
                        <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Pitch</span>
                        <span onMouseDown={v.pitchBar.down} onMouseMove={v.pitchBar.move} onMouseUp={v.pitchBar.up} onMouseLeave={v.pitchBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                          {v.pitchSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                        </span>
                        <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.pitchLabel}</span>
                      </div>
                      <div style={s("display:flex; gap:9px; align-items:center; margin-top:5px;")}>
                        <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Clickiness</span>
                        <span onMouseDown={v.clickBar.down} onMouseMove={v.clickBar.move} onMouseUp={v.clickBar.up} onMouseLeave={v.clickBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                          {v.clickSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                        </span>
                        <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.clickLabel}</span>
                      </div>
                    </div>
                  )}
                  <div style={s("display:flex; gap:7px 11px; align-items:baseline; flex-wrap:wrap; margin-top:9px;")}>
                    <span style={s("white-space:nowrap;")}>Mouse click:</span>
                    {v.clickProfiles.map((p, i) => (
                      <span key={i} onClick={p.onClick} className="nc-cfg" style={{ ...s("cursor:pointer; white-space:nowrap;"), color: p.color, fontWeight: p.weight }}>{p.mark}{p.name}</span>
                    ))}
                  </div>
                  <div onClick={v.mouseAdvToggle} className="nc-cfg" style={s("cursor:pointer; margin-top:5px; color:#06457a; font-size:12px;")} title="fine-tune like setting jumpers on a sound card">{v.mouseAdvCaret} Jumpers (mouse tuning)</div>
                  {v.mouseAdv && (
                    <div style={s("margin:3px 0 2px 14px;")}>
                      <div style={s("display:flex; gap:9px; align-items:center; margin-top:4px;")}>
                        <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Pitch</span>
                        <span onMouseDown={v.mPitchBar.down} onMouseMove={v.mPitchBar.move} onMouseUp={v.mPitchBar.up} onMouseLeave={v.mPitchBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                          {v.mPitchSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                        </span>
                        <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.mPitchLabel}</span>
                      </div>
                      <div style={s("display:flex; gap:9px; align-items:center; margin-top:5px;")}>
                        <span style={s("white-space:nowrap; width:92px; flex-shrink:0;")}>Clickiness</span>
                        <span onMouseDown={v.mClickBar.down} onMouseMove={v.mClickBar.move} onMouseUp={v.mClickBar.up} onMouseLeave={v.mClickBar.up} style={s("display:flex; flex-shrink:0; cursor:ew-resize; user-select:none; color:#0000a8; font-size:15px; line-height:1;")}>
                          {v.mClickSegs.map((seg, i) => (<span key={i} style={s("padding:0 0.5px; pointer-events:none;")}>{seg.ch}</span>))}
                        </span>
                        <span style={s("color:#06457a; white-space:nowrap; font-size:12px;")}>{v.mClickLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={s("display:flex; gap:14px; justify-content:center; padding:0 0 14px;")}>
                <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 22px;")}>&nbsp;Ok&nbsp;</span>
                <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 16px;")}>Cancel</span>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {v.isAbout && (
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
          )}

          {/* CONTACT FORM */}
          {v.isContactDlg && (
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
                      <a key={i} className="nc-social" href={soc.href} target="_blank" rel="noopener" style={s("text-decoration:none; color:#0000a8; display:flex; align-items:center; gap:8px; border:2px solid #000; background:#0000a8; padding:4px 10px 4px 4px; box-shadow:2px 2px 0 #5a5a5a;")}>
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
          )}

          {/* HELP */}
          {v.isHelp && (
            <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:6px 6px 0 rgba(0,0,0,0.45); width:520px; max-width:94vw; font-size:13px;")}>
              <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; padding:3px 8px; font-weight:700;")}>
                <span style={s("flex:1;")}>Help &amp; Keyboard Shortcuts</span>
                <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
              </div>
              <div style={s("padding:14px 16px; line-height:1.55;")}>
                <div style={s("display:grid; grid-template-columns:auto 1fr; gap:4px 14px;")}>
                  <span style={s("color:#0000a8; font-weight:700;")}>Arrows</span><span>move the highlight in the active panel</span>
                  <span style={s("color:#0000a8; font-weight:700;")}>Enter</span><span>open the highlighted file or folder</span>
                  <span style={s("color:#0000a8; font-weight:700;")}>Backspace / ..</span><span>go up a level (lands on the folder you left)</span>
                  <span style={s("color:#0000a8; font-weight:700;")}>O</span><span>toggle full-screen CLI mode</span>
                  <span style={s("color:#0000a8; font-weight:700;")}>F1</span><span>this help window</span>
                  <span style={s("color:#0000a8; font-weight:700;")}>Esc</span><span>close a window / menu / go back</span>
                </div>
                <div style={s("border-top:2px solid #8a8a8a; margin:12px 0 10px;")}></div>
                <div style={s("color:#06457a; font-weight:700; margin-bottom:5px;")}>Useful commands (type below or in CLI)</div>
                <div style={s("font-family:'Space Mono',monospace; font-size:12px; color:#222; line-height:1.7;")}>help · tree · ls · cd &lt;dir&gt; · cat &lt;file&gt; (try  cat *.txt )<br />open &lt;name&gt; · mail · 6502 · go github · clear</div>
              </div>
              <div style={s("display:flex; justify-content:center; padding:0 0 14px;")}>
                <span onClick={v.closeDialog} className="nc-dlgbtn" style={s("cursor:pointer; background:#a0a0a0; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:3px 22px;")}>&nbsp;Ok&nbsp;</span>
              </div>
            </div>
          )}

          {/* DASHBOARD WINDOWS */}
          {v.isDash && (
            <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:8px 8px 0 rgba(0,0,0,0.5); width:92vw; max-width:1100px; height:84vh; display:flex; flex-direction:column;")}>
              <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; gap:8px; padding:3px 8px; font-weight:700; flex:0 0 auto;")}>
                <span style={s("flex:1;")}>{v.dashTitle}</span>
                <a className="nc-link" href={v.dashLink} target="_blank" rel="noopener" style={s("font-size:11px; color:#fcfc54;")}>OPEN ON TABLEAU ▸</a>
                <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
              </div>
              <iframe src={v.dashSrc} title={v.dashTitle} style={s("flex:1 1 auto; width:100%; border:none; display:block; background:#fff;")}></iframe>
            </div>
          )}

          {/* RESUME WINDOW */}
          {v.isResume && (
            <div onClick={v.stop} style={s("background:#b8b8b8; color:#000; box-shadow:8px 8px 0 rgba(0,0,0,0.5); width:90vw; max-width:900px; height:88vh; display:flex; flex-direction:column;")}>
              <div style={s("background:#0000a8; color:#54fcfc; display:flex; align-items:center; gap:10px; padding:3px 8px; font-weight:700; flex:0 0 auto;")}>
                <span style={s("flex:1;")}>RESUME.PDF - Rohan Plante</span>
                <a className="nc-link" href="uploads/Rohan_Plante_resume.pdf" target="_blank" rel="noopener" style={s("font-size:11px; color:#fcfc54; text-decoration:none;")}>OPEN IN NEW TAB ▸</a>
                <a className="nc-link" href="uploads/Rohan_Plante_resume.pdf" download style={s("font-size:11px; color:#fcfc54; text-decoration:none;")}>DOWNLOAD ▾</a>
                <span onClick={v.closeDialog} style={s("cursor:pointer; background:#a0a0a0; color:#000; box-shadow:inset -1px -1px 0 #000, inset 1px 1px 0 #fff; padding:0 7px; line-height:16px;")}>x</span>
              </div>
              <iframe src="uploads/Rohan_Plante_resume.pdf#toolbar=1&view=FitH" title="Rohan Plante resume" style={s("flex:1 1 auto; width:100%; border:none; display:block; background:#fff;")}></iframe>
            </div>
          )}
        </div>
      )}

      {/* ===== BOSS KEY: instant fake spreadsheet ===== */}
      {v.bossMode && (
        <div style={s("position:fixed; inset:0; z-index:200; background:#ffffff; color:#1a1a1a; font-family:'Space Mono',monospace; display:flex; flex-direction:column; font-size:13px;")}>
          <div style={s("flex:0 0 auto; background:#107c41; color:#fff; display:flex; align-items:center; gap:10px; padding:3px 10px; font-size:12px;")}>
            <span style={s("font-weight:700;")}>QuattroCalc</span><span style={s("opacity:0.85;")}>- FY2026_Operating_Plan.xls</span>
            <span style={s("flex:1;")}></span>
            <span style={s("opacity:0.85;")}>[CONFIDENTIAL · FINANCE]</span>
            <span style={s("background:#0e6b38; padding:0 7px;")}>–</span><span style={s("background:#0e6b38; padding:0 7px;")}>□</span><span style={s("background:#c0392b; padding:0 7px;")}>×</span>
          </div>
          <div style={s("flex:0 0 auto; background:#f1f1f1; border-bottom:1px solid #c8c8c8; display:flex; gap:18px; padding:3px 12px; font-size:12px; color:#333;")}>
            <span style={s("text-decoration:underline;")}>F</span><span>ile</span>
            <span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Data</span><span>Tools</span><span>Window</span><span>Help</span>
          </div>
          <div style={s("flex:0 0 auto; display:flex; align-items:stretch; border-bottom:1px solid #c8c8c8; font-size:12px;")}>
            <div style={s("width:64px; border-right:1px solid #c8c8c8; padding:3px 8px; color:#444;")}>N14</div>
            <div style={s("flex:1; padding:3px 10px; color:#666; font-style:italic;")}>fx  ="may or may not have been built on a little company time"</div>
          </div>
          <div style={s("flex:1 1 auto; min-height:0; overflow:auto; background:#fff;")}>
            <div style={s("display:grid; grid-template-columns:46px 230px repeat(4,1fr); position:sticky; top:0;")}>
              <div style={s("background:#f1f1f1; border:1px solid #d4d4d4;")}>&nbsp;</div>
              <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>A</div>
              <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>B</div>
              <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>C</div>
              <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>D</div>
              <div style={s("background:#f1f1f1; border:1px solid #d4d4d4; text-align:center; color:#555;")}>E</div>
            </div>
            {v.bossRows.map((r, i) => (
              <div key={i} style={s("display:grid; grid-template-columns:46px 230px repeat(4,1fr);")}>
                <div style={s("background:#f1f1f1; border:1px solid #e2e2e2; text-align:center; color:#777;")}>{r.n}</div>
                <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px;"), fontWeight: r.wt, color: r.lc }}>{r.a}</div>
                <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.b}</div>
                <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.c}</div>
                <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.d}</div>
                <div style={{ ...s("border:1px solid #e8e8e8; padding:2px 8px; text-align:right;"), fontWeight: r.wt }}>{r.e}</div>
              </div>
            ))}
          </div>
          <div style={s("flex:0 0 auto; background:#f1f1f1; border-top:1px solid #c8c8c8; display:flex; align-items:center; gap:16px; padding:3px 12px; font-size:11px; color:#555;")}>
            <span>Ready</span><span>Sum=0</span><span>NUM</span>
            <span style={s("flex:1;")}></span>
            <span style={s("color:#999;")}>press Esc to recalculate</span>
          </div>
        </div>
      )}

      {/* ===== IMAGE VIEWER ===== */}
      {v.imgViewOpen && (
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
      )}

      {/* ===== CRT OVERLAY ===== */}
      {v.crt && (
        <>
          <div className="nc-crt-lines" style={{ ...s("position:fixed; inset:0; z-index:9990; pointer-events:none; mix-blend-mode:multiply;"), background: v.crtScanBg }}></div>
          <div className="nc-crt-sweep" style={s("position:fixed; top:-40vh; left:0; right:0; height:40vh; z-index:9991; pointer-events:none; background:linear-gradient(to bottom, transparent, rgba(150,210,255,0.06) 45%, rgba(150,210,255,0.06) 55%, transparent); mix-blend-mode:screen;")}></div>
          <div style={s("position:fixed; inset:0; z-index:9990; pointer-events:none; background:radial-gradient(ellipse at center, transparent 62%, rgba(0,0,0,0.4) 100%);")}></div>
        </>
      )}
    </div>
  );
}

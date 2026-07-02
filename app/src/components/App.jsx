import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import Engine from '../engine/Engine.js';
import { s } from '../util/style.js';
import MenuBar from './MenuBar.jsx';
import FunctionKeyBar from './FunctionKeyBar.jsx';
import FilePanel from './FilePanel.jsx';
import CommandLine from './CommandLine.jsx';
import CrtOverlay from './CrtOverlay.jsx';
import RightPane from '../features/RightPane.jsx';

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

  return (
    <div className="h-full flex flex-col gap-1 text-[14px] overflow-hidden pt-[5px] px-2 pb-1">

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
      <div className="flex-auto min-h-0 mt-[7px] grid grid-cols-2 gap-2">

        {/* LEFT: FILE PANEL */}
        <FilePanel v={v} />

        {/* RIGHT: INFO / VIEWER */}
        <div className="relative flex flex-col min-h-0 border-[3px] border-double border-cyan">
          <div className="absolute -top-[11px] left-0 right-0 text-center pointer-events-none z-[2]">
            <span className="bg-dos-blue px-3 text-white text-[13px]">{v.rightTitle}</span>
          </div>
          <div className="flex-auto min-h-0 overflow-auto">
            <RightPane v={v} />
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
      <CommandLine v={v} />

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
      <CrtOverlay crt={v.crt} scanBg={v.crtScanBg} />
    </div>
  );
}

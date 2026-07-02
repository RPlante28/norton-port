import { s } from '../util/style.js';
import EditorOverlay from './EditorOverlay.jsx';

// Full-screen CLI-only mode: scrollback terminal + prompt, or the editor when a
// file is open in the terminal.
export default function CliFullScreen({ v }) {
  return (
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
      {v.edInCli && <EditorOverlay v={v} cli />}
    </div>
  );
}

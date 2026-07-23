import { useRef, useState } from 'react';

// ADVENT.EXE window: the BOOT SECTOR adventure in a Norton-style dialog.
//
//   +-- ADVENT.EXE - Boot Sector ----------[x]-+   title bar (x closes)
//   | +-------------------------------------+  |
//   | |  dark terminal: scrollback + prompt |  |   the "screen"
//   | +-------------------------------------+  |
//   |  [ compass ]   [ action buttons ]        |   control deck (grey chrome)
//   |            [ Undo ] [ Reset ] [ Close ]   |
//   +------------------------------------------+
//
// The deck is DATA-DRIVEN: the engine's uiHints() returns a list of actions
// (kind 'cmd' or 'panel'), and this component renders them generically, so new
// game mechanics get buttons without any change here. Panels (Examine…, Take…,
// Go…, …) open a focused chooser with a Back button. Compass stays put (greyed)
// in a sub-panel so nothing shifts. Everything is playable by tapping.
export default function AdventureDialog({ v }) {
  const inRef = useRef(null);
  const [mode, setMode] = useState('main');   // 'main' | 'panel' | 'reset'
  const [panel, setPanel] = useState(null);   // the active panel action object
  const ui = v.advUi || { exits: {}, actions: [], cipher: false };
  const send = (cmd) => { v.advSend(cmd); if (inRef.current) inRef.current.focus(); };
  const openPanel = (a) => { setPanel(a); setMode('panel'); };
  const back = () => { setMode('main'); setPanel(null); };

  const onKey = (e) => {
    if (e.key === 'Enter') { const val = e.target.value; e.target.value = ''; v.advSend(val); }
    else if (e.key === 'Escape') { if (mode !== 'main') back(); else v.closeDialog(); }
    else if (!e.target.value) {
      const k = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e' }[e.key];
      if (k) { e.preventDefault(); v.advSend(k); }
    }
    e.stopPropagation();
  };

  const Btn = ({ cmd, onTap, label, cls = '' }) => (
    <span onClick={onTap || (() => send(cmd))}
      className={'nc-dlgbtn px-2 py-[5px] text-[12px] min-w-[94px] text-center cursor-pointer select-none ' + cls}>
      {label}
    </span>
  );

  // compass: a tidy 3x3 rose; only live exits are pressable. In a sub-panel it
  // stays put (so nothing shifts) but greys out entirely.
  const CELLS = [['', 'N', 'Up'], ['W', '', 'E'], ['', 'S', 'Dn']];
  const DIR = { N: 'n', S: 's', E: 'e', W: 'w', Up: 'u', Dn: 'd' };
  const Compass = ({ disabled }) => (
    <div className="grid grid-cols-3 gap-1 shrink-0" style={{ width: '132px' }}>
      {CELLS.flat().map((label, i) => {
        if (!label) return <span key={i} />;
        const live = ui.exits[DIR[label]] && !disabled;
        return (
          <span key={i} onClick={live ? () => send(DIR[label]) : undefined}
            className={'text-[12px] py-[6px] text-center select-none '
              + (live ? 'nc-dlgbtn cursor-pointer font-bold' : 'text-[#8a8a8a] bg-[#adadad]')}
            style={live ? undefined : { boxShadow: 'inset 1px 1px 0 #9a9a9a, inset -1px -1px 0 #c4c4c4' }}>
            {label}
          </span>
        );
      })}
    </div>
  );

  const RightColumn = () => {
    if (mode === 'reset') {
      return (
        <div className="text-center">
          <div className="text-[12px] text-[#06457a] mb-2 leading-snug">Reset the game?<br />This wipes all progress on this save.</div>
          <div className="flex justify-center gap-2">
            <Btn onTap={() => { send('reset yes'); back(); }} label="Reset game" cls="font-bold" />
            <Btn onTap={back} label="Cancel" />
          </div>
        </div>
      );
    }
    if (mode === 'panel' && panel) {
      return (
        <>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span onClick={back} className="nc-dlgbtn px-2.5 py-[5px] text-[12px] cursor-pointer select-none">&lsaquo; Back</span>
            <span className="text-[12px] text-[#06457a] font-bold">{panel.title}</span>
          </div>
          {panel.options && panel.options.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {panel.options.map((o, i) => (
                <Btn key={i} label={o.label} onTap={() => { send(o.cmd); if (panel.closeOnPick) back(); }} />
              ))}
            </div>
          ) : <div className="text-[12px] text-[#06457a] text-center">{panel.empty || 'Nothing here.'}</div>}
        </>
      );
    }
    // main: render the engine-declared actions
    return (
      <>
        <div className="flex flex-wrap justify-center gap-2">
          {ui.actions.map((a, i) => (
            <Btn key={i} label={a.label}
              onTap={a.kind === 'panel' ? () => openPanel(a) : () => send(a.cmd)} />
          ))}
        </div>
        {ui.cipher && (
          <div className="text-[11px] text-[#06457a] mt-2 leading-snug text-center">
            Cipher room: type <b>xor &lt;hex&gt; &lt;hex&gt;</b> to unmask a share, then <b>unseal &lt;word&gt;</b> in the volume.
          </div>
        )}
      </>
    );
  };

  return (
    <div onClick={(e) => { v.stop(e); if (inRef.current) inRef.current.focus(); }}
      className="bg-[#b8b8b8] text-black w-[600px] max-w-[95vw] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}>
      <div className="relative bg-dos-blue text-cyan text-center p-[3px] font-bold">
        ADVENT.EXE - Boot Sector
        <span onClick={v.closeDialog} title="close (progress saved)"
          className="nc-close absolute right-[5px] top-1/2 -translate-y-1/2 text-[12px] font-bold">x</span>
      </div>

      {/* the screen */}
      <div className="mx-2.5 mt-2.5" style={{ borderStyle: 'solid', borderWidth: '2px', borderColor: '#7a7a7a #ffffff #ffffff #7a7a7a' }}>
        <div className="bg-[#000033] text-[#d4d8dc] px-3 pt-2 pb-2">
          <pre ref={v.advScrollRef}
            className="whitespace-pre-wrap leading-[1.45] text-[12.5px] h-[42vh] max-h-[400px] min-h-[200px] overflow-y-auto"
            style={{ fontFamily: 'inherit' }}>{v.advTerm}</pre>
          <div className="flex items-center gap-1.5 border-t border-[#1b2b55] pt-2 mt-1.5">
            <span className="text-yellow shrink-0">&gt;</span>
            <input
              ref={(el) => { inRef.current = el; v.advInputRef(el); }}
              onKeyDown={onKey}
              className="flex-1 bg-transparent outline-none border-0 text-[#fcfc54] text-[12.5px] min-w-0"
              style={{ fontFamily: 'inherit', caretColor: '#fcfc54' }}
              placeholder="type a command, or use the buttons below"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* control deck */}
      <div className="px-3 py-3 flex justify-center">
        <div className="flex flex-wrap justify-center items-stretch gap-x-4 gap-y-3">
          <div className="flex items-center shrink-0"><Compass disabled={mode !== 'main' || ui.pending} /></div>
          <span className="hidden sm:block w-px bg-[#9a9a9a] self-stretch" />
          <div className="w-[300px] max-w-full flex flex-col justify-center"><RightColumn /></div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pb-3.5">
        {ui.canUndo && <span onClick={() => send('undo')} className="nc-dlgbtn px-4 py-[3px] cursor-pointer" title="take back your last move">Undo</span>}
        <span onClick={() => setMode('reset')} className="nc-dlgbtn px-4 py-[3px] cursor-pointer" title="start over (asks to confirm)">Reset</span>
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px] cursor-pointer" title="progress is saved automatically">Close</span>
      </div>
    </div>
  );
}

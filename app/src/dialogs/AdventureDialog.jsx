import { useRef } from 'react';

// ADVENT.EXE window: the BOOT SECTOR adventure in a Norton-style dialog.
//
//   +-----------------------------------------+
//   |            ADVENT.EXE - Boot Sector      |   title bar
//   | +-------------------------------------+  |
//   | |  dark terminal: scrollback + prompt |  |   the "screen"
//   | +-------------------------------------+  |
//   |  [ compass ]   [ context + quick btns ]  |   control deck (grey chrome)
//   |                 [ Close ]                 |
//   +-----------------------------------------+
//
// The deck lives BELOW the screen on the grey chrome, and every control is a
// standard raised dialog button (.nc-dlgbtn) so it matches the rest of the UI.
// Built so the whole game is playable by tapping on a phone.
export default function AdventureDialog({ v }) {
  const inRef = useRef(null);
  const ui = v.advUi || { exits: {}, takes: [], exams: [], acts: [], cipher: false };
  const send = (cmd) => { v.advSend(cmd); if (inRef.current) inRef.current.focus(); };

  const onKey = (e) => {
    if (e.key === 'Enter') { const val = e.target.value; e.target.value = ''; v.advSend(val); }
    else if (e.key === 'Escape') { v.closeDialog(); }
    else if (!e.target.value) {
      const k = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e' }[e.key];
      if (k) { e.preventDefault(); v.advSend(k); }
    }
    e.stopPropagation();
  };

  // shared button look = the standard raised dialog button
  const Btn = ({ cmd, label, cls = '' }) => (
    <span onClick={() => send(cmd)} className={'nc-dlgbtn px-2.5 py-[4px] text-[12px] cursor-pointer select-none ' + cls}>
      {label}
    </span>
  );

  // compass: a tidy 3x3 rose; only live exits are pressable, dead ones sit flat
  const CELLS = [['', 'N', 'Up'], ['W', '', 'E'], ['', 'S', 'Dn']];
  const DIR = { N: 'n', S: 's', E: 'e', W: 'w', Up: 'u', Dn: 'd' };
  const Compass = () => (
    <div className="grid grid-cols-3 gap-1 shrink-0" style={{ width: '132px' }}>
      {CELLS.flat().map((label, i) => {
        if (!label) return <span key={i} />;
        const live = ui.exits[DIR[label]];
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

  return (
    <div onClick={(e) => { v.stop(e); if (inRef.current) inRef.current.focus(); }}
      className="bg-[#b8b8b8] text-black w-[600px] max-w-[95vw] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}>
      <div className="bg-dos-blue text-cyan text-center p-[3px] font-bold">ADVENT.EXE - Boot Sector</div>

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

      {/* control deck, on the grey chrome below the screen */}
      <div className="px-2.5 py-2.5 flex gap-3 items-start flex-wrap">
        <Compass />
        <div className="flex-1 min-w-[220px] flex flex-col gap-1.5">
          {(ui.takes.length > 0 || ui.exams.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {ui.takes.map((t, i) => <Btn key={'t' + i} cmd={t.cmd} label={t.label} cls="font-bold" />)}
              {ui.exams.map((x, i) => <Btn key={'x' + i} cmd={x.cmd} label={'Examine ' + x.label} />)}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {ui.acts.map((a, i) => <Btn key={'a' + i} cmd={a.cmd} label={a.label} />)}
            {ui.won && <Btn cmd="amusing" label="Amusing" />}
          </div>
          {ui.cipher && (
            <div className="text-[11px] text-[#06457a] mt-0.5 leading-snug">
              Cipher room: type <b>xor &lt;hex&gt; &lt;hex&gt;</b> to unmask a share, then <b>unseal &lt;word&gt;</b> in the volume.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px] cursor-pointer" title="progress is saved automatically">Close</span>
      </div>
    </div>
  );
}

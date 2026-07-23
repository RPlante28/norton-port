import { useRef, useState } from 'react';

// ADVENT.EXE window: the BOOT SECTOR adventure in a Norton-style dialog.
//
//   +-- ADVENT.EXE - Boot Sector ----------[x]-+   title bar (x closes)
//   | +-------------------------------------+  |
//   | |  dark terminal: scrollback + prompt |  |   the "screen"
//   | +-------------------------------------+  |
//   |  [ compass ]   [ stable action buttons ] |   control deck (grey chrome)
//   |                 [ Close ]                 |
//   +------------------------------------------+
//
// The main deck is stable room to room. Examine / Take open a focused
// sub-panel ("Examine what?" + this room's options + Back) so the deck never
// churns with per-room buttons. Everything is a standard raised dialog button,
// and the whole game is playable by tapping.
export default function AdventureDialog({ v }) {
  const inRef = useRef(null);
  const [mode, setMode] = useState('main'); // 'main' | 'examine' | 'take'
  const ui = v.advUi || { exits: {}, takes: [], exams: [], acts: [], cipher: false };
  const send = (cmd) => { v.advSend(cmd); if (inRef.current) inRef.current.focus(); };

  const onKey = (e) => {
    if (e.key === 'Enter') { const val = e.target.value; e.target.value = ''; v.advSend(val); }
    else if (e.key === 'Escape') { if (mode !== 'main') setMode('main'); else v.closeDialog(); }
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

  // compass: a tidy 3x3 rose; only live exits are pressable. In a sub-menu it
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

  // the control deck below the screen. Fixed footprint: the compass is always
  // present on the left (greyed in a sub-menu) with a divider, and the right
  // column is a fixed width whose buttons are centered in even rows. Only the
  // right column's content swaps, so nothing shifts between modes.
  const Deck = () => {
    const sub = mode !== 'main';
    const list = mode === 'examine' ? ui.exams : ui.takes;
    const heading = mode === 'examine' ? 'Examine what?' : 'Take what?';
    const empty = mode === 'examine' ? 'Nothing here worth a closer look.' : 'Nothing here to take.';
    return (
      <div className="px-3 py-3 flex justify-center">
        <div className="flex flex-wrap justify-center items-stretch gap-x-4 gap-y-3">
          <div className="flex items-center shrink-0"><Compass disabled={sub} /></div>
          <span className="hidden sm:block w-px bg-[#9a9a9a] self-stretch" />

          <div className="w-[300px] max-w-full flex flex-col justify-center">
            {mode === 'main' && (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  <Btn cmd="look" label="Look" />
                  <Btn cmd="map" label="Map" />
                  <Btn onTap={() => setMode('examine')} label="Examine…" />
                  {ui.takes.length > 0 && <Btn onTap={() => setMode('take')} label="Take…" />}
                  <Btn cmd="listen" label="Listen" />
                  <Btn cmd="inventory" label="Items" />
                  <Btn cmd="hint" label="Hint" />
                  <Btn cmd="score" label="Score" />
                  {ui.won && <Btn cmd="amusing" label="Amusing" />}
                </div>
                {ui.cipher && (
                  <div className="text-[11px] text-[#06457a] mt-2 leading-snug text-center">
                    Cipher room: type <b>xor &lt;hex&gt; &lt;hex&gt;</b> to unmask a share, then <b>unseal &lt;word&gt;</b> in the volume.
                  </div>
                )}
              </>
            )}

            {(mode === 'examine' || mode === 'take') && (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span onClick={() => setMode('main')} className="nc-dlgbtn px-2.5 py-[5px] text-[12px] cursor-pointer select-none">&lsaquo; Back</span>
                  <span className="text-[12px] text-[#06457a] font-bold">{heading}</span>
                </div>
                {list.length ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {list.map((o, i) => (
                      <Btn key={i} label={o.label}
                        onTap={() => { send(o.cmd); if (mode === 'take') setMode('main'); }} />
                    ))}
                  </div>
                ) : <div className="text-[12px] text-[#06457a] text-center">{empty}</div>}
              </>
            )}

            {mode === 'reset' && (
              <div className="text-center">
                <div className="text-[12px] text-[#06457a] mb-2 leading-snug">Reset the game?<br />This wipes all progress on this save.</div>
                <div className="flex justify-center gap-2">
                  <Btn onTap={() => { send('reset yes'); setMode('main'); }} label="Reset game" cls="font-bold" />
                  <Btn onTap={() => setMode('main')} label="Cancel" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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

      <Deck />

      <div className="flex justify-center gap-3 pb-3.5">
        <span onClick={() => setMode('reset')} className="nc-dlgbtn px-4 py-[3px] cursor-pointer" title="start over (asks to confirm)">Reset</span>
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px] cursor-pointer" title="progress is saved automatically">Close</span>
      </div>
    </div>
  );
}

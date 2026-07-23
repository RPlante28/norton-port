import { useRef } from 'react';

// ADVENT.EXE window: the BOOT SECTOR adventure in a Norton-style dialog.
// A dark terminal well, then a control deck: a compass (only valid exits are
// live), context buttons for taking/examining what's in the room, quick
// actions, and a text line for anything the buttons don't cover (xor / unseal
// / free verbs). Built so the whole game is playable by tapping on a phone.
export default function AdventureDialog({ v }) {
  const inRef = useRef(null);
  const ui = v.advUi || { exits: {}, takes: [], exams: [], acts: [], cipher: false };
  const send = (cmd) => { v.advSend(cmd); if (inRef.current) inRef.current.focus(); };

  const onKey = (e) => {
    if (e.key === 'Enter') { const val = e.target.value; e.target.value = ''; v.advSend(val); }
    else if (e.key === 'Escape') { v.closeDialog(); }
    else if (!e.target.value) {
      // empty line: arrow keys walk the map (desktop convenience)
      const k = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e' }[e.key];
      if (k) { e.preventDefault(); v.advSend(k); }
    }
    e.stopPropagation();
  };

  // compass: label, direction key, whether it's a live exit
  const DIRS = [['NW', null], ['N', 'n'], ['UP', 'u'], ['W', 'w'], ['·', null], ['E', 'e'], ['DN', 'd'], ['S', 's'], [' ', null]];
  const cbtn = 'text-[12px] leading-none py-2 text-center select-none';
  const Compass = () => (
    <div className="grid grid-cols-3 gap-1 w-[132px] shrink-0">
      {DIRS.map(([label, dir], i) => {
        const live = dir && ui.exits[dir];
        if (!dir) return <span key={i} className={cbtn + ' text-[#2a2a55]'}>{label}</span>;
        return (
          <span key={i} onClick={live ? () => send(dir) : undefined}
            className={cbtn + (live ? ' nc-advbtn cursor-pointer' : ' text-[#3a3a66] opacity-40')}>
            {label}
          </span>
        );
      })}
    </div>
  );

  const Chip = ({ cmd, label, tone }) => (
    <span onClick={() => send(cmd)}
      className={'nc-advbtn cursor-pointer text-[11.5px] px-2 py-[5px] whitespace-nowrap ' + (tone || '')}>
      {label}
    </span>
  );

  return (
    <div onClick={(e) => { v.stop(e); if (inRef.current) inRef.current.focus(); }}
      className="bg-[#b8b8b8] text-black w-[640px] max-w-[95vw] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}>
      <div className="bg-dos-blue text-cyan text-center p-[3px] font-bold">ADVENT.EXE - Boot Sector</div>

      <div className="m-2.5" style={{ borderStyle: 'solid', borderWidth: '2px', borderColor: '#7a7a7a #ffffff #ffffff #7a7a7a' }}>
        <div className="bg-[#000033] text-[#d4d8dc] px-3 pt-2 pb-2.5">
          <pre ref={v.advScrollRef}
            className="whitespace-pre-wrap leading-[1.45] text-[12.5px] h-[40vh] max-h-[380px] min-h-[200px] overflow-y-auto"
            style={{ fontFamily: 'inherit' }}>{v.advTerm}</pre>

          {/* control deck */}
          <div className="border-t border-[#1b2b55] pt-2 mt-1 flex gap-3 items-start">
            <Compass />
            <div className="flex-1 min-w-0">
              {(ui.takes.length > 0 || ui.exams.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {ui.takes.map((t, i) => <Chip key={'t' + i} cmd={t.cmd} label={t.label} tone="text-yellow" />)}
                  {ui.exams.map((x, i) => <Chip key={'x' + i} cmd={x.cmd} label={'x ' + x.label} />)}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {ui.acts.map((a, i) => <Chip key={'a' + i} cmd={a.cmd} label={a.label} />)}
                {ui.won && <Chip cmd="amusing" label="Amusing" />}
              </div>
              {ui.cipher && (
                <div className="text-[11px] text-[#8fb0e8] mt-1.5">
                  cipher: type  <span className="text-yellow">xor &lt;hex&gt; &lt;hex&gt;</span>  and  <span className="text-yellow">unseal &lt;word&gt;</span>  below
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-[#1b2b55] pt-2 mt-2">
            <span className="text-yellow shrink-0">&gt;</span>
            <input
              ref={(el) => { inRef.current = el; v.advInputRef(el); }}
              onKeyDown={onKey}
              className="flex-1 bg-transparent outline-none border-0 text-[#fcfc54] text-[12.5px] min-w-0"
              style={{ fontFamily: 'inherit', caretColor: '#fcfc54' }}
              placeholder="type here, or tap the buttons"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3.5 justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-4 py-[3px]" title="progress is saved automatically">Close</span>
      </div>
    </div>
  );
}

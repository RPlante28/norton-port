import { useRef } from 'react';

// ADVENT.EXE window: the BOOT SECTOR text adventure in a Norton-style dialog,
// laid out like the other dialogs (grey chrome, blue title bar) with a dark
// terminal well inside. Input is a single line; Enter sends, Escape closes.
export default function AdventureDialog({ v }) {
  const inRef = useRef(null);
  const onKey = (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value;
      e.target.value = '';
      v.advSend(val);
    } else if (e.key === 'Escape') {
      v.closeDialog();
    }
    e.stopPropagation();
  };
  return (
    <div onClick={(e) => { v.stop(e); if (inRef.current) inRef.current.focus(); }}
      className="bg-[#b8b8b8] text-black w-[620px] max-w-[94vw] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}>
      <div className="bg-dos-blue text-cyan text-center p-[3px] font-bold">ADVENT.EXE - Boot Sector</div>

      <div className="m-2.5" style={{ borderStyle: 'solid', borderWidth: '2px', borderColor: '#7a7a7a #ffffff #ffffff #7a7a7a' }}>
        <div className="bg-[#000033] text-[#d4d8dc] px-3 py-2">
          <pre ref={v.advScrollRef}
            className="whitespace-pre-wrap leading-[1.45] text-[12.5px] h-[46vh] max-h-[440px] overflow-y-auto"
            style={{ fontFamily: 'inherit' }}>{v.advTerm}</pre>
          <div className="flex items-center gap-1.5 border-t border-[#123] pt-1.5 mt-1">
            <span className="text-yellow shrink-0">&gt;</span>
            <input
              ref={(el) => { inRef.current = el; v.advInputRef(el); }}
              onKeyDown={onKey}
              className="flex-1 bg-transparent outline-none border-0 text-[#fcfc54] text-[12.5px]"
              style={{ fontFamily: 'inherit', caretColor: '#fcfc54' }}
              placeholder="look · x <thing> · n s e w u d · map · hint"
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

// The vim-style editor chrome (header + textarea + block cursor + status/command
// line). Shared by the right-panel overlay and the CLI full-screen; `cli` just
// bumps a few sizes to match the original.
export default function EditorOverlay({ v, cli }) {
  return (
    <>
      <div
        className={`flex-none bg-[#000060] text-cyan flex items-center gap-2 px-2 ${cli ? 'text-[13px] py-1' : 'text-[12px] py-[3px]'}`}
      >
        <span className="font-bold">VIM</span>
        <span>{v.edName}</span>
        <span className="flex-1"></span>
        <span className="nc-vbtn" onClick={v.saveEditor}>
          :w save
        </span>
        <span className="nc-vbtn" onClick={v.closeEditor}>
          :q quit
        </span>
      </div>
      <textarea
        className={`nc-ed ${cli ? 'flex-auto' : ''}`}
        ref={v.edRef}
        onKeyDown={v.onEdKey}
        onKeyUp={v.onEdCaret}
        onClick={v.onEdCaret}
        onScroll={v.onEdCaret}
        spellCheck="false"
        readOnly={v.edRo}
      ></textarea>
      <div className="nc-edcurs" ref={v.edCursRef}></div>
      <div
        className={`flex-none bg-[#000060] text-ink flex items-center gap-2 px-2 ${cli ? 'text-[13px] py-[3px]' : 'text-[12px] py-0.5'}`}
      >
        <span className="text-yellow">{v.edMode}</span>
        <span className="text-cyan text-[11px]">{v.edCursor}</span>
        <span className="text-[#8fb0e8]">{v.edStatus}</span>
        <span className="flex-1"></span>
        <span className="text-[#8fb0e8] text-[11px]">{v.edHint}</span>
        <input
          className={`nc-edcmd ${cli ? 'max-w-[160px]' : 'max-w-[140px]'}`}
          ref={v.edCmdRef}
          onKeyDown={v.onEdCmdKey}
          type="text"
          spellCheck="false"
          placeholder="w  q  wq  q!"
        />
      </div>
    </>
  );
}

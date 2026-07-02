// The always-present bottom command line (GUI mode). The input + block cursor
// keep the .nc-cmd / .nc-curs classes the engine's caret logic depends on.
export default function CommandLine({ v }) {
  return (
    <div className="flex-none px-0.5 py-px">
      <div className="flex items-center text-[13.5px] text-ink">
        <span className="whitespace-nowrap text-ink">{v.pathLine}&gt;&nbsp;</span>
        <span className="relative flex-1 flex items-center">
          <input
            className="nc-cmd nc-cmd-bc w-full"
            ref={v.cmdRef}
            onKeyDown={v.onCmdKey}
            onKeyUp={v.onCmdCaret}
            onClick={v.onCmdCaret}
            onFocus={v.onCmdCaret}
            type="text"
            spellCheck="false"
            autoComplete="off"
            placeholder="type a command  (help, cd projects, open maps, go github, mail) and press Enter"
          />
          <span className="nc-curs left-0" ref={v.cmdCursRef}>
            &nbsp;
          </span>
        </span>
      </div>
      {v.hasCmdMsg && <div className="text-[12px] text-yellow pt-px px-0.5">{v.cmdMsg}</div>}
    </div>
  );
}

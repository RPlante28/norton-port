import EditorOverlay from './EditorOverlay.jsx';

// Full-screen CLI-only mode: scrollback terminal + prompt, or the editor when a
// file is open in the terminal.
export default function CliFullScreen({ v }) {
  return (
    <div className="fixed inset-0 z-[70] bg-dos-blue flex flex-col px-3 py-2.5">
      {v.cliTermView && (
        <>
          <div className="flex-none text-yellow text-[12px] border-b border-edge-dim pb-1 mb-1.5">
            ROHAN-DOS - CLI mode - type  help  for commands,  gui  to return
          </div>
          <div
            className="flex-auto min-h-0 overflow-auto whitespace-pre-wrap text-ink text-[13.5px] leading-[1.45]"
            ref={v.termScrollRef}
            onClick={v.focusCli}
          >
            {v.termText}
          </div>
          <div className="flex-none flex items-center text-[13.5px] text-ink border-t border-edge-dim mt-1 pt-1">
            <span className="whitespace-nowrap" style={{ color: v.cliPromptColor }}>
              {v.cliPrompt}&nbsp;
            </span>
            <span className="relative flex-1 flex items-center">
              <input
                className="nc-cmd nc-cmd-bc w-full"
                ref={v.cliRef}
                onKeyDown={v.onCliKey}
                onKeyUp={v.onCliCaret}
                onClick={v.onCliCaret}
                onFocus={v.onCliCaret}
                type={v.cliInputType}
                spellCheck="false"
                autoComplete="off"
                placeholder={v.cliPlaceholder}
              />
              <span className="nc-curs left-0" ref={v.cliCursRef}>
                &nbsp;
              </span>
            </span>
          </div>
        </>
      )}
      {v.edInCli && <EditorOverlay v={v} cli />}
    </div>
  );
}

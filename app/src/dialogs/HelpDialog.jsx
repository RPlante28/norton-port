export default function HelpDialog({ v }) {
  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[520px] max-w-[94vw] text-[13px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}
    >
      <div className="bg-dos-blue text-cyan flex items-center px-2 py-[3px] font-bold">
        <span className="flex-1">Help &amp; Keyboard Shortcuts</span>
        <span onClick={v.closeDialog} className="nc-close">
          x
        </span>
      </div>
      <div className="px-4 py-3.5 leading-[1.55]">
        <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1">
          <span className="text-dos-blue font-bold">Arrows</span>
          <span>move the highlight in the active panel</span>
          <span className="text-dos-blue font-bold">Enter</span>
          <span>open the highlighted file or folder</span>
          <span className="text-dos-blue font-bold">Backspace / ..</span>
          <span>go up a level (lands on the folder you left)</span>
          <span className="text-dos-blue font-bold">O</span>
          <span>toggle full-screen CLI mode</span>
          <span className="text-dos-blue font-bold">F1</span>
          <span>this help window</span>
          <span className="text-dos-blue font-bold">Esc</span>
          <span>close a window / menu / go back</span>
        </div>
        <div className="border-t-2 border-[#8a8a8a] mt-3 mb-2.5"></div>
        <div className="text-[#06457a] font-bold mb-[5px]">Useful commands (type below or in CLI)</div>
        <div className="font-mono text-[12px] text-[#222] leading-[1.7]">
          help · tree · ls · cd &lt;dir&gt; · cat &lt;file&gt; (try cat *.txt )<br />
          open &lt;name&gt; · mail · 6502 · go github · clear
        </div>
      </div>
      <div className="flex justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px]">
          &nbsp;Ok&nbsp;
        </span>
      </div>
    </div>
  );
}

// ADVENT.EXE splash: shown when the hidden EXE is selected in the file panel.
// Mirrors the SENDMAIL.EXE pattern: ASCII art, a one-line pitch, a RUN button.
const DISK_ART = [
  ' _________________________ ',
  '|  _____________________  |',
  '| |  BOOT SECTOR  v1.0  | |',
  '| |  track 0, sector 1  | |',
  '| |_____________________| |',
  '|    _________________    |',
  '|   |   |         |   |   |',
  '|   |   |  55 ??  |   |   |',
  '|___|___|_________|___|___|',
].join('\n');

export default function AdventView({ v }) {
  return (
    <div className="p-[18px] text-center">
      <pre className="inline-block text-left mb-3.5 text-cyan text-[13px] leading-[1.2]">{DISK_ART}</pre>
      <div className="text-[12px] text-yellow mb-1.5">ADVENT.EXE - executable · 21,930 bytes</div>
      <div className="text-[13.5px] leading-[1.6] max-w-[46ch] mx-auto mb-4">
        A text adventure inside this machine. The boot signature is gone; you are an unprivileged process; nine subsystems stand between you and a clean POST. Progress is saved.
      </div>
      <div className="flex flex-wrap gap-2.5 justify-center">
        <span className="nc-btn cursor-pointer" onClick={v.openAdventWin}>
          ▶ RUN - Boot Sector
        </span>
      </div>
      <div className="text-[11px] text-[#8fb0e8] mt-[18px]">// press RUN, or type  adventure  - saved to local disk</div>
    </div>
  );
}

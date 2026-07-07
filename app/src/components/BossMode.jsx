// Boss key: an instant fake spreadsheet that covers the whole screen (Esc closes).
const GRID = 'grid grid-cols-[46px_230px_repeat(4,1fr)]';

export default function BossMode({ v }) {
  return (
    <div className="fixed inset-0 z-[200] bg-white text-[#1a1a1a] font-mono flex flex-col text-[13px]">
      <div className="flex-none bg-[#107c41] text-white flex items-center gap-2.5 px-2.5 py-[3px] text-[12px]">
        <span className="font-bold">QuattroCalc</span>
        <span className="opacity-[0.85]">- FY2026_Operating_Plan.xls</span>
        <span className="flex-1"></span>
        <span className="opacity-[0.85]">[CONFIDENTIAL · FINANCE]</span>
        <span className="bg-[#0e6b38] px-[7px]">–</span>
        <span className="bg-[#0e6b38] px-[7px]">□</span>
        <span className="bg-[#c0392b] px-[7px]">×</span>
      </div>
      <div className="flex-none bg-[#f1f1f1] border-b border-[#c8c8c8] flex gap-[18px] px-3 py-[3px] text-[12px] text-[#333]">
        <span className="underline">F</span>
        <span>ile</span>
        <span>Edit</span>
        <span>View</span>
        <span>Insert</span>
        <span>Format</span>
        <span>Data</span>
        <span>Tools</span>
        <span>Window</span>
        <span>Help</span>
      </div>
      <div className="flex-none flex items-stretch border-b border-[#c8c8c8] text-[12px]">
        <div className="w-16 border-r border-[#c8c8c8] px-2 py-[3px] text-[#444]">N14</div>
        <div className="flex-1 px-2.5 py-[3px] text-[#666] italic">
          fx  ="may or may not have been built on a little company time"
        </div>
      </div>
      <div className="flex-auto min-h-0 overflow-auto bg-white">
        <div className={`${GRID} sticky top-0`}>
          <div className="bg-[#f1f1f1] border border-[#d4d4d4]">&nbsp;</div>
          <div className="bg-[#f1f1f1] border border-[#d4d4d4] text-center text-[#555]">A</div>
          <div className="bg-[#f1f1f1] border border-[#d4d4d4] text-center text-[#555]">B</div>
          <div className="bg-[#f1f1f1] border border-[#d4d4d4] text-center text-[#555]">C</div>
          <div className="bg-[#f1f1f1] border border-[#d4d4d4] text-center text-[#555]">D</div>
          <div className="bg-[#f1f1f1] border border-[#d4d4d4] text-center text-[#555]">E</div>
        </div>
        {v.bossRows.map((r, i) => (
          <div key={i} className={GRID}>
            <div className="bg-[#f1f1f1] border border-[#e2e2e2] text-center text-[#777]">{r.n}</div>
            <div className="border border-[#e8e8e8] px-2 py-0.5" style={{ fontWeight: r.wt, color: r.lc }}>
              {r.a}
            </div>
            <div className="border border-[#e8e8e8] px-2 py-0.5 text-right" style={{ fontWeight: r.wt }}>
              {r.b}
            </div>
            <div className="border border-[#e8e8e8] px-2 py-0.5 text-right" style={{ fontWeight: r.wt }}>
              {r.c}
            </div>
            <div className="border border-[#e8e8e8] px-2 py-0.5 text-right" style={{ fontWeight: r.wt }}>
              {r.d}
            </div>
            <div className="border border-[#e8e8e8] px-2 py-0.5 text-right" style={{ fontWeight: r.wt }}>
              {r.e}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-none bg-[#f1f1f1] border-t border-[#c8c8c8] flex items-center gap-4 px-3 py-[3px] text-[11px] text-[#555]">
        <span>Ready</span>
        <span>Sum=0</span>
        <span>NUM</span>
        <span className="flex-1"></span>
        <span className="text-[#999]">press Esc to recalculate</span>
      </div>
    </div>
  );
}

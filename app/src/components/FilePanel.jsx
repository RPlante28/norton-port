// Left-hand file browser panel: floating title, Name/Size/Date header, the file
// rows (styled by the engine via .nc-frow), and the mini status line.
export default function FilePanel({ v }) {
  return (
    <div className="relative flex flex-col min-h-0 border-[3px] border-double border-cyan">
      <div className="absolute -top-[11px] left-0 right-0 text-center pointer-events-none">
        <span className="bg-dos-blue px-3 text-cyan text-[13px]">{v.leftTitle}</span>
      </div>
      <div className="grid grid-cols-[1fr_104px_92px] max-[700px]:grid-cols-1 text-cyan text-[13px] pt-2 pb-[3px] border-b border-edge-dim">
        <span className="px-1.5 text-center">Name</span>
        <span className="px-1.5 text-center border-l border-edge-dim max-[700px]:hidden">Size</span>
        <span className="px-1.5 text-center border-l border-edge-dim max-[700px]:hidden">Date</span>
      </div>
      <div className="flex-auto overflow-auto pt-0.5">
        {v.rows.map((r, ri) => (
          <div key={ri} className={r.cls} onClick={r.onClick}>
            <span style={{ color: r.nameColor }}>{r.name}</span>
            <span>{r.size}</span>
            <span>{r.date}</span>
          </div>
        ))}
      </div>
      {v.showStatus && (
        <>
          <div className="border-t border-cyan text-center text-[13px] p-[3px] text-white">
            {v.selName} &nbsp; {v.selDate} &nbsp; 21:38
          </div>
          <div className="text-center text-[12px] text-muted pb-1">
            {v.fileCount} file(s) · {v.dirCount} dir(s)
          </div>
        </>
      )}
    </div>
  );
}

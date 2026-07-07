// NC-authentic directory preview: shows a highlighted folder's contents in the
// right pane; click a row to open it or browse deeper (delegated in the engine).
export default function DirPreview({ v }) {
  return (
    <div className="px-3 py-2.5">
      <div className="text-yellow text-[12px] tracking-[0.06em] mb-2">{v.dirPreviewName}</div>
      <div className="border-t border-edge-dim mb-1.5"></div>
      {v.dirPreviewEmpty && <div className="text-dim text-[12.5px] italic">(empty directory)</div>}
      <div onClick={v.dirPreviewOpen}>
        {v.dirPreviewItems.map((dp, i) => (
          <div
            key={i}
            className="nc-dprow flex gap-2 text-[12.5px] leading-[1.7] cursor-pointer px-1"
            data-dpidx={dp.i}
            style={{ color: dp.color }}
          >
            <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap pointer-events-none">{dp.n}</span>
            <span className="text-dim flex-none pointer-events-none">{dp.s}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-edge-dim mt-2 pt-1.5 text-[11px] text-dim">Click an item to open it or go deeper · or press Enter</div>
    </div>
  );
}

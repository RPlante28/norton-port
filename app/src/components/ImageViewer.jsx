// Full-screen image viewer (shows the untouched colour original of a dithered
// thumbnail); click anywhere or Esc to close.
export default function ImageViewer({ v }) {
  return (
    <div
      onClick={v.closeImg}
      className="fixed inset-0 z-[9500] flex items-center justify-center cursor-zoom-out"
      style={{ background: 'rgba(0,0,42,0.86)' }}
    >
      <div
        className="relative max-w-[90vw] max-h-[88vh] flex flex-col border-2 border-cyan"
        style={{ boxShadow: '0 0 0 1px #0000a8, 8px 8px 0 rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between gap-[18px] bg-dos-blue text-white px-2.5 py-1 text-[13px] tracking-[0.04em]">
          <span className="text-cyan">IMAGE VIEWER</span>
          <span className="text-yellow">{v.imgViewName}</span>
          <span onClick={v.closeImg} className="cursor-pointer text-white px-1">
            [X]
          </span>
        </div>
        <div className="bg-black p-2.5 flex items-center justify-center overflow-hidden">{v.imgViewNode}</div>
        <div className="bg-dos-blue text-[#a8d4ff] px-2.5 py-[3px] text-[11px] tracking-[0.05em] flex justify-between gap-[18px]">
          <span>{v.imgViewMeta}</span>
          <span className="text-muted">click anywhere or press Esc to close</span>
        </div>
      </div>
    </div>
  );
}

import { useRef } from 'react';

// Full-screen media viewer. For entries with several images it becomes a gallery:
// prev/next arrows, a counter, clickable dots, plus keyboard arrows and swipe.
// Click the backdrop or press Esc to close.
export default function ImageViewer({ v }) {
  const many = v.imgViewCount > 1;
  const touch = useRef({ x: 0, y: 0 });

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) { (dx < 0 ? v.imgNext : v.imgPrev)(); }
  };

  const arrow = 'absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-16 ' +
    'bg-dos-blue/80 text-cyan border border-cyan cursor-pointer select-none text-[26px] leading-none hover:bg-cyan hover:text-dos-blue';

  return (
    <div
      onClick={v.closeImg}
      className="fixed inset-0 z-[9500] flex items-center justify-center cursor-zoom-out"
      style={{ background: 'rgba(0,0,42,0.86)' }}
    >
      <div
        onClick={v.stop}
        className="relative max-w-[94vw] max-h-[90vh] flex flex-col border-2 border-cyan cursor-default"
        style={{ boxShadow: '0 0 0 1px #0000a8, 8px 8px 0 rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between gap-[18px] bg-dos-blue text-white px-2.5 py-1 text-[13px] tracking-[0.04em]">
          <span className="text-cyan whitespace-nowrap">IMAGE VIEWER{many ? ' · ' + (v.imgViewIndex + 1) + '/' + v.imgViewCount : ''}</span>
          <span className="text-yellow truncate">{v.imgViewName}</span>
          <span onClick={v.closeImg} className="cursor-pointer text-white px-1">[X]</span>
        </div>

        <div className="relative bg-black p-2.5 flex items-center justify-center overflow-hidden"
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {many && (
            <span className={arrow + ' left-0'} onClick={(e) => { e.stopPropagation(); v.imgPrev(); }} aria-label="previous">&#8249;</span>
          )}
          {v.imgViewNode}
          {many && (
            <span className={arrow + ' right-0'} onClick={(e) => { e.stopPropagation(); v.imgNext(); }} aria-label="next">&#8250;</span>
          )}
        </div>

        {many && v.imgViewCount <= 12 && (
          <div className="bg-dos-blue flex justify-center gap-1.5 py-1.5">
            {Array.from({ length: v.imgViewCount }).map((_, i) => (
              <span key={i} onClick={(e) => { e.stopPropagation(); v.imgGoto(i); }}
                className={'cursor-pointer w-2.5 h-2.5 border border-cyan ' + (i === v.imgViewIndex ? 'bg-cyan' : 'bg-transparent hover:bg-[#2f6fd0]')} />
            ))}
          </div>
        )}

        <div className="bg-dos-blue text-[#a8d4ff] px-2.5 py-[3px] text-[11px] tracking-[0.05em] flex justify-between gap-[18px]">
          <span className="truncate">{v.imgViewMeta}</span>
          <span className="text-muted whitespace-nowrap">{many ? '‹ › / swipe · Esc' : 'click outside or Esc'}</span>
        </div>
      </div>
    </div>
  );
}

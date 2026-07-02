// Tableau dashboard popup (iframe).
export default function DashDialog({ v }) {
  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[92vw] max-w-[1100px] h-[84vh] flex flex-col"
      style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.5)' }}
    >
      <div className="bg-dos-blue text-cyan flex items-center gap-2 px-2 py-[3px] font-bold flex-none">
        <span className="flex-1">{v.dashTitle}</span>
        <a
          className="nc-link text-[11px]"
          href={v.dashLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fcfc54' }}
        >
          OPEN ON TABLEAU ▸
        </a>
        <span onClick={v.closeDialog} className="nc-close">
          x
        </span>
      </div>
      <iframe src={v.dashSrc} title={v.dashTitle} className="flex-auto w-full border-none block bg-white"></iframe>
    </div>
  );
}

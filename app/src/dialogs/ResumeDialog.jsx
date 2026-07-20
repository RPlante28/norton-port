// Résumé PDF popup (iframe), with open-in-tab and download links.
export default function ResumeDialog({ v }) {
  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[90vw] max-w-[900px] h-[88vh] flex flex-col"
      style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.5)' }}
    >
      <div className="bg-dos-blue text-cyan flex items-center gap-2.5 px-2 py-[3px] font-bold flex-none">
        <span className="flex-1">RESUME.PDF - Rohan Plante</span>
        <a
          className="nc-link text-[11px]"
          href={v.links.resume}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fcfc54', textDecoration: 'none' }}
        >
          OPEN IN NEW TAB ▸
        </a>
        <a
          className="nc-link text-[11px]"
          href={v.links.resume}
          download
          style={{ color: '#fcfc54', textDecoration: 'none' }}
        >
          DOWNLOAD ▾
        </a>
        <span onClick={v.closeDialog} className="nc-close">
          x
        </span>
      </div>
      <iframe
        src={`${v.links.resume}#toolbar=1&view=FitH`}
        title="Rohan Plante resume"
        className="flex-auto w-full border-none block bg-white"
      ></iframe>
    </div>
  );
}

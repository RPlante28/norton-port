// Education view: Marist, notes, coursework tags, and out-of-class links.
export default function EduView({ v }) {
  return (
    <div className="px-[18px] py-4">
      <div className="text-[19px] text-white">
        <a
          className="nc-link"
          href="https://www.marist.edu"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fff' }}
        >
          {v.edu.school}
        </a>
      </div>
      <div className="text-[12px] text-yellow mt-[3px] mb-2 tracking-[0.04em]">{v.edu.meta}</div>
      <div className="italic text-muted text-[13.5px] mb-3">{v.edu.sub}</div>
      {v.edu.notes.map((n, i) => (
        <div key={i} className="text-[13.5px] leading-[1.5] mb-1.5 pl-4 [text-indent:-16px]">
          <span className="text-cyan">› </span>
          {n}
        </div>
      ))}
      <div className="text-[#8fb0e8] text-[12px] mt-3.5 mb-2">C:\ROHAN&gt; dir coursework</div>
      <div className="flex flex-wrap gap-1.5">
        {v.edu.coursework.map((c, i) => (
          <span key={i} className="nc-tag">
            {c}
          </span>
        ))}
      </div>
      <div className="border-t border-edge-dim mt-4 mb-3"></div>
      <div className="text-[12px] text-muted mb-2">Outside of class:</div>
      <div className="flex flex-col gap-2 items-start">
        <span className="nc-btn cursor-pointer" onClick={v.openMcServer}>
          ▣ Event Coordinator, Marist MC Server ▸
        </span>
        <span className="nc-btn cursor-pointer" onClick={v.openCompSoc}>
          ▣ VP / Secretary, Marist Computer Society ▸
        </span>
        <span className="nc-btn cursor-pointer" onClick={v.openDataAnl}>
          ▣ Data Analyst Assistant, Marist University ▸
        </span>
      </div>
    </div>
  );
}

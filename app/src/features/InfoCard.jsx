// The default WHOAMI / home info card: portrait, identity grid, blurb, quick
// links, and the full skills list. All the text comes from `profile` in
// content.js (v.profile); this file is only layout + styling.

// availability.status -> how the badge looks. Edit the status in content.js.
const AVAIL = {
  open: { word: 'AVAILABLE', color: 'text-green', dot: 'bg-green', blink: true },
  chat: { word: 'OPEN TO CHAT', color: 'text-cyan', dot: 'bg-cyan', blink: true },
  employed: { word: 'HEADS-DOWN', color: 'text-yellow', dot: 'bg-yellow', blink: false },
  closed: null,
};

export default function InfoCard({ v }) {
  const p = v.profile || {};
  const avail = AVAIL[(p.availability && p.availability.status) || 'open'];
  const closer = (p.closer && p.closer[(p.availability && p.availability.status) || 'open']) || '';

  return (
    <div className="px-[18px] pt-4 pb-3.5">
      <div className="flex items-baseline justify-end mb-2.5">
        <span className="text-yellow text-[11px]">v{v.build.version} · {v.build.released}</span>
      </div>
      <div className="border-t border-edge-dim mb-3.5"></div>

      <div className="flex gap-3.5 items-start mb-3.5">
        <div className="flex-none">
          <img
            src={p.photo}
            alt={p.name}
            onClick={v.viewImg}
            className="block w-[120px] cursor-zoom-in [image-rendering:pixelated] border border-edge"
            style={{ filter: 'grayscale(1) brightness(1.06) contrast(1.05)' }}
          />
        </div>
        <div className="flex-auto min-w-0">
          <div className="text-[22px] text-white tracking-[0.03em] leading-none">{p.name}</div>
          <div className="text-cyan text-[12px] mt-[3px] mb-2 tracking-[0.05em]">{p.title}</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 text-[12.5px] leading-[1.7]">
            {(p.facts || []).map(([label, value], i) => (
              <span className="contents" key={i}>
                <span className="text-yellow">{label}</span>
                <span>{value}</span>
              </span>
            ))}
          </div>
          {avail && (
            <div className="flex items-center gap-[7px] mt-[9px] text-[12px]">
              <span
                className={`w-2 h-2 ${avail.dot} inline-block`}
                style={avail.blink ? { animation: 'ncblink 1.3s steps(1) infinite' } : undefined}
              ></span>
              <span className={avail.color}>{avail.word}</span>
              {p.availability && p.availability.note && (
                <span className="text-muted">- {p.availability.note}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-edge-dim mb-3"></div>

      <div className="text-[13px] leading-[1.62] text-ink max-w-[56ch] mb-3">
        {(p.blurb || []).map((seg, i) => {
          if (typeof seg === 'string') return <span key={i}>{seg}</span>;
          if (seg.href)
            return (
              <a key={i} className="nc-link" href={seg.href} target="_blank" rel="noopener noreferrer">
                {seg.text}
              </a>
            );
          const onClick = seg.app === 'vm' ? v.openVM : v.openNorton;
          return (
            <span key={i} className="nc-link cursor-pointer" onClick={onClick}>
              {seg.text}
            </span>
          );
        })}
        {closer}
      </div>

      <div className="flex gap-2 flex-wrap mb-3.5">
        <a className="nc-btn" href={p.links && p.links.github} target="_blank" rel="noopener noreferrer">GitHub ▸</a>
        <a className="nc-btn" href={p.links && p.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ▸</a>
        <a className="nc-btn" href={`mailto:${p.links && p.links.email}`}>E-mail ▸</a>
        <span className="nc-btn cursor-pointer" onClick={v.openResume}>Resume ▸</span>
      </div>

      <div className="border-t border-edge-dim mb-2.5"></div>
      <div className="text-yellow text-[11px] tracking-[0.06em] mb-[7px]">SKILLS</div>
      <div className="flex flex-wrap gap-[5px] mb-3.5">
        {v.homeSkills.map((sk, i) => (
          <span key={i} className="nc-tag">
            {sk}
          </span>
        ))}
      </div>

      <div className="border-t border-edge-dim mb-2.5"></div>
      <div className="flex gap-3.5 flex-wrap text-[11px] text-dim mb-2">
        <span>MEM 640K OK</span>
        <span>{v.homeStats.dirs} DIRS · {v.homeStats.projects} PROJECTS</span>
        <span>SYS 6502 @ 1.79MHz</span>
        {v.hitLabel && <span>{v.hitLabel}</span>}
        <span>READY ▮</span>
      </div>
      <div className="text-[11.5px] text-dim leading-[1.55]">
        Press <span className="text-cyan">F1</span> for help, pick a folder on the left, or type{' '}
        <span className="text-cyan">help</span> below.  This is WHOAMI.TXT - return any time with{' '}
        <span className="text-cyan">cat WHOAMI.TXT</span>.
      </div>
    </div>
  );
}

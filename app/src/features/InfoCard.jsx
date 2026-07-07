// The default WHOAMI / home info card: portrait, identity grid, blurb, quick
// links, and the full skills list.
export default function InfoCard({ v }) {
  return (
    <div className="px-[18px] pt-4 pb-3.5">
      <div className="flex items-baseline justify-end mb-2.5">
        <span className="text-yellow text-[11px]">v5.51 · JUN 2026</span>
      </div>
      <div className="border-t border-edge-dim mb-3.5"></div>

      <div className="flex gap-3.5 items-start mb-3.5">
        <div className="flex-none">
          <img
            src="assets/dither-bw.png"
            alt="Rohan Plante"
            onClick={v.viewImg}
            className="block w-[120px] cursor-zoom-in [image-rendering:pixelated] border border-edge"
            style={{ filter: 'grayscale(1) brightness(1.06) contrast(1.05)' }}
          />
        </div>
        <div className="flex-auto min-w-0">
          <div className="text-[22px] text-white tracking-[0.03em] leading-none">ROHAN PLANTE</div>
          <div className="text-cyan text-[12px] mt-[3px] mb-2 tracking-[0.05em]">COMPUTER SCIENCE  ·  MARIST UNIVERSITY</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 text-[12.5px] leading-[1.7]">
            <span className="text-yellow">GPA</span>
            <span>3.67 / 4.0 · Dean's List, every semester</span>
            <span className="text-yellow">FOCUS</span>
            <span>Software Development</span>
            <span className="text-yellow">NOW</span>
            <span>Data Analyst · Marist Office of Community &amp; Belonging</span>
            <span className="text-yellow">HOME</span>
            <span>Middleton, MA  ·  school in Poughkeepsie, NY</span>
          </div>
          <div className="flex items-center gap-[7px] mt-[9px] text-[12px]">
            <span
              className="w-2 h-2 bg-green inline-block"
              style={{ animation: 'ncblink 1.3s steps(1) infinite' }}
            ></span>
            <span className="text-green">AVAILABLE</span>
            <span className="text-muted">- seeking software / data internships</span>
          </div>
        </div>
      </div>

      <div className="border-t border-edge-dim mb-3"></div>

      <div className="text-[13px] leading-[1.62] text-ink max-w-[56ch] mb-3">
        I'm a Computer Science student at Marist University who likes building real, working systems, the kind with moving parts you can actually watch run. I've built a{' '}
        <a className="nc-link" href="https://github.com/RPlante28/MaristMaps" target="_blank" rel="noopener noreferrer">campus navigator</a> with a voice-enabled AI agent, rebuilt a{' '}
        <a className="nc-link" href="https://github.com/RPlante28/6502-emulator" target="_blank" rel="noopener noreferrer">6502 CPU</a> one pipeline stage at a time, and shipped full-stack apps, data pipelines, and interactive maps. This whole{' '}
        <span className="nc-link cursor-pointer" onClick={v.openNorton}>portfolio</span> is one of those projects, a DOS-era interface you're exploring right now. I'm looking for software and data internships where I can build things that matter.
      </div>

      <div className="flex gap-2 flex-wrap mb-3.5">
        <a className="nc-btn" href="https://github.com/RPlante28" target="_blank" rel="noopener noreferrer">GitHub ▸</a>
        <a className="nc-btn" href="https://linkedin.com/in/rohan-plante" target="_blank" rel="noopener noreferrer">LinkedIn ▸</a>
        <a className="nc-btn" href="mailto:rohanplante@gmail.com">E-mail ▸</a>
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
        <span>7 DIRS · 9 PROJECTS</span>
        <span>SYS 6502 @ 1.79MHz</span>
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

// The live 6502 scalar-pipeline VM: program picker, pipeline stages, registers,
// stats, SYS output, memory dump, and transport controls.
export default function Vm6502({ v }) {
  return (
    <div className="px-3 py-2.5 overflow-auto">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[12px] text-yellow">CPU6502.SYS - scalar-pipeline 6502</span>
        <span className="flex-1"></span>
        <span className="text-[11px] text-[#8fb0e8]">program:</span>
        <select className="nc-vsel" value={v.vm.progKey} onChange={v.vm.onPickProgram}>
          {v.vm.programs.map((pg, i) => (
            <option key={i} value={pg.key}>
              {pg.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-edge p-2 mb-[9px]">
        <div className="text-cyan text-[11px] mb-1.5">PIPELINE  ·  one instruction advances one stage per clock</div>
        <div className="flex gap-1.5 items-stretch">
          {v.vm.stages.map((sg, i) => (
            <div key={i} className={sg.cls}>
              <div className="text-[9.5px] text-[#8fb0e8] tracking-[0.06em]">{sg.label}</div>
              <div className="text-[15px] font-bold text-yellow">{sg.op}</div>
              <div className="text-[9.5px] text-muted">{sg.mnem}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-[9px] flex-wrap items-start">
        <div className="border border-edge px-[9px] py-[7px] text-[13px] min-w-[118px]">
          <div className="text-cyan border-b border-edge-dim mb-[5px] pb-[3px] text-[11px]">REGISTERS</div>
          <div>A&nbsp; $<span className="text-yellow">{v.vm.A}</span></div>
          <div>X&nbsp; $<span className="text-yellow">{v.vm.X}</span></div>
          <div>Y&nbsp; $<span className="text-yellow">{v.vm.Y}</span></div>
          <div>PC $<span className="text-yellow">{v.vm.PC}</span></div>
          <div className="mt-[7px] text-cyan text-[11px]">FLAGS</div>
          <div className="flex gap-2 font-bold">
            {v.vm.flags.map((fl, i) => (
              <span key={i} style={{ color: fl.col }}>
                {fl.f}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-edge px-[9px] py-[7px] text-[12px] min-w-[188px]">
          <div className="text-cyan border-b border-edge-dim mb-[5px] pb-[3px] text-[11px]">PIPELINE STATS</div>
          <div className="grid grid-cols-[1fr_auto] gap-x-2.5 text-muted">
            <span>cycles</span>
            <span className="text-yellow">{v.vm.cycles}</span>
            <span>retired</span>
            <span className="text-yellow">{v.vm.retired}</span>
            <span>IPC</span>
            <span className="text-yellow">{v.vm.ipc}</span>
            <span>fetch stalls</span>
            <span className="text-yellow">{v.vm.fetchStalls}</span>
            <span>INC stalls</span>
            <span className="text-yellow">{v.vm.incStalls}</span>
            <span>branch flush</span>
            <span className="text-yellow">{v.vm.branchFlushes}</span>
            <span>bubbles</span>
            <span className="text-yellow">{v.vm.bubbles}</span>
          </div>
        </div>

        <div className="border border-edge px-[9px] py-[7px] text-[12.5px] flex-1 min-w-[190px] self-stretch">
          <div className="text-cyan mb-[5px] text-[11px]">SYS OUTPUT</div>
          <pre className="m-0 whitespace-pre-wrap break-words text-yellow min-h-[54px] text-[13px] leading-[1.4]">{v.vm.out}</pre>
        </div>
      </div>

      <div className="border border-edge px-[9px] py-[7px] mt-[9px]">
        <div className="flex items-center gap-2 mb-[5px]">
          <span className="text-cyan text-[11px]">MEMORY  {v.vm.pageLabel}</span>
          <span className="flex-1"></span>
          <span className="nc-vbtn" onClick={v.vmPageDown}>
            ◀ page
          </span>
          <span className="nc-vbtn" onClick={v.vmPageUp}>
            page ▶
          </span>
        </div>
        <div className="font-mono text-[11px] overflow-auto">
          {v.vm.memRows.map((mr, i) => (
            <div key={i} className="flex whitespace-pre">
              <span className="text-dim pr-2">{mr.addr}</span>
              {mr.cells.map((mc, ci) => (
                <span
                  key={ci}
                  style={{ display: 'inline-block', width: '19px', textAlign: 'center', background: mc.bg, color: mc.fg }}
                >
                  {mc.v}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2.5 items-center flex-wrap">
        <span className="nc-vbtn" onClick={v.vmStep}>
          Step ▷
        </span>
        <span className="nc-vbtn" onClick={v.vmRun}>
          {v.vm.runLabel}
        </span>
        <span className="nc-vbtn" onClick={v.vmReset}>
          ⟲ Reload
        </span>
        <span className="flex items-center gap-[5px] text-[#8fb0e8] text-[11px]">
          clock
          <select className="nc-vsel" value={v.vm.speedIdx} onChange={v.vm.onPickSpeed}>
            {v.vm.speeds.map((sp, i) => (
              <option key={i} value={sp.i}>
                {sp.label}
              </option>
            ))}
          </select>
        </span>
        <span className="nc-vbtn" onClick={v.vmEdit}>
          ✎ Edit code
        </span>
        <span className="nc-vbtn" onClick={v.vmNew}>
          + New program
        </span>
        <span className="flex-1"></span>
        <span className="text-yellow text-[11px]">{v.vm.haltMsg}</span>
      </div>
      <div className="text-[#8fb0e8] text-[11px] mt-2 leading-[1.5]">{v.vm.loadMsg}</div>
      <div className="text-dim text-[11px] mt-1 leading-[1.5]">
        Faithful port of my{' '}
        <a className="nc-link" href="https://github.com/RPlante28/422-tsiraM/tree/scalar-pipeline" target="_blank" rel="noopener noreferrer">
          tsiraM-6502
        </a>{' '}
        scalar pipeline (fetch→decode→execute→writeback→interrupt, with fetch / INC / branch hazard stalls). Pick a sample, Step through it, or write your own in hex or assembly with <b>+ New program</b>.
      </div>
    </div>
  );
}

import { s } from '../util/style.js';

// The live 6502 scalar-pipeline VM: program picker, pipeline stages, registers,
// stats, SYS output, memory dump, and transport controls.
export default function Vm6502({ v }) {
  return (
    <div style={s("padding:10px 12px; overflow:auto;")}>
      <div style={s("display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;")}>
        <span style={s("font-size:12px; color:#fcfc54;")}>CPU6502.SYS - scalar-pipeline 6502</span>
        <span style={s("flex:1;")}></span>
        <span style={s("font-size:11px; color:#8fb0e8;")}>program:</span>
        <select className="nc-vsel" value={v.vm.progKey} onChange={v.vm.onPickProgram}>
          {v.vm.programs.map((pg, i) => (<option key={i} value={pg.key}>{pg.label}</option>))}
        </select>
      </div>

      <div style={s("border:1px solid #2f6fd0; padding:8px; margin-bottom:9px;")}>
        <div style={s("color:#54fcfc; font-size:11px; margin-bottom:6px;")}>PIPELINE  ·  one instruction advances one stage per clock</div>
        <div style={s("display:flex; gap:6px; align-items:stretch;")}>
          {v.vm.stages.map((sg, i) => (
            <div key={i} className={sg.cls}>
              <div style={s("font-size:9.5px; color:#8fb0e8; letter-spacing:0.06em;")}>{sg.label}</div>
              <div style={s("font-size:15px; font-weight:700; color:#fcfc54;")}>{sg.op}</div>
              <div style={s("font-size:9.5px; color:#9fc0f0;")}>{sg.mnem}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s("display:flex; gap:9px; flex-wrap:wrap; align-items:flex-start;")}>
        <div style={s("border:1px solid #2f6fd0; padding:7px 9px; font-size:13px; min-width:118px;")}>
          <div style={s("color:#54fcfc; border-bottom:1px solid #2746b8; margin-bottom:5px; padding-bottom:3px; font-size:11px;")}>REGISTERS</div>
          <div>A&nbsp; $<span style={s("color:#fcfc54;")}>{v.vm.A}</span></div>
          <div>X&nbsp; $<span style={s("color:#fcfc54;")}>{v.vm.X}</span></div>
          <div>Y&nbsp; $<span style={s("color:#fcfc54;")}>{v.vm.Y}</span></div>
          <div>PC $<span style={s("color:#fcfc54;")}>{v.vm.PC}</span></div>
          <div style={s("margin-top:7px; color:#54fcfc; font-size:11px;")}>FLAGS</div>
          <div style={s("display:flex; gap:8px; font-weight:700;")}>
            {v.vm.flags.map((fl, i) => (<span key={i} style={{ color: fl.col }}>{fl.f}</span>))}
          </div>
        </div>

        <div style={s("border:1px solid #2f6fd0; padding:7px 9px; font-size:12px; min-width:188px;")}>
          <div style={s("color:#54fcfc; border-bottom:1px solid #2746b8; margin-bottom:5px; padding-bottom:3px; font-size:11px;")}>PIPELINE STATS</div>
          <div style={s("display:grid; grid-template-columns:1fr auto; gap:0 10px; color:#9fc0f0;")}>
            <span>cycles</span><span style={s("color:#fcfc54;")}>{v.vm.cycles}</span>
            <span>retired</span><span style={s("color:#fcfc54;")}>{v.vm.retired}</span>
            <span>IPC</span><span style={s("color:#fcfc54;")}>{v.vm.ipc}</span>
            <span>fetch stalls</span><span style={s("color:#fcfc54;")}>{v.vm.fetchStalls}</span>
            <span>INC stalls</span><span style={s("color:#fcfc54;")}>{v.vm.incStalls}</span>
            <span>branch flush</span><span style={s("color:#fcfc54;")}>{v.vm.branchFlushes}</span>
            <span>bubbles</span><span style={s("color:#fcfc54;")}>{v.vm.bubbles}</span>
          </div>
        </div>

        <div style={s("border:1px solid #2f6fd0; padding:7px 9px; font-size:12.5px; flex:1; min-width:190px; align-self:stretch;")}>
          <div style={s("color:#54fcfc; margin-bottom:5px; font-size:11px;")}>SYS OUTPUT</div>
          <pre style={s("margin:0; white-space:pre-wrap; word-break:break-word; color:#fcfc54; min-height:54px; font-size:13px; line-height:1.4;")}>{v.vm.out}</pre>
        </div>
      </div>

      <div style={s("border:1px solid #2f6fd0; padding:7px 9px; margin-top:9px;")}>
        <div style={s("display:flex; align-items:center; gap:8px; margin-bottom:5px;")}>
          <span style={s("color:#54fcfc; font-size:11px;")}>MEMORY  {v.vm.pageLabel}</span>
          <span style={s("flex:1;")}></span>
          <span className="nc-vbtn" onClick={v.vmPageDown}>◀ page</span>
          <span className="nc-vbtn" onClick={v.vmPageUp}>page ▶</span>
        </div>
        <div style={s("font-family:'Space Mono',monospace; font-size:11px; overflow:auto;")}>
          {v.vm.memRows.map((mr, i) => (
            <div key={i} style={s("display:flex; gap:0; white-space:pre;")}>
              <span style={s("color:#6f93d8; padding-right:8px;")}>{mr.addr}</span>
              {mr.cells.map((mc, ci) => (<span key={ci} style={{ display: 'inline-block', width: '19px', textAlign: 'center', background: mc.bg, color: mc.fg }}>{mc.v}</span>))}
            </div>
          ))}
        </div>
      </div>

      <div style={s("display:flex; gap:8px; margin-top:10px; align-items:center; flex-wrap:wrap;")}>
        <span className="nc-vbtn" onClick={v.vmStep}>Step ▷</span>
        <span className="nc-vbtn" onClick={v.vmRun}>{v.vm.runLabel}</span>
        <span className="nc-vbtn" onClick={v.vmReset}>⟲ Reload</span>
        <span style={s("display:flex; align-items:center; gap:5px; color:#8fb0e8; font-size:11px;")}>clock
          <select className="nc-vsel" value={v.vm.speedIdx} onChange={v.vm.onPickSpeed}>
            {v.vm.speeds.map((sp, i) => (<option key={i} value={sp.i}>{sp.label}</option>))}
          </select>
        </span>
        <span className="nc-vbtn" onClick={v.vmEdit}>✎ Edit code</span>
        <span className="nc-vbtn" onClick={v.vmNew}>+ New program</span>
        <span style={s("flex:1;")}></span>
        <span style={s("color:#fcfc54; font-size:11px;")}>{v.vm.haltMsg}</span>
      </div>
      <div style={s("color:#8fb0e8; font-size:11px; margin-top:8px; line-height:1.5;")}>{v.vm.loadMsg}</div>
      <div style={s("color:#6f93d8; font-size:11px; margin-top:4px; line-height:1.5;")}>Faithful port of my <a className="nc-link" href="https://github.com/RPlante28/422-tsiraM/tree/scalar-pipeline" target="_blank" rel="noopener">tsiraM-6502</a> scalar pipeline (fetch→decode→execute→writeback→interrupt, with fetch / INC / branch hazard stalls). Pick a sample, Step through it, or write your own in hex or assembly with <b>+ New program</b>.</div>
    </div>
  );
}

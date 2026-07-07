// =====================================================================
//  Engine.js - the ROHAN-DOS application logic.
//
//  Ported verbatim from the original single-file app's logic class. The only
//  changes vs. the original are the store plumbing at the top (subscribe /
//  setState / forceUpdate / _emit) which replaces the dc-runtime base class;
//  every method below is unchanged behaviour. React drives it via
//  useSyncExternalStore + effects that call componentDidMount / DidUpdate /
//  WillUnmount. It reads window.PORTFOLIO / window.VIZ / window.CPU6502.
// =====================================================================
import React from 'react';

export default class Engine {
  // React-compatible state store: synchronous merge, then notify subscribers.
  setState(partial) { const n = (typeof partial === 'function') ? partial(this.state) : partial; if (n) this.state = Object.assign({}, this.state, n); this._emit(); }
  forceUpdate() { this._emit(); }
  _emit() { this._version++; this._listeners.forEach((l) => l()); }

  constructor(props){
    this.props = props || {};
    // --- external store plumbing (replaces dc-runtime base class) ---
    this._listeners = new Set();
    this._version = 0;
    this.subscribe = (cb) => { this._listeners.add(cb); return () => { this._listeners.delete(cb); }; };
    this.getSnapshot = () => this._version;
    // ---- Portfolio content is defined in content.js (window.PORTFOLIO) ----
    const P = window.PORTFOLIO;
    const D = P.D, T = P.T, A = P.A;
    const ART = P.ART; this.art = ART;
    this.root = P.root;
    this.edu = P.edu;
    // flat list of every skill tag (from the SKILLS folder) for the WHOAMI card
    { const sd=(this.root.children||[]).find(c=>c.name==='SKILLS'); this.homeSkills = sd ? (sd.children||[]).reduce((a,c)=>a.concat((c.doc&&c.doc.tags)||[]),[]) : []; }

    this.helloArt = [
      " +-----------------------------+",
      " |                             |",
      " |   > say hello, world_       |",
      " |     to rohan  :)            |",
      " |                             |",
      " +-----------------------------+",
    ].join("\n");

    this.goRoot = ()=>{ this.setState({ stack:[this.root], sel:0, activeMenu:null, cmdMsg:'', editing:null }); };
    this.cfg = this._loadCfg();
    // user filesystem (nested, persisted)
    this.userRoot = { name:'MY-FILES', kind:'dir', home:true, user:true, size:'\u25b6SUB-DIR\u25c4', date:'06.25.26', children:this._loadFS() };
    this._tagUser(this.userRoot);
    const myIdx=this.root.children.findIndex(c=>c.home);
    if(myIdx>=0) this.root.children[myIdx]=this.userRoot;
    this.homeDir = this.userRoot;
    this.vmPage = 0x00;       // which memory page the VM dump shows
    this.vmProgKey = 'HELLO'; // currently selected sample/user program
    this.vmSpeed = 3;         // index into vmSpeeds() - default 5 Hz (visible)
    this._gameCanvasRefCb = (el)=>this.gameCanvasRef(el);
    this._gameStatusRefCb = (el)=>{ this._gameStatusEl = el; if(el && this._gameStatus) el.textContent=this._gameStatus; };
    this._vizGens = this._mkVizGens();
    this._vizRefCb = (el)=>{ this._vizEl = el; if(el){ if(this._pendingViz){ const t=this._pendingViz; this._pendingViz=null; this._startViz(t); } } else { this._stopViz(); } };
    this.state = { stack:[this.root], sel:0, activeMenu:null, sortKey:null, cmdMsg:'', dialog:null, booting:true, bootText:'', sent:false, cliMode:false, editing:null, edMode:'insert', edModeV:'normal', term:[], mailFlow:null };
    this.bootScript = [
      'ROHAN-DOS BIOS v5.51  (C) MMXXVI Plante Systems',
      '',
      'CPU      : MOS 6502 @ 1.79 MHz ............ [ OK ]',
      'Memory   : Testing 640K .................... 640K OK',
      'Cache    : Internal .......... External ..... [ OK ]',
      'Floppy   : A: 1.44M  3.5" ................... [ OK ]',
      'Hard Disk: C: ROHAN  HDD  type 47 .......... [ OK ]',
      'Mouse    : Serial mouse on COM1 ............ [ OK ]',
      '',
      'Loading COMMAND.COM .................. done',
      'Mounting C:\\ROHAN .................... done',
      '',
      'Starting Portfolio Commander ...',
    ];
    this.bootFull = this.bootScript.join('\n');

    // pull-down menu definitions
    this.menus = [
      { id:'left', label:'Left', items:[
        { label:'Sort by Name', act:()=>this.setState({ sortKey:'name' }) },
        { label:'Sort by Size', act:()=>this.setState({ sortKey:'size' }) },
        { label:'Sort by Date', act:()=>this.setState({ sortKey:'date' }) },
        { label:'Unsorted', act:()=>this.setState({ sortKey:null }) },
      ]},
      { id:'files', label:'Files', items:[
        { label:'Edit file            (F3 / e)', act:()=>this.editSelected() },
        { label:'New file\u2026  (make <name>)', act:()=>{ const f=this.makeFileProvisional('untitled.txt'); this.openEditor(f); } },
        { label:'Open repository / link', act:()=>{ const o=this.curDoc(); if(o&&o.link) window.open(o.link,'_blank'); else this.say('not a linked file'); } },
        { label:'Up one level         (..)', act:()=>{ if(this.state.stack.length>1) this._upDir(); } },
      ]},
      { id:'commands', label:'Commands', items:[
        { label:'cd <dir>     open a folder   ( cd .. up )', cmd:true },
        { label:'ls / tree    list files      ( pwd )', cmd:true },
        { label:'open <file>  read a file      ( cat )', cmd:true },
        { label:'edit <file>  vim editor      ( make = new )', cmd:true },
        { label:'touch / mkdir / rm   manage MY-FILES', cmd:true },
        { label:'find / grep / wc     search files', cmd:true },
        { label:'6502         launch the CPU VM', cmd:true },
        { label:'viz          analytics dashboards', cmd:true },
        { label:'mail · resume · go <github|linkedin>', cmd:true },
        { label:'cli / gui    toggle CLI mode  ( clear )', cmd:true },
        { label:'help · config · about', cmd:true },
      ]},
      { id:'options', label:'Options', items:[
        { label:'Help & shortcuts\u2026   (F1)', act:()=>this.openHelp() },
        { label:'Configuration\u2026', act:()=>this.setState({ dialog:'config', activeMenu:null }) },
        { label:'CLI-only mode        (O)', act:()=>this.toggleCli() },
        { label:'About this site\u2026', act:()=>this.setState({ dialog:'about', activeMenu:null }) },
        { label:'\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', sep:true },
        { label:'GitHub  \u2192 RPlante28', act:()=>window.open('https://github.com/RPlante28','_blank') },
        { label:'LinkedIn \u2192 rohan-plante', act:()=>window.open('https://linkedin.com/in/rohan-plante','_blank') },
        { label:'E-mail  \u2192 rohanplante@gmail.com', act:()=>window.open('mailto:rohanplante@gmail.com') },
      ]},
      { id:'right', label:'Right', items:[
        { label:'Show Info panel', act:()=>this.goRoot() },
        { label:'\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', sep:true },
        { label:'EDUCATION', act:()=>this.openDirByName('EDUCATION') },
        { label:'EXPERIENCE', act:()=>this.openDirByName('EXPERIENCE') },
        { label:'PROJECTS', act:()=>this.openDirByName('PROJECTS') },
        { label:'SKILLS', act:()=>this.openDirByName('SKILLS') },
        { label:'AWARDS', act:()=>this.openDirByName('AWARDS') },
        { label:'PROGRAMS', act:()=>this.openDirByName('PROGRAMS') },
        { label:'HOBBIES', act:()=>this.openDirByName('HOBBIES') },
        { label:'MY-FILES', act:()=>this.openDirByName('MY-FILES') },
        { label:'\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', sep:true },
        { label:'6502 CPU \u2192 launch VM', act:()=>this.openVM() },
      ]},
    ];
    this.toggleMenu=(id)=>this.setState(s=>({ activeMenu: s.activeMenu===id?null:id }));
    this.openMenu=(id)=>this.setState({ activeMenu:id });
    this.closeMenu=()=>{ if(this.state.activeMenu) this.setState({ activeMenu:null }); };
    this.cmdRef=(el)=>{ this._cmd=el; };
  }

  toggleCfg(k){ this.cfg[k]=!this.cfg[k]; this._saveCfg(); this.forceUpdate(); }
  resetCfg(){ this.cfg = this._cfgDefaults(); this._saveCfg(); this.forceUpdate(); }
  // ----- CLI helpers: command-history recall + tab completion -----
  _commandNames(){ return ['cd','ls','dir','tree','open','cat','edit','vim','make','touch','mkdir','rm','rename','cp','find','grep','wc','pwd','history','clear','6502','viz','mail','resume','go','cli','gui','config','about','help','whoami','date','ver']; }
  _completionNames(){
    const set=new Set();
    (this.items()||[]).forEach(it=>{ if(it.name && it.kind!=='updir') set.add(it.name.replace(/\s+/g,'')); });
    this.flatten(this.root).forEach(n=>{ if(n.name) set.add(n.name.replace(/\s+/g,'')); });
    return Array.from(set);
  }
  _commonPrefix(arr){ if(!arr.length) return ''; let p=arr[0]; for(const s of arr){ let i=0; while(i<p.length && i<s.length && p[i].toLowerCase()===s[i].toLowerCase()) i++; p=p.slice(0,i); if(!p) break; } return p; }
  _cliComplete(el){
    const val=el.value||''; const toks=val.split(' '); const last=toks[toks.length-1];
    if(!last){ return; }
    const pool = (toks.length<=1) ? this._commandNames() : this._completionNames();
    const low=last.toLowerCase();
    const matches=pool.filter(x=>x.toLowerCase().startsWith(low));
    if(!matches.length) return;
    let comp;
    if(matches.length===1){ comp=matches[0]; }
    else { comp=this._commonPrefix(matches); if(comp.length<=last.length){ this.print([this._promptStr()+'> '+val, matches.join('   ')]); comp=last; } }
    toks[toks.length-1]=comp; el.value=toks.join(' ');
    this._moveCursor(this._cliCurs, el);
  }
  // ----- persisted configuration (all settings remembered across visits) -----
  _cfgDefaults(){ return { hidden:false, ins:true, autodir:true, automenu:false, mini:true, crt:false, crtIntensity:0.22, keysound:true, soundProfile:'thock', pitch:1.0, click:0.6, bootSound:true, clickProfile:'tick', mousePitch:1.0, mouseClick:0.6 }; }
  _loadCfg(){ const d=this._cfgDefaults(); try{ const r=localStorage.getItem('rohanCfg'); if(r){ const o=JSON.parse(r); if(o&&typeof o==='object') return Object.assign(d, o); } }catch(e){} return d; }
  _saveCfg(){ try{ localStorage.setItem('rohanCfg', JSON.stringify(this.cfg)); }catch(e){} }
  // The second arg `preview` plays the sample sound. It's true on a click or
  // at the end of a drag, and false during a drag (so it doesn't machine-gun).
  setPitch(v, preview=true){ this.cfg.pitch=Math.max(0.6, Math.min(1.6, Math.round(v*20)/20)); this._saveCfg(); this.forceUpdate(); if(preview) this._previewKey(); }
  setClick(v, preview=true){ this.cfg.click=Math.max(0, Math.min(1, Math.round(v*20)/20)); this._saveCfg(); this.forceUpdate(); if(preview) this._previewKey(); }
  setMousePitch(v, preview=true){ this.cfg.mousePitch=Math.max(0.6, Math.min(1.6, Math.round(v*20)/20)); this._saveCfg(); this.forceUpdate(); if(preview) this._previewClick(); }
  setMouseClick(v, preview=true){ this.cfg.mouseClick=Math.max(0, Math.min(1, Math.round(v*20)/20)); this._saveCfg(); this.forceUpdate(); if(preview) this._previewClick(); }
  _previewKey(){ const was=this.cfg.keysound; this.cfg.keysound=true; this.keyClick({key:'a'}); setTimeout(()=>{ this.cfg.keysound=was; }, 120); }
  _previewClick(){ this.clickSound(); }
  // CRT scanline intensity (alpha of the dark lines). Dragging it also turns
  // the CRT effect on, so you can see what you're adjusting.
  setCrtIntensity(v){ this.cfg.crtIntensity=Math.max(0.06, Math.min(0.5, Math.round(v*100)/100)); this.cfg.crt=true; this._saveCfg(); this.forceUpdate(); }
  // Makes a segmented bar behave like a draggable slider. Returns mouse
  // handlers; value is read from the pointer's x position across the bar.
  _mkSlider(setter, min, max){
    const apply=(e, preview)=>{ const bar=e.currentTarget; if(!bar) return; const r=bar.getBoundingClientRect(); if(r.width<=0) return; const frac=Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)); setter(min+frac*(max-min), preview); };
    return {
      down:(e)=>{ this._sliding=true; apply(e, false); },
      move:(e)=>{ if(this._sliding) apply(e, false); },
      up:(e)=>{ if(this._sliding){ this._sliding=false; apply(e, true); } },
    };
  }
  // ----- mechanical keyboard click (WebAudio, zero-latency, per-key variation) -----
  _audio(){ if(this._ac) return this._ac; try{ const AC=window.AudioContext||window.webkitAudioContext; this._ac=new AC(); this._noise=this._mkNoise(this._ac); }catch(e){ this._ac=null; } return this._ac; }
  _mkNoise(ac){ const len=Math.floor(ac.sampleRate*0.08); const buf=ac.createBuffer(1,len,ac.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; return buf; }
  keyClick(ev){
    if(!this.cfg.keysound) return;
    const ac=this._audio(); if(!ac) return;
    if(ac.state==='suspended'){ ac.resume(); }
    const now=ac.currentTime;
    const k=(ev&&ev.key)||'';
    const P=({thock:{b:[92,140],t:'sine',lp:1500,tk:0.5},
              clicky:{b:[170,250],t:'triangle',lp:2600,tk:0.8},
              typewriter:{b:[120,200],t:'square',lp:2200,tk:0.9},
              soft:{b:[78,118],t:'sine',lp:1100,tk:0.3}})[this.cfg.soundProfile||'thock'];
    // per-key variation: spacebar/enter deeper, others lighter
    const pitch=(this.cfg.pitch==null?1:this.cfg.pitch);
    const click=(this.cfg.click==null?0.6:this.cfg.click);
    const big = (k===' '||k==='Enter'||k==='Backspace');
    const base = ((big?P.b[0]:P.b[1]) + (Math.random()*16-8)) * pitch;
    const dur = big?0.07:0.045;
    const vol = (big?0.13:0.09) * (0.9+Math.random()*0.2);
    // soft, low-passed noise tick - the keycap "tap" (brightness + level scale with clickiness)
    const src=ac.createBufferSource(); src.buffer=this._noise;
    const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=(P.lp*(0.55+click*0.9))+Math.random()*300; lp.Q.value=0.4;
    const ng=ac.createGain(); const tick=0.012;
    ng.gain.setValueAtTime(vol*P.tk*(0.35+click*1.5), now); ng.gain.exponentialRampToValueAtTime(0.0004, now+tick);
    src.connect(lp).connect(ng).connect(ac.destination); src.start(now); src.stop(now+tick+0.01);
    // tonal body - quick dampened decay
    const osc=ac.createOscillator(); osc.type=P.t; osc.frequency.setValueAtTime(base, now); osc.frequency.exponentialRampToValueAtTime(base*0.7, now+dur);
    const og=ac.createGain(); og.gain.setValueAtTime(0.0001, now); og.gain.exponentialRampToValueAtTime(vol, now+0.004); og.gain.exponentialRampToValueAtTime(0.0004, now+dur);
    osc.connect(og).connect(ac.destination); osc.start(now); osc.stop(now+dur);
  }
  // crisp mouse-click tick - selectable profile (tick / tap / beep / off), pitch-aware
  clickSound(){
    const prof=this.cfg.clickProfile||'tick';
    if(prof==='off') return;
    const ac=this._audio(); if(!ac) return;
    if(ac.state==='suspended'){ ac.resume(); }
    const now=ac.currentTime;
    const pitch=(this.cfg.mousePitch==null?1:this.cfg.mousePitch);
    const click=(this.cfg.mouseClick==null?0.6:this.cfg.mouseClick);
    if(prof==='beep'){
      const osc=ac.createOscillator(); osc.type='square'; osc.frequency.setValueAtTime(900*pitch, now);
      const og=ac.createGain(); og.gain.setValueAtTime(0.0001, now); og.gain.exponentialRampToValueAtTime(0.04+click*0.05, now+0.004); og.gain.exponentialRampToValueAtTime(0.0004, now+0.05);
      osc.connect(og).connect(ac.destination); osc.start(now); osc.stop(now+0.06);
      return;
    }
    if(prof==='tap'){
      // soft low-passed thunk - gentle, rounded
      const src=ac.createBufferSource(); src.buffer=this._noise;
      const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=600+click*900;
      const ng=ac.createGain(); ng.gain.setValueAtTime(0.04+click*0.07, now); ng.gain.exponentialRampToValueAtTime(0.0004, now+0.03);
      src.connect(lp).connect(ng).connect(ac.destination); src.start(now); src.stop(now+0.04);
      const osc=ac.createOscillator(); osc.type='sine'; osc.frequency.setValueAtTime(300*pitch, now); osc.frequency.exponentialRampToValueAtTime(170*pitch, now+0.04);
      const og=ac.createGain(); og.gain.setValueAtTime(0.07, now); og.gain.exponentialRampToValueAtTime(0.0004, now+0.05);
      osc.connect(og).connect(ac.destination); osc.start(now); osc.stop(now+0.06);
      return;
    }
    // default 'tick' - tight high-passed click
    const src=ac.createBufferSource(); src.buffer=this._noise;
    const hp=ac.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1200+click*1400;
    const ng=ac.createGain(); ng.gain.setValueAtTime(0.04+click*0.08, now); ng.gain.exponentialRampToValueAtTime(0.0004, now+0.018);
    src.connect(hp).connect(ng).connect(ac.destination); src.start(now); src.stop(now+0.03);
    const osc=ac.createOscillator(); osc.type='triangle'; osc.frequency.setValueAtTime(620*pitch, now); osc.frequency.exponentialRampToValueAtTime(360*pitch, now+0.02);
    const og=ac.createGain(); og.gain.setValueAtTime(0.06, now); og.gain.exponentialRampToValueAtTime(0.0004, now+0.025);
    osc.connect(og).connect(ac.destination); osc.start(now); osc.stop(now+0.03);
  }
  setClickProfile(name){ this.cfg.clickProfile=name; this._saveCfg(); this.forceUpdate(); const was=this.cfg.keysound; this.cfg.keysound=true; this.clickSound(); setTimeout(()=>{ this.cfg.keysound=was; },120); }
  // switch the keyboard sound profile and play a quick two-key preview (audible even if sound is muted)
  setSoundProfile(name){
    this.cfg.soundProfile=name; this._saveCfg(); this.forceUpdate();
    const was=this.cfg.keysound; this.cfg.keysound=true;
    this.keyClick({key:'a'}); setTimeout(()=>this.keyClick({key:' '}), 95);
    setTimeout(()=>{ this.cfg.keysound=was; }, 220);
  }
  // power-on / disk spin-up chime for the boot sequence (guarded so it fires once)
  // unlock audio as early as possible so the boot typing clicks can sound
  _bootSound(){ const ac=this._audio(); if(ac && ac.state==='suspended') ac.resume(); }
  // teletype tick - a soft click as each boot character scans onto the screen
  _bootClick(){
    if(!this.cfg.bootSound) return;
    // Only tick if audio is already unlocked by a real user gesture; never
    // create or resume the AudioContext here (doing so before a gesture spams
    // the "AudioContext was not allowed to start" console warning).
    const ac=this._ac; if(!ac || ac.state!=='running') return;
    const now=ac.currentTime;
    const src=ac.createBufferSource(); src.buffer=this._noise;
    const bp=ac.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2100+Math.random()*700; bp.Q.value=1.1;
    const g=ac.createGain(); g.gain.setValueAtTime(0.03+Math.random()*0.015, now); g.gain.exponentialRampToValueAtTime(0.0004, now+0.012);
    src.connect(bp).connect(g).connect(ac.destination); src.start(now); src.stop(now+0.02);
  }
  closeDialog(){ this.setState({ dialog:null }); setTimeout(()=>{ const el=this.state.cliMode?this._cli:this._cmd; if(el) el.focus(); }, 30); }
  cur(){ return this.state.stack[this.state.stack.length-1]; }
  curDoc(){ const its=this.items(); const sel=its[this.state.sel]; return (sel&&sel.doc)?sel.doc:null; }
  say(msg){ if(this.state.cliMode && msg){ this.setState(s=>({ cmdMsg:msg, term:s.term.concat([msg]) })); } else { this.setState({ cmdMsg:msg }); } }

  // ----- user filesystem (nested, localStorage) -----
  _loadFS(){
    try{
      const r=localStorage.getItem('rohanFS');
      if(r){ const o=JSON.parse(r); if(o&&Array.isArray(o.children)) return o.children; }
      const old=localStorage.getItem('rohanUserFiles');
      if(old){ const a=JSON.parse(old); if(Array.isArray(a)) return a.map(f=>({ name:f.name, kind:'file', body:f.body||'', date:f.date||'06.25.26' })); }
    }catch(e){}
    return [];
  }
  _saveFS(){ try{ localStorage.setItem('rohanFS', JSON.stringify({ children:this.userRoot.children })); }catch(e){} }
  _tagUser(node){ (node.children||[]).forEach(c=>{ c.user=true; if(c.kind==='dir'){ c.size='\u25b6SUB-DIR\u25c4'; if(!c.children) c.children=[]; this._tagUser(c); } else { if(c.body===undefined) c.body=''; } }); }
  curUserDir(){ const c=this.cur(); return c.user ? c : this.userRoot; }
  findInDir(dir, name){ const n=name.replace(/\s+/g,'').toLowerCase(); return (dir.children||[]).find(x=>x.name.replace(/\s+/g,'').toLowerCase()===n); }
  findUserFile(name){ const n=name.replace(/\s+/g,'').toLowerCase(); let hit=null; const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.kind==='file' && c.name.replace(/\s+/g,'').toLowerCase().indexOf(n)>=0 && !hit) hit=c; if(c.kind==='dir') walk(c); }); }; walk(this.userRoot); return hit; }
  mkdirIn(name){ const dir=this.curUserDir(); name=(name||'').trim().toUpperCase(); if(!name) return null; if(this.findInDir(dir,name)) return this.findInDir(dir,name); const node={ name, kind:'dir', user:true, size:'\u25b6SUB-DIR\u25c4', date:'06.25.26', children:[] }; dir.children.push(node); this._saveFS(); return node; }
  makeFile(name){ const dir=this.curUserDir(); name=(name||'').trim(); if(!name) return null; if(!/\./.test(name)) name+='.txt'; name=name.toUpperCase(); let f=this.findInDir(dir,name); if(!f){ f={ name, kind:'file', user:true, body:'', date:'06.25.26' }; dir.children.push(f); this._saveFS(); } return f; }
  // create a NEW file that is NOT committed to disk until :w  (so :q on a brand-new file discards it)
  makeFileProvisional(name){ const dir=this.curUserDir(); name=(name||'').trim(); if(!name) return null; if(!/\./.test(name)) name+='.txt'; name=name.toUpperCase(); let f=this.findInDir(dir,name); if(f) return f; f={ name, kind:'file', user:true, body:'', date:'06.25.26', _provisional:true }; dir.children.push(f); return f; }
  deleteUser(name){ const dir=this.curUserDir(); const f=this.findInDir(dir,name); if(!f){ const g=this.findUserFile(name); if(!g) return false; this._removeNode(this.userRoot,g); this._saveFS(); return true; } dir.children=dir.children.filter(x=>x!==f); this._saveFS(); return true; }
  _removeNode(parent, node){ if(!parent.children) return false; const i=parent.children.indexOf(node); if(i>=0){ parent.children.splice(i,1); return true; } return parent.children.some(c=>c.kind==='dir'&&this._removeNode(c,node)); }

  // ----- terminal scrollback -----
  print(lines){ const arr=Array.isArray(lines)?lines:[lines]; this.setState(s=>({ term:s.term.concat(arr) })); }
  echo(cmd){ this.setState(s=>({ term:s.term.concat([ this._promptStr()+'> '+cmd ]) })); }
  _promptStr(){ return this.state.stack.map((n,i)=> i===0 ? n.path : n.name).join('\\'); }
  out(lines){ const a=Array.isArray(lines)?lines:[lines]; if(this.state.cliMode) this.print(a); else this.say(a.join('   ')); }
  // Norton-style block cursor: position a 1ch box over the char at the caret
  _moveCursor(box, input){
    if(!box || !input) return;
    const p = input.selectionStart || 0;
    box.style.left = p + 'ch';
    const ch = input.value.charAt(p);
    box.textContent = ch || '\u00a0';
  }
  cowsay(msg){ msg=msg||'moo'; const top=' '+'_'.repeat(msg.length+2); const bot=' '+'-'.repeat(msg.length+2); return [ top, '< '+msg+' >', bot, '        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||' ]; }

  // ----- CLI-only mode -----
  toggleCli(){ const on=!this.state.cliMode; this.setState({ cliMode:on, activeMenu:null, mailFlow:null }); setTimeout(()=>{ const el=on?this._cli:this._cmd; if(el) el.focus(); }, 30); }

  // ----- sudo (interactive password prompt) -----
  sudoInput(v){
    if(!this.state.sudoFlow) return;
    this.setState({ sudoFlow:null });
    this.print([
      '[sudo] password for guest: ',
      'Sorry, try again.',
      'sudo: 1 incorrect password attempt',
      'guest is not in the sudoers file.  This incident will be reported.',
      ''
    ]);
    setTimeout(()=>{ if(this._cli) this._cli.focus(); }, 20);
  }

  // ----- in-terminal mail composer (strict CLI mode) -----
  _mailOrder(){ return ['name','email','subject','message']; }
  mailPrompt(step){ return ({ name:'name', email:'email', subject:'subject', message:'message' })[step] || ''; }
  startMailFlow(){
    this.setState({ mailFlow:{ step:'name', data:{} } });
    this.print(['sendmail - interactive composer. answer each line; type  cancel  to abort.','']);
  }
  mailInput(v){
    const mf=this.state.mailFlow; if(!mf) return;
    if(v.trim().toLowerCase()==='cancel'){ this.setState({ mailFlow:null }); this.print(['^C  mail aborted.','']); return; }
    const data={...mf.data}; data[mf.step]=v;
    const order=this._mailOrder(); const idx=order.indexOf(mf.step);
    if(idx < order.length-1){ this.setState({ mailFlow:{ step:order[idx+1], data } }); return; }
    this.setState({ mailFlow:null });
    const W=46, bar='+'+'-'.repeat(W)+'+';
    const row=(s)=>'| '+(s||'').slice(0,W-2).padEnd(W-2)+' |';
    this.print([
      '', bar,
      row('  SENDING - sendmail'),
      bar,
      row(' to     : rohanplante@gmail.com'),
      row(' from   : '+(data.name||'?')+'  <'+(data.email||'?')+'>'),
      row(' subject: '+(data.subject||'(none)')),
      row(' '),
    ].concat((data.message||'').split('\n').map(l=>row(' '+l))).concat([
      bar, ''
    ]));
    this._postMail(data).then(res=>{
      this.print([ res&&res.ok ? '  ✓ delivered - Rohan will write back soon.'
        : '  ✗ could not send - e-mail rohanplante@gmail.com directly.', '']);
    });
  }

  // ----- editor -----
  bufferFor(node){
    if(!node) return { name:'[no name]', body:'', editable:true, ro:false };
    if(node.user && node.kind==='file'){
      return { name:node.name, body:(node.body||''), editable:true, ro:false, ref:node };
    }
    if(node.doc && (node.doc.kind==='text'||node.doc.kind==='art')){
      return { name:node.name, body:node.doc.body, editable:false, ro:true };
    }
    if(node.doc && node.doc.kind==='info' && node.doc.body){
      return { name:node.name, body:node.doc.body, editable:false, ro:true };
    }
    if(node.doc){
      const o=node.doc; const lines=[];
      if(o.title) lines.push(o.title); if(o.meta) lines.push(o.meta); if(o.sub) lines.push('', o.sub);
      (o.bullets||[]).forEach(b=>lines.push('  - '+b));
      if(o.link) lines.push('', o.link);
      // [[n]] redaction markup -> solid blocks, so `cat` matches the GUI's bars
      const body=(lines.join('\n')||'(read-only program file)').replace(/\[\[([^\]]*)\]\]/g,(m,x)=>'█'.repeat(Math.max(2,/^\d+$/.test(x)?parseInt(x,10):x.length)));
      return { name:node.name, body, editable:false, ro:true };
    }
    return { name:node.name, body:'', editable:false, ro:true };
  }
  openEditor(node){
    const buf=this.bufferFor(node);
    this.setState({ editing:buf, edMode:'insert', edModeV:'normal', edStatus:'', dialog:null, activeMenu:null });
    setTimeout(()=>{ if(this._ed){ this._ed.value=buf.body; this._ed.focus(); } this._syncEdCursor(); }, 40);
  }
  editSelected(){ const its=this.items(); const sel=its[this.state.sel]; if(sel && sel.kind!=='dir' && sel.kind!=='updir') this.openEditor(sel); else this.say('select a file to edit'); }
  closeEditor(){
    const ed=this.state.editing;
    if(ed && ed.ref && ed.ref._provisional){ this._removeNode(this.userRoot, ed.ref); }
    const its=this.items();
    this.setState(s=>({ editing:null, edMode:'insert', edModeV:'normal', sel:Math.min(s.sel, Math.max(0, its.length-1)) }));
  }
  saveEditor(){
    const ed=this.state.editing; if(!ed) return false;
    if(ed.ro){ this.setState({ edStatus:"E45: '"+ed.name+"' is read-only  (Rohan's files can't be saved)" }); return false; }
    const body=this._ed?this._ed.value:ed.body;
    const node=ed.ref;
    if(node){ node.body=body; if(node._provisional) delete node._provisional; this._saveFS(); }
    const bytes=body.length;
    this.setState(s=>({ editing:{...s.editing, body, ref:node}, edStatus:'"'+ed.name+'" '+bytes+'B written' }));
    return true;
  }
  edToNormal(){ this.setState({ edModeV:'normal' }); setTimeout(()=>{ if(this._ed) this._ed.focus(); this._syncEdCursor(); }, 10); }
  edToCommand(){ this.setState({ edModeV:'command' }); setTimeout(()=>{ if(this._edcmd) this._edcmd.focus(); this._syncEdCursor(); }, 10); }
  // line:col cursor readout for the vim status bar
  _edCaret(){ const ta=this._ed; if(!ta) return; const pos=ta.selectionStart||0; const before=ta.value.slice(0,pos); const line=before.split('\n').length; const col=pos-before.lastIndexOf('\n'); this.setState({ edCursor: line+':'+col }); this._moveEdCursor(); }
  _syncEdCursor(){ requestAnimationFrame(()=>this._moveEdCursor()); }
  // draw the Norton/vim block cursor over the character at the caret (NORMAL & COMMAND modes only)
  _moveEdCursor(){
    const box=this._edcurs, ta=this._ed; if(!box||!ta) return;
    const mode=this.state.edModeV||'insert';
    if(!this.state.editing || mode==='insert'){ box.style.display='none'; return; }
    const pos=ta.selectionStart||0;
    const before=ta.value.slice(0,pos);
    const row=before.split('\n').length-1;
    const col=pos-(before.lastIndexOf('\n')+1);
    const cs=getComputedStyle(ta);
    const fs=parseFloat(cs.fontSize)||13.5;
    const lh=parseFloat(cs.lineHeight)||(fs*1.5);
    const padL=parseFloat(cs.paddingLeft)||0, padT=parseFloat(cs.paddingTop)||0;
    const chW=fs*0.6;                                  // Space Mono advance width
    const op=ta.offsetParent; if(!op) return;
    const tr=ta.getBoundingClientRect(), pr=op.getBoundingClientRect();
    box.style.width=chW+'px'; box.style.height=lh+'px';
    box.style.left=((tr.left-pr.left)+padL+col*chW-ta.scrollLeft)+'px';
    box.style.top=((tr.top-pr.top)+padT+row*lh-ta.scrollTop)+'px';
    box.style.display='block';
  }
  // ----- vim-style e-mail composer (uses the editor; sends with :send / :w) -----
  composeMail(){
    const tmpl = [
      'To:      rohanplante@gmail.com',
      'From:    your name <your@email>',
      'Subject: ',
      '',
      '----------------------------------------------',
      '',
      'Write your message here.',
      '',
      '-- ',
      'sent from ROHAN-DOS'
    ].join('\n');
    const buf={ name:'COMPOSE.EML', body:tmpl, editable:true, ro:false, mail:true };
    this.setState({ editing:buf, edMode:'normal', edModeV:'normal', edCursor:'1:1', edStatus:'-- mail draft --  press  i  to write, Esc for NORMAL, then  :send', dialog:null, activeMenu:null });
    setTimeout(()=>{ if(this._ed){ this._ed.value=buf.body; this._ed.setSelectionRange(0,0); this._ed.focus(); this._edCaret(); } }, 40);
  }
  // ----- real mail delivery -------------------------------------------
  // POSTs a message to the PHP backend (contact.php). The 'website' field is
  // a honeypot and must stay empty. Returns a promise resolving to {ok:bool}.
  _postMail(d){
    const fd=new FormData();
    fd.append('name',    d.name||'');
    fd.append('email',   d.email||'');
    fd.append('subject', d.subject||'');
    fd.append('message', d.message||'');
    fd.append('website', '');   // honeypot - leave blank
    return fetch('contact.php', { method:'POST', body:fd })
      .then(r=>r.json().catch(()=>({ ok:r.ok })))
      .catch(()=>({ ok:false, error:'network' }));
  }
  _sendMailBuffer(){
    const ta=this._ed; const text=ta?ta.value:(this.state.editing&&this.state.editing.body)||'';
    const get=(label)=>{ const m=text.match(new RegExp('^'+label+':\\s*(.*)$','im')); return m?m[1].trim():''; };
    const from=get('From'), subject=get('Subject');
    const sepIdx=text.indexOf('----');
    const body=(sepIdx>=0 ? text.slice(text.indexOf('\n',sepIdx)+1) : text).trim();
    // split "Name <email>" into pieces for the backend
    const fm=from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    const name =fm?fm[1]:(from.indexOf('@')>=0?'':from);
    const email=fm?fm[2]:(from.indexOf('@')>=0?from:'');
    this.setState({ editing:null, edModeV:'normal', dialog:'mailsent', mailSent:{ from:from||'(anonymous)', subject:subject||'(no subject)', bytes:body.length } });
    if(this.state.cliMode){
      const W=46, bar='+'+'-'.repeat(W)+'+', row=(s)=>'| '+(s||'').slice(0,W-2).padEnd(W-2)+' |';
      this.print(['', bar, row('  SENDING - sendmail'), bar,
        row(' to     : rohanplante@gmail.com'),
        row(' from   : '+(from||'(anonymous)')),
        row(' subject: '+(subject||'(no subject)')),
        row(' size   : '+body.length+' bytes'),
        bar, '']);
    }
    this._postMail({ name, email, subject, message:body }).then(res=>{
      const ok=res&&res.ok;
      if(this.state.cliMode) this.print([ ok ? '  ✓ delivered - Rohan will write back soon.'
        : '  ✗ could not send - e-mail rohanplante@gmail.com directly.', '']);
      if(this.state.dialog==='mailsent') this.setState({ mailSent:Object.assign({}, this.state.mailSent, { ok, done:true }) });
    });
  }
  edToInsert(after){
    if(this.state.editing && this.state.editing.ro){ this.setState({ edStatus:"E21: '"+this.state.editing.name+"' is read-only (press :q to leave)" }); return; }
    this.setState({ edModeV:'insert' });
    const ta=this._ed; if(!ta) return;
    setTimeout(()=>{ ta.focus(); if(typeof after==='number'){ ta.setSelectionRange(after,after); } this._syncEdCursor(); }, 10);
  }
  vimKey(e){
    const mode=this.state.edModeV||'insert';
    const ta=this._ed; if(!ta) return;
    if(mode==='insert'){
      if(e.key==='Escape'){ e.preventDefault(); this.edToNormal(); }
      return;
    }
    const v=ta.value; const p=ta.selectionStart;
    const lineStart=v.lastIndexOf('\n',p-1)+1;
    const lineEnd=(v.indexOf('\n',p)===-1?v.length:v.indexOf('\n',p));
    const k=e.key;
    const setSel=(n)=>{ const c=Math.max(0,Math.min(v.length,n)); ta.setSelectionRange(c,c); };
    if(k===':'){ e.preventDefault(); this.edToCommand(); return; }
    if(k==='i'){ e.preventDefault(); this.edToInsert(p); return; }
    if(k==='a'){ e.preventDefault(); this.edToInsert(Math.min(p+1,lineEnd)); return; }
    if(k==='A'){ e.preventDefault(); this.edToInsert(lineEnd); return; }
    if(k==='I'){ e.preventDefault(); this.edToInsert(lineStart); return; }
    if(k==='o'){ e.preventDefault(); if(this.state.editing.ro){ this.edToInsert(); return; } ta.value=v.slice(0,lineEnd)+'\n'+v.slice(lineEnd); this.edToInsert(lineEnd+1); return; }
    if(k==='O'){ e.preventDefault(); if(this.state.editing.ro){ this.edToInsert(); return; } ta.value=v.slice(0,lineStart)+'\n'+v.slice(lineStart); this.edToInsert(lineStart); return; }
    if(k==='h'){ e.preventDefault(); setSel(Math.max(lineStart,p-1)); return; }
    if(k==='l'){ e.preventDefault(); setSel(Math.min(lineEnd,p+1)); return; }
    if(k==='0'){ e.preventDefault(); setSel(lineStart); return; }
    if(k==='$'){ e.preventDefault(); setSel(lineEnd); return; }
    if(k==='j'||k==='k'){ e.preventDefault(); const col=p-lineStart;
      if(k==='j'){ if(lineEnd<v.length){ const ns=lineEnd+1; const ne=(v.indexOf('\n',ns)===-1?v.length:v.indexOf('\n',ns)); setSel(Math.min(ns+col,ne)); } }
      else { if(lineStart>0){ const ps=v.lastIndexOf('\n',lineStart-2)+1; setSel(Math.min(ps+col,lineStart-1)); } }
      return; }
    if(k==='x'){ e.preventDefault(); if(this.state.editing.ro) return; if(p<v.length && v[p]!=='\n'){ ta.value=v.slice(0,p)+v.slice(p+1); setSel(p); this._dirtyVim(); } return; }
    if(k==='G'){ e.preventDefault(); setSel(v.length); return; }
    if(k==='g'){ e.preventDefault(); if(this._gg){ setSel(0); this._gg=false; } else { this._gg=true; setTimeout(()=>{ this._gg=false; },450); } return; }
    if(k==='d'){ e.preventDefault(); if(this.state.editing.ro) return; if(this._dd){ const le=(v.indexOf('\n',p)===-1?v.length:v.indexOf('\n',p)+1); ta.value=v.slice(0,lineStart)+v.slice(le); setSel(lineStart); this._dirtyVim(); this._dd=false; } else { this._dd=true; setTimeout(()=>{ this._dd=false; },450); } return; }
    if(k.length===1){ e.preventDefault(); }
  }
  _dirtyVim(){ this.setState({ edStatus:'[+] modified - :w to save' }); }
  edCommand(raw){
    const c=(raw||'').trim().replace(/^:/,'');
    const edm=this.state.editing;
    if(edm && edm.mail){
      if(c==='send'||c==='w'||c==='wq'||c==='x'){ this._sendMailBuffer(); return; }
      if(c==='q'||c==='q!'){ this.closeEditor(); return; }
      if(c==='help'){ this.setState({ edStatus:'i write  Esc normal  :send send  :q discard' }); this.edToNormal(); return; }
    }
    if(c==='w'){ this.saveEditor(); this.edToNormal(); }
    else if(c==='q'){ this.closeEditor(); }
    else if(c==='wq'||c==='x'){ if(this.saveEditor()!==false) this.closeEditor(); }
    else if(c==='q!'){ this.closeEditor(); }
    else if(c==='help'){ this.setState({ edStatus:':w save  :q quit  :wq save+quit  i insert  Esc/Tab normal' }); this.edToNormal(); }
    else { this.setState({ edStatus:'E492: not an editor command: '+c }); this.edToNormal(); }
  }

  flatten(node, acc){ acc=acc||[]; (node.children||[]).forEach(c=>{ acc.push(c); if(c.children) this.flatten(c, acc); }); return acc; }
  // return the stack [root, ...dirs] ending at target's PARENT dir, or null
  _stackTo(target){
    let result=null;
    const dfs=(node, chain)=>{
      (node.children||[]).forEach(c=>{
        if(result) return;
        if(c===target){ result=chain.slice(); return; }
        if(c.kind==='dir' && c.children){ dfs(c, chain.concat([c])); }
      });
    };
    dfs(this.root, [this.root]);
    return result;
  }
  // navigate the panel to a node anywhere in the tree and highlight it
  revealNode(node){
    const path=this._stackTo(node);
    if(!path) return false;
    const parent=path[path.length-1];
    const idx=(parent.children||[]).indexOf(node) + (path.length>1?1:0);
    this.setState({ stack:path, sel:idx, activeMenu:null, editing:null, cmdMsg:'' });
    return true;
  }

  openDirByName(name){
    const target=(this.root.children||[]).find(c=>c.kind==='dir' && c.name.toUpperCase()===name.toUpperCase());
    if(target){ this.setState({ stack:[this.root, target], sel:(target.children&&target.children.length)?1:0, activeMenu:null, cmdMsg:'' }); return true; }
    // fall back to a deep search so  cd web-dev  works from anywhere
    const all=this.flatten(this.root);
    const deep=all.find(c=>c.kind==='dir' && c.name.toUpperCase()===name.toUpperCase());
    if(deep){ const path=this._stackTo(deep); if(path){ this.setState({ stack:path.concat([deep]), sel:(deep.children&&deep.children.length)?1:0, activeMenu:null, editing:null, cmdMsg:'' }); return true; } }
    return false;
  }
  selectInCurrent(name){
    const its=this.items();
    const idx=its.findIndex(x=>x.name.replace(/\s+/g,'').toUpperCase().startsWith(name.replace(/\s+/g,'').toUpperCase()));
    if(idx>=0){ this.activate(idx); return its[idx]; }
    return null;
  }

  runMenuItem(it){
    if(it.sep) return;
    this.setState({ activeMenu:null });
    if(it.cmd){ if(this._cmd){ this._cmd.focus(); } this.say('type the command below, then press Enter'); return; }
    if(it.act) it.act();
  }

  runCommand(raw){
    const line=(raw||'').trim();
    if(!line){ return; }
    if(line && line[0]!=='!'){ if(!this._cmdHistory) this._cmdHistory=[]; this._cmdHistory.push(line); if(this._cmdHistory.length>50) this._cmdHistory.shift(); }
    if(this.state.cliMode) this.echo(line);
    const parts=line.split(/\s+/);
    const cmd=parts[0].toLowerCase();
    const arg=parts.slice(1).join(' ');
    const argU=arg.toUpperCase();
    if(cmd==='clear'){ this.setState({ term:[], cmdMsg:'' }); return; }
    if(cmd==='cli' || cmd==='term'){ if(!this.state.cliMode) this.toggleCli(); this.print(['CLI-only mode. type  gui  or  exit  to return.']); return; }
    if(cmd==='gui' || cmd==='exit' || cmd==='q'){ if(this.state.cliMode) this.toggleCli(); this.say(''); return; }
    if(cmd==='edit' || cmd==='vi' || cmd==='vim' || cmd==='nano'){
      if(!arg){ this.editSelected(); return; }
      let f=this.findInDir(this.curUserDir(),arg) || this.findUserFile(arg);
      if(f && f.kind==='file'){ this.openEditor(f); return; }
      const all=this.flatten(this.root);
      const hit=all.find(x=>x.kind==='file' && x.name.replace(/\s+/g,'').toUpperCase().includes(argU.replace(/\s+/g,'')));
      if(hit){ this.openEditor(hit); return; }
      f=this.makeFileProvisional(arg); this.openEditor(f); return;
    }
    if(cmd==='make' || cmd==='new'){
      if(!arg){ this.say('usage: make <filename>'); return; }
      const f=this.makeFileProvisional(arg); this.openEditor(f);
      this.print(['new buffer '+f.name+' - :w to save, :q to discard']); return;
    }
    if(cmd==='touch'){
      if(!arg){ this.say('usage: touch <filename>'); return; }
      const f=this.makeFile(arg); this.forceUpdate(); this.out(['touched '+f.name+'  (in '+this.curUserDir().name+')']); return;
    }
    if(cmd==='mkdir' || cmd==='md'){
      if(!arg){ this.say('usage: mkdir <name>'); return; }
      const d=this.mkdirIn(arg); this.forceUpdate(); this.out(d?['created folder '+d.name+'  (in '+this.curUserDir().name+')']:['mkdir failed']); return;
    }
    if(cmd==='cat' || cmd==='more' || cmd==='type'){
      if(!arg){ this.say('usage: cat <file> [file2 \u2026]   - also  cat * ,  cat *.txt ,  cat projects/*'); return; }
      const norm=s=>s.replace(/\s+/g,'').toUpperCase();
      // build {node,parent} list of every readable file
      const files=[]; const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.kind==='file') files.push({node:c, parent:d.name}); if(c.kind==='dir') walk(c); }); }; walk(this.root);
      const toks=arg.split(/\s+/).filter(Boolean);
      let matched=[];
      toks.forEach(tok=>{
        let scope=null, pat=tok;
        if(tok.indexOf('/')>=0){ const p=tok.split('/'); pat=p.pop(); scope=norm(p.join('')); }
        if(pat.indexOf('*')>=0 || pat.indexOf('?')>=0){
          const rx=new RegExp('^'+norm(pat).replace(/[.]/g,'\\.').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');
          if(scope){
            files.forEach(f=>{ if(rx.test(norm(f.node.name)) && (norm(f.parent)===scope || norm(f.parent).includes(scope))) matched.push(f.node); });
          } else {
            // a bare glob ( cat * , cat *.txt ) means "everything in the CURRENT folder"
            (this.cur().children||[]).forEach(c=>{ if(c.kind==='file' && rx.test(norm(c.name))) matched.push(c); });
          }
        } else {
          const direct=this.findInDir(this.curUserDir(),tok)||this.findUserFile(tok);
          const f=(direct&&direct.kind==='file')?direct:(files.find(x=>norm(x.node.name)===norm(pat))||files.find(x=>norm(x.node.name).includes(norm(pat))));
          if(f) matched.push(f.node?f.node:f);
        }
      });
      matched=matched.filter((f,i)=>f&&matched.indexOf(f)===i);
      if(!matched.length){ this.say('cat: no such file: '+arg); return; }
      if(this.state.cliMode){
        const multi=matched.length>1, lines=[];
        matched.forEach((f,i)=>{ const b=this.bufferFor(f); if(multi){ if(i) lines.push(''); lines.push('==> '+f.name.replace(/\s+/g,'')+' <=='); } b.body.split('\n').forEach(l=>lines.push(l)); });
        this.print(lines);
      } else {
        if(matched.length===1){ this.revealNode(matched[0]); }
        else { this.say('cat matched '+matched.length+' files - press 7 for CLI, then  cat '+arg+'  to read them all'); }
      }
      return;
    }
    if(cmd==='rm' || cmd==='del' || cmd==='rmdir'){
      if(!arg){ this.say('usage: rm <name>  or  rm *  to delete all in current folder'); return; }
      if(arg==='*' || arg==='*.*'){
        const dir=this.curUserDir(); const all=(dir.children||[]).filter(c=>c.user);
        all.forEach(c=>{ dir.children=dir.children.filter(x=>x!==c); }); this._saveFS(); this.forceUpdate();
        this.out(['removed '+all.length+' item(s) from '+dir.name]); return;
      }
      if(this.deleteUser(arg)){ this.forceUpdate(); this.out(['removed '+arg]); } else this.say("rm: cannot remove '"+arg+"': only your MY-FILES items can be deleted"); return;
    }
    if(cmd==='rename' || cmd==='mv'){
      if(!arg){ this.say('usage: rename <old> <new>'); return; }
      const parts=arg.split(/\s+/); if(parts.length<2){ this.say('usage: rename <old> <new>'); return; }
      const f=this.findInDir(this.curUserDir(),parts[0])||this.findUserFile(parts[0]);
      if(!f||!f.user){ this.say('rename: not found or read-only: '+parts[0]); return; }
      f.name=parts[1].toUpperCase(); this._saveFS(); this.forceUpdate(); this.out(['renamed to '+f.name]); return;
    }
    if(cmd==='cp' || cmd==='copy'){
      if(!arg){ this.say('usage: cp <src> <dest>'); return; }
      const parts=arg.split(/\s+/); if(parts.length<2){ this.say('usage: cp <src> <dest>'); return; }
      const src=this.findInDir(this.curUserDir(),parts[0])||this.findUserFile(parts[0]);
      if(!src||src.kind!=='file'){ this.say('cp: source not found: '+parts[0]); return; }
      const f=this.makeFile(parts[1]); f.body=src.body||''; this._saveFS(); this.forceUpdate(); this.out(['copied '+src.name+' \u2192 '+f.name]); return;
    }
    if(cmd==='find'){
      if(!arg){ this.say('usage: find <term>'); return; }
      const results=[]; const n=arg.toLowerCase();
      const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.name.replace(/\s+/g,'').toLowerCase().includes(n)) results.push(c.name); if(c.kind==='dir') walk(c); }); };
      walk(this.root); this.out(results.length?results:['(no results for '+arg+')']); return;
    }
    if(cmd==='grep'){
      if(!arg){ this.say('usage: grep <term> [file]'); return; }
      const parts=arg.split(/\s+/); const term=parts[0].toLowerCase();
      const results=[]; const search=(node)=>{ const body=node.body||(node.doc&&node.doc.body)||''; body.split('\n').forEach((l,i)=>{ if(l.toLowerCase().includes(term)) results.push(node.name+':'+(i+1)+': '+l.trim()); }); };
      if(parts[1]){ const f=this.findUserFile(parts[1])||this.findInDir(this.curUserDir(),parts[1]); if(f) search(f); }
      else { const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.kind==='file') search(c); if(c.kind==='dir') walk(c); }); }; walk(this.userRoot); }
      this.out(results.length?results:['(no matches)']); return;
    }
    if(cmd==='wc'){
      if(!arg){ this.say('usage: wc <file>'); return; }
      const f=this.findUserFile(arg)||this.findInDir(this.curUserDir(),arg);
      if(!f||f.kind!=='file'){ this.say('wc: not found: '+arg); return; }
      const b=f.body||''; const lines=b.split('\n').length; const words=b.trim().split(/\s+/).filter(Boolean).length; const chars=b.length;
      this.out([arg+':  '+lines+' lines  '+words+' words  '+chars+' chars']); return;
    }
    if(cmd==='history'){ const h=this._cmdHistory||[]; this.out(h.length?h.map((c,i)=>('  '+(i+1)+'  '+c)):['(no history)']); return; }
    if(cmd==='help' || cmd==='?'){ if(this.state.cliMode){ this.print(this._helpLines()); } else { this.openMenu('commands'); this.say('commands listed above \u2191'); } return; }
    if(cmd==='home' || cmd==='cls' || cmd==='cd\\' || (cmd==='cd' && (arg==='\\'||arg==='/'))){ this.goRoot(); this.say(''); return; }
    if(cmd==='cd'){
      if(arg==='..'){ if(this.state.stack.length>1){ this._upDir(); this.say(''); } else this.say('already at C:\\ROHAN'); return; }
      if(this.openDirByName(arg)){ this.say(''); return; }
      // maybe a dir in current listing
      const sel=this.selectInCurrent(arg);
      if(sel && sel.kind==='dir'){ this.say(''); return; }
      this.say('directory not found: '+arg); return;
    }
    if(cmd==='open' || cmd==='view' || cmd==='type' || cmd==='read'){
      // a glob ( open * , open *.txt ) reads everything in the current folder
      if(arg && (arg.indexOf('*')>=0 || arg.indexOf('?')>=0)){ this.runCommand('cat '+arg); return; }
      // search whole tree for a file
      const all=this.flatten(this.root);
      const hit=all.find(x=>x.kind==='file' && x.name.replace(/\s+/g,'').toUpperCase().includes(argU.replace(/\s+/g,'')));
      if(hit){ this.revealNode(hit); return; }
      this.say('file not found: '+arg); return;
    }
    if(cmd==='go' || cmd==='start'){
      const map={ github:'https://github.com/RPlante28', linkedin:'https://linkedin.com/in/rohan-plante', marist:'https://www.marist.edu', alltrails:'https://www.alltrails.com' };
      if(map[arg.toLowerCase()]){ window.open(map[arg.toLowerCase()],'_blank'); this.say('opening '+arg+' \u2026'); return; }
      const o=this.curDoc();
      if(o&&o.link){ window.open(o.link,'_blank'); this.say('opening link \u2026'); return; }
      this.say('nothing to open. try: go github'); return;
    }
    if(cmd==='resume' || cmd==='cv'){ this.openResume(); this.say('opening resume.pdf \u2026'); return; }
    if(cmd==='mail' || cmd==='email' || cmd==='contact' || cmd==='sendmail' || cmd==='compose'){ this.composeMail(); this.say(''); return; }
    if(cmd==='config' || cmd==='setup' || cmd==='options'){ this.setState({ dialog:'config', activeMenu:null }); this.say(''); return; }
    if(cmd==='about'){ this.setState({ dialog:'about', activeMenu:null }); this.say(''); return; }
    if(cmd==='ls' || cmd==='dir'){
      const its=this.items().filter(x=>x.kind!=='updir');
      if(this.state.cliMode) this.print(its.map(x=>(x.kind==='dir'?'<DIR>  ':'       ')+x.name)); else this.say(its.map(x=>x.name).join('   '));
      return;
    }
    if(cmd==='tree'){
      const base=this.cur();
      const lines=[base===this.root ? 'C:\\ROHAN' : (base.name)];
      const walk=(node, prefix)=>{
        const kids=(node.children||[]).filter(()=>true);
        kids.forEach((c,i)=>{
          const last=(i===kids.length-1);
          lines.push(prefix+(last?'\\-- ':'+-- ')+c.name);
          if(c.kind==='dir' && c.children){ walk(c, prefix+(last?'    ':'|   ')); }
        });
      };
      walk(base, '');
      if(this.state.cliMode) this.print(lines); else { this.say(lines.slice(1).map(l=>l.replace(/[+\\| -]+/g,'').trim()).filter(Boolean).join('  ')); }
      return;
    }
    if(cmd==='whoami'){ if(this.state.cliMode) this.print(['Rohan Plante - CS @ Marist University']); else { this.goRoot(); this.say('Rohan Plante - CS @ Marist'); } return; }
    if(cmd==='echo'){ this.out([arg]); return; }
    // ----- easter eggs -----
    if(cmd==='sudo'){
      if(!this.state.cliMode){ this.say('sudo needs a real terminal - press 7 (CLI), then try  sudo  again.'); return; }
      this.setState({ sudoFlow:{ cmd:arg||'' } });
      setTimeout(()=>{ if(this._cli){ this._cli.value=''; this._cli.focus(); } }, 20);
      return;
    }
    if(cmd==='xyzzy'){ this.out(['Nothing happens.']); return; }
    if(cmd==='boss' || cmd==='b0ss'){ this.setState({ bossMode:true, activeMenu:null, dialog:null }); return; }
    if(cmd==='cowsay'){ this.out(this.cowsay(arg||'hire Rohan')); return; }
    if(cmd==='fortune'){ this.out(this.art.fortune.split('\n')); return; }
    if(cmd==='coffee' || cmd==='brew'){ this.out(this.art.coffee.split('\n')); return; }
    if(cmd==='sound' || cmd==='keysound'){ const on = arg ? /^(on|1|yes|true)$/i.test(arg) : !this.cfg.keysound; this.cfg.keysound=on; this.forceUpdate(); this.say('keyboard sound '+(on?'ON':'OFF')); return; }
    if(cmd==='matrix'){ const cols='01@#%&$ABCDEF'.split(''); const rows=[]; for(let i=0;i<10;i++){ let s=''; for(let j=0;j<48;j++) s+=cols[(Math.random()*cols.length)|0]; rows.push(s); } this.out(['wake up, Neo...'].concat(rows)); return; }
    if(cmd==='date' || cmd==='time'){ this.out([new Date().toString()]); return; }
    if(cmd==='ver' || cmd==='version'){ this.out(['ROHAN-DOS 5.51 - Portfolio Commander - (c) MMXXVI']); return; }
    if(cmd==='hire' || cmd==='hireme' || (cmd==='hire'&&arg==='me')){ this.out(['> Rohan is open to internships & new-grad SWE roles.', '  resume: F4   \u00b7   mail: type  mail    \u00b7   github: go github']); return; }
    if(cmd==='rohan' || cmd==='me'){ this.out(['Rohan Plante - CS @ Marist, Eagle Scout, hackathon winner.', 'type  whoami , or  cat readme.txt']); return; }
    if(cmd==='exit' && this.state.editing){ this.out(['use  :q  inside the editor.']); return; }
    if(cmd==='vim' && !arg){ this.out(['vim: opening scratch buffer\u2026 (i to insert, :q to quit)']); this.editSelected(); return; }
    if(cmd==='6502' || cmd==='cpu' || cmd==='mon'){ if(this.state.cliMode){ this.cliVm(arg); } else { this.openVM(); } return; }
    if(cmd==='viz' || cmd==='dataviz' || cmd==='dashboards' || cmd==='tableau'){ if(this.state.cliMode){ this.openDataViz(); this.say('opened DATA-ANL.LOG - use the dashboard buttons'); } else { this.openDataViz(); this.say(''); } return; }
    if(cmd==='games' || cmd==='play' || cmd==='snake' || cmd==='pacman' || cmd==='tictactoe' || cmd==='ttt' || cmd==='combinatris' || cmd==='comb' || cmd==='doom'){
      if(cmd==='doom'){ const pr=(this.root.children||[]).find(c=>c.name==='PROGRAMS'); const d=pr&&pr.children.find(c=>c.name.indexOf('DOOM')>=0); if(d){ this.setState({ stack:[this.root, pr], sel:pr.children.indexOf(d)+1, activeMenu:null, editing:null, cliMode:false }); return; } }
      this.say('arcade games were retired - this machine ships work only. try  cd programs  for the 6502 VM.'); return;
    }
    if(this.state.cliMode && (cmd==='step' || cmd==='speed' || cmd==='reg' || cmd==='regs' || cmd==='mem')){ this.cliVm(cmd+' '+arg); return; }
    if(cmd==='run' || cmd==='asm' || cmd==='load' || cmd==='go'){
      this.ensureVM();
      if(this.state.cliMode){ this.cliVm('run '+arg); return; }
      if(arg){
        const node=this.findUserFile(arg) || this.findInDir(this.curUserDir(),arg);
        if(node && node.kind==='file'){ this.vmSetProgram('user:'+node.name); this.openVM(); this.out(['loaded '+node.name+' into the 6502']); return; }
        // try a sample by name
        const S=window.CPU6502?window.CPU6502.SAMPLES:{}; const k=Object.keys(S).find(key=>S[key].file && S[key].file.toLowerCase().indexOf(arg.toLowerCase().replace(/\s+/g,''))>=0);
        if(k){ this.vmSetProgram(k); this.openVM(); return; }
        this.say('no program named '+arg+'  (try: run hello | fib | powers)'); return;
      }
      this.openVM(); return;
    }
    if(cmd==='pwd'){ this.out([this._promptStr()]); return; }
    this.say('bad command: '+cmd+'   (type help)');
  }
  _helpLines(){ return [
    'COMMANDS',
    '  cd <dir> / ..     open a folder / go up      ls · dir · tree',
    '  open <file>       read a file   ( cat ,  also  cat *.txt )',
    '  edit <file>       vim editor    ( make <name>  = new + edit )',
    '  touch <name>      new file      mkdir <name>   new folder',
    '  rm / rename / cp  manage your MY-FILES files',
    '  find <t> · grep <t> · wc <file> · pwd · history · clear',
    '  6502              launch the CPU VM   ( in CLI:  6502 help )',
    '  viz               open the analytics dashboards',
    '  mail · resume · go <github|linkedin|marist>',
    '  cli / gui         toggle CLI mode      config · about · help',
    '  keys:  ↑ / ↓  recall history      Tab  completes commands & files',
    '  psst: there may be an easter egg or two hidden around, especially in here.',
  ]; }
  selectRootFile(prefix){
    const idx=(this.root.children||[]).findIndex(x=>x.name.toUpperCase().startsWith(prefix.toUpperCase()));
    if(idx>=0) this.setState({ stack:[this.root], sel:idx, activeMenu:null });
  }

  items(){
    const dir = this.cur();
    let base = (dir.children||[]).slice();
    if(this.state.stack.length===1 && this.cfg.hidden){
      base = base.concat([{ name:'.SECRET .EGG', kind:'file', size:'42', date:'01.01.70', hidden:true, doc:{ kind:'doc', title:'.SECRET.EGG', meta:'HIDDEN FILE', sub:'You found the hidden files.', link:'https://github.com/RPlante28', linkLabel:'OPEN THE REPOS \u25b8', tags:['hidden'], bullets:[
        'Real Norton Commander hid system and dotfiles until you flipped this switch in Configuration.',
        'This is not the only thing tucked away in here. I may have hidden a few more. Keep poking around, and try typing things into the terminal.' ] } }]);
    }
    const key = this.state.sortKey;
    if(key){
      const val=(x)=>{
        if(key==='name') return x.name.toLowerCase();
        if(key==='date'){ const p=(x.date||'').split('.'); return p.length===3 ? (p[2]+p[0]+p[1]) : '~'; }
        if(key==='size') return ('00000000'+(parseInt((x.size||'').replace(/[^0-9]/g,''))||0)).slice(-9);
        return '';
      };
      base.sort((a,b)=>{
        const ad=a.kind==='dir', bd=b.kind==='dir';
        if(ad!==bd) return ad?-1:1;
        const va=val(a), vb=val(b);
        return va<vb?-1:(va>vb?1:0);
      });
    }
    if(this.state.stack.length>1){
      return [{ name:'..', kind:'updir', size:'\u25b6UP--DIR\u25c4', date:'' }].concat(base);
    }
    return base;
  }
  activate(i){
    const its = this.items();
    const it = its[i];
    if(!it) return;
    if(it.kind==='updir'){
      this._upDir();
    } else if(it.kind==='dir'){
      this.setState(s=>({ stack:s.stack.concat([it]), sel:(it.children&&it.children.length)?1:0 }));
    } else {
      this.setState({ sel:i });
    }
  }
  // go up a level, landing the highlight on the folder we just left
  _upDir(){
    const st=this.state.stack;
    if(st.length<=1) return;
    const leaving=st[st.length-1];
    const parent=st[st.length-2];
    const newStack=st.slice(0,-1);
    const hasUp = newStack.length>1;
    let idx=(parent.children||[]).indexOf(leaving);
    idx = idx<0 ? 0 : idx + (hasUp?1:0);
    this.setState({ stack:newStack, sel:idx });
  }
  // move the panel highlight by delta, clamped
  _navSel(d){
    const its=this.items();
    this.setState(s=>({ sel:Math.max(0, Math.min(its.length-1, s.sel+d)) }));
  }
  openContact(){ this.setState({ dialog:'contact', sent:false, sending:false, contactErr:'', activeMenu:null }); }
  sendContact(){
    if(this.state.sending) return;   // ignore repeat clicks while a send is already in flight
    const val=(el)=>el?String(el.value||''):'';
    // client-side sanitize: strip control chars, collapse whitespace, trim, cap length
    const stripCtl=(s)=>s.replace(/[\u0000-\u001f\u007f]/g,' ');
    const clean=(s,max)=>stripCtl(s).replace(/\s+/g,' ').trim().slice(0,max);
    const name  = clean(val(this._cName),100);
    const email = clean(val(this._cEmail),120).toLowerCase();
    // message keeps line breaks but drops other control chars
    const message = s2(val(this._cMsg)).trim().slice(0,4000);
    function s2(s){ return s.replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g,''); }
    // validate
    if(!name){ this.setState({ contactErr:'Please enter your name.' }); return; }
    if(name.length<2){ this.setState({ contactErr:'Please enter your full name.' }); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ this.setState({ contactErr:'Please enter a valid e-mail address.' }); return; }
    if(!message){ this.setState({ contactErr:'Please enter a message.' }); return; }
    if(message.length<2){ this.setState({ contactErr:'Your message is too short.' }); return; }
    this.setState({ contactErr:'', sending:true });
    this._postMail({ name, email, subject:'Portfolio contact from '+name, message }).then(res=>{
      if(res&&res.ok){ this.setState({ sent:true, sending:false, contactErr:'' }); }
      else { this.setState({ sending:false, contactErr: (res&&res.error==='network')
        ? 'Network error - please e-mail rohanplante@gmail.com directly.'
        : 'Could not send - please e-mail rohanplante@gmail.com directly.' }); }
    });
  }
  openHelp(){ this.setState({ dialog:'help', activeMenu:null }); }
  openDash(which){ this.setState({ dialog:(which===2?'dash2':'dash1'), activeMenu:null }); }
  openResume(){ this.setState({ dialog:'resume', activeMenu:null }); }
  // open an <img> element in the full-screen image viewer (used by timeline photos)
  _imgOpen(img){ if(!img) return; const full=img.getAttribute('data-full')||img.getAttribute('src'); const name=(img.getAttribute('alt')||'IMAGE').toUpperCase(); const meta=img.getAttribute('data-full')?'SOURCE: original capture (filters off)':'SOURCE: '+full.split('/').pop(); this.setState({ imgView:{ src:full, name, meta } }); }

  // ===== 6502 virtual machine - faithful scalar-pipeline core (cpu6502.js) =====
  ensureVM(){
    if(this._cpu) return this._cpu;
    if(!window.CPU6502) return null;
    this._cpu = new window.CPU6502();
    this.loadProgramKey(this.vmProgKey || 'HELLO');
    return this._cpu;
  }
  // list of loadable programs: built-in samples + user .6502/.asm files
  vmPrograms(){
    const out=[];
    const S=window.CPU6502 ? window.CPU6502.SAMPLES : {};
    ['HELLO','POWERS','FIB','INCTEST','CARRY'].forEach(k=>{ if(S[k]) out.push({ key:k, label:S[k].file+'  ('+S[k].title+')', kind:'sample' }); });
    const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.kind==='file' && /\.(6502|hex|asm)$/i.test(c.name.replace(/\s+/g,''))){ out.push({ key:'user:'+c.name, label:c.name+'  (yours)', kind:'user', node:c }); } if(c.kind==='dir') walk(c); }); };
    walk(this.userRoot);
    return out;
  }
  loadProgramKey(key){
    const cpu=this._cpu; if(!cpu) return;
    this.vmProgKey=key;
    if(key && key.indexOf('user:')===0){
      const name=key.slice(5);
      const node=this.findUserFile(name) || this.findInDir(this.userRoot,name);
      const body=node?(node.body||''):'';
      const asm=/\.asm$/i.test(name.replace(/\s+/g,''));
      const res=asm?cpu.assemble(body,name):cpu.loadHexText(body,name);
      this._vmLoadMsg = res.ok ? ('loaded '+name+'  ('+res.bytes+' bytes)') : ('LOAD ERROR: '+(res.errors||[]).join('  '));
      return;
    }
    const S=window.CPU6502.SAMPLES, s=S[key]||S.HELLO;
    cpu.loadWrites(s.writes, s.file);
    this._vmLoadMsg='loaded '+s.file;
  }
  vmReset(){ const cpu=this.ensureVM(); if(!cpu) return; this.vmStop(); this.loadProgramKey(this.vmProgKey); this.forceUpdate(); }
  vmStep(){ const cpu=this.ensureVM(); if(!cpu) return; cpu.step(); this.forceUpdate(); }
  // clock-speed presets (shared by GUI + CLI). burst = cycles per tick, iv = ms per tick
  vmSpeeds(){ return [
    { label:'0.5 Hz  (very slow)', burst:1, iv:2000 },
    { label:'1 Hz  (slow)',        burst:1, iv:1000 },
    { label:'2 Hz',                burst:1, iv:500 },
    { label:'5 Hz',                burst:1, iv:200 },
    { label:'10 Hz',               burst:1, iv:100 },
    { label:'30 Hz',               burst:1, iv:33 },
    { label:'Turbo  (max)',        burst:140, iv:24 },
  ]; }
  vmSpeed_(){ return this.vmSpeeds()[this.vmSpeed] || this.vmSpeeds()[3]; }
  vmSetSpeed(i){
    const n=this.vmSpeeds().length;
    this.vmSpeed = Math.max(0, Math.min(n-1, i|0));
    if(this.vmRunning){ this.vmStop(); this.vmRun(); }
    else if(this._cliVmTimer){ this.cliVmStop(true); this.cliVmRun(); }
    else this.forceUpdate();
  }
  vmRun(){
    const cpu=this.ensureVM(); if(!cpu) return;
    if(this.vmRunning){ this.vmStop(); return; }
    const sp=this.vmSpeed_();
    this.vmRunning=true; this.forceUpdate();
    this._vmTimer=setInterval(()=>{
      cpu.runBurst(sp.burst);
      this.forceUpdate();
      if(cpu.halted || cpu.cyclesTotal>500000) this.vmStop();
    }, sp.iv);
  }
  vmStop(){ this.vmRunning=false; if(this._vmTimer){ clearInterval(this._vmTimer); this._vmTimer=null; } this.forceUpdate(); }
  vmSetProgram(key){ this.ensureVM(); this.vmStop(); this.loadProgramKey(key); this.forceUpdate(); }
  vmPageStep(d){ this.vmPage=(this.vmPage+d)&0xFF; this.forceUpdate(); }
  // edit the currently selected program in the editor (user files only)
  vmEditProgram(){
    const key=this.vmProgKey||'';
    if(key.indexOf('user:')===0){ const name=key.slice(5); const node=this.findUserFile(name)||this.findInDir(this.userRoot,name); if(node){ this.openEditor(node); return; } }
    // sample -> copy into a new user file so it can be edited & run
    const S=window.CPU6502.SAMPLES, s=S[key]||S.HELLO;
    const f=this.makeFile(s.file); f.body=s.text; this._saveFS();
    this.vmProgKey='user:'+f.name; this.openEditor(f);
  }
  vmNewProgram(){
    const f=this.makeFile('MYPROG.ASM'); f.body=window.CPU6502.SAMPLES.STARTER_ASM; this._saveFS();
    this.vmProgKey='user:'+f.name; this.openEditor(f);
  }
  openVM(){
    this.ensureVM();
    const prog=(this.root.children||[]).find(c=>c.name==='PROGRAMS');
    if(prog){ const fi=prog.children.findIndex(c=>c.name.indexOf('CPU6502')>=0); this.setState({ stack:[this.root, prog], sel:fi<0?0:fi+1, activeMenu:null, editing:null, cliMode:false }); }
  }
  openDataViz(){
    const exp=(this.root.children||[]).find(c=>c.name==='EXPERIENCE');
    if(exp){ const fi=exp.children.findIndex(c=>c.name.indexOf('DATA-ANL')>=0); this.setState({ stack:[this.root, exp], sel:fi<0?0:fi+1, activeMenu:null, editing:null, cliMode:false }); }
  }

  // ===== arcade games (games.js) =====
  gameCanvasRef(el){
    this._gameCanvas = el;
    if(el){ if(this._pendingGame){ this._startGame(this._pendingGame, el); this._pendingGame=null; } }
    else { this._stopGame(); }
  }
  _startGame(id, canvas){
    if(!window.NCGames || !canvas) return;
    if(this._game){ this._game.stop(); this._game=null; }
    this._game = window.NCGames.create(id, canvas, { onStatus:(t)=>{ this._gameStatus=t; if(this._gameStatusEl) this._gameStatusEl.textContent=t; } });
    this._curGameId = id;
    if(this._game){ this._game.start(); }
  }
  _stopGame(){ if(this._game){ this._game.stop(); this._game=null; } this._curGameId=null; this._gameStatus=''; }
  gameControl(action){
    if(!this._game) return;
    if(action==='start'){ this._game.start(); }
    else if(action==='reset'){ this._game.reset(); }
    else { this._game.onKey(action); }
  }

  // ===== project ASCII visualizations (animated heroes) =====
  _startViz(type){
    this._stopViz();
    const gen = this._vizGens[type];
    if(!gen || !this._vizEl){ this._curViz=type; return; }
    this._curViz=type;
    const clock=()=> (typeof performance!=='undefined' ? performance.now() : Date.now());
    const start=clock(); let last=null, lastF=-1;
    // Drive with requestAnimationFrame but hand the generators an INTEGER frame
    // (they're all written for integer steps) that only advances ~14x/sec. We
    // recompute the art only when that frame number changes, not on every paint,
    // so the main thread stays free and the block cursor / UI stay smooth.
    const tick=()=>{
      if(this._dead || !this._vizEl || this._curViz!==type){ this._vizRaf=null; return; }
      const f=Math.floor((clock()-start)/70);
      if(f!==lastF){
        lastF=f;
        let s=''; try { s=gen(f); } catch(e){}
        if(s!==last){ this._vizEl.textContent=s; last=s; }
      }
      this._vizRaf=requestAnimationFrame(tick);
    };
    this._vizRaf=requestAnimationFrame(tick);
  }
  _stopViz(){ if(this._vizRaf){ cancelAnimationFrame(this._vizRaf); this._vizRaf=null; } if(this._vizTimer){ clearTimeout(this._vizTimer); this._vizTimer=null; } this._curViz=null; }
  _mkVizGens(){ return window.VIZ; }   // animations defined in animations.js

  // ===== text-mode 6502 monitor (strict CLI) =====
  _vmHx(n,w){ return (n>>>0).toString(16).toUpperCase().padStart(w||2,'0'); }
  cliVmHeader(){ return 'cyc |  F    D    E    W    I  |  A  X  Y   PC  | Z C | notes'; }
  cliVmLine(cpu){
    const st=cpu.state(), s=st.stages;
    const cell=(v)=>(v.empty?'--':v.op).padEnd(4);
    const notes=[]; if(st.stallFetch) notes.push('fetch-stall'); if(st.stallExec) notes.push('INC-stall'); if(st.halted) notes.push('BRK');
    return String(st.stats.cycles).padStart(3)+' | '+cell(s.F)+' '+cell(s.D)+' '+cell(s.E)+' '+cell(s.W)+' '+cell(s.I)+
      ' | '+st.acc+' '+st.x+' '+st.y+'  '+st.pc+' | '+st.z+' '+st.carry+' | '+notes.join(' ');
  }
  _cliVmHelp(){ return [
    '6502 monitor - scalar pipeline (F\u2192D\u2192E\u2192W\u2192I)',
    '  6502 list            list loadable programs',
    '  6502 load <name>     load a sample or one of your files',
    '  6502 step [n]        advance n clock cycles (default 1), trace each',
    '  6502 run             run the clock, tracing one line per cycle',
    '  6502 stop            stop the clock',
    '  6502 speed <0-6>     0=0.5Hz slow .. 6=turbo   (also:  speed <n> )',
    '  6502 reg             registers + pipeline stats',
    '  6502 mem <pg>        hex-dump a memory page (e.g.  mem 00 )',
    '  6502 out             show SYS output so far',
    '  6502 reset           reload the current program',
    '  shortcuts:  run [name]  ·  step [n]  ·  speed <n>',
    'current: '+(this.vmProgKey||'(none)')+'   clock '+this.vmSpeed_().label,
  ]; }
  _cliVmLoad(name){
    if(!name){ this.print(['load: give a program name  (6502 list)']); return; }
    const node=this.findUserFile(name)||this.findInDir(this.userRoot,name);
    if(node && node.kind==='file'){ this.loadProgramKey('user:'+node.name); this.print([this._vmLoadMsg||('loaded '+node.name)]); this.forceUpdate(); return true; }
    const S=window.CPU6502.SAMPLES;
    const k=Object.keys(S).find(key=>S[key].file && (key.toLowerCase()===name.toLowerCase() || S[key].file.toLowerCase().indexOf(name.toLowerCase().replace(/\s+/g,''))>=0));
    if(k){ this.loadProgramKey(k); this.print([this._vmLoadMsg||('loaded '+k)]); this.forceUpdate(); return true; }
    this.print(['load: no program named \u201C'+name+'\u201D  (6502 list)']); return false;
  }
  _cliVmRegs(cpu){ const st=cpu.state(); return [
    'A=$'+st.acc+'  X=$'+st.x+'  Y=$'+st.y+'  PC=$'+st.pc+'    Z='+st.z+'  C='+st.carry+(st.halted?'   [HALTED]':''),
    'cycles '+st.stats.cycles+'   retired '+st.stats.retired+'   IPC '+st.stats.ipc.toFixed(3),
    'stalls: fetch '+st.stats.fetchStalls+'   inc '+st.stats.incStalls+'   branch-flush '+st.stats.branchFlushes+'   bubbles '+st.stats.bubbles,
  ]; }
  _cliVmMem(cpu,pg){ pg=pg&0xFF; const rows=cpu.dumpPage(pg); return ['memory $'+this._vmHx(pg)+'00 - $'+this._vmHx(pg)+'FF']
    .concat(rows.map(r=>r.addr+'  '+r.cells.map(c=>c.v).join(' '))); }
  cliVmStepN(n){
    const cpu=this.ensureVM(); if(!cpu) return;
    if(cpu.halted){ this.print(['(halted - type  6502 reset  to reload)']); return; }
    const lines=[this.cliVmHeader()];
    for(let i=0;i<n && !cpu.halted;i++){ cpu.step(); lines.push(this.cliVmLine(cpu)); }
    if(cpu.halted){ lines.push('-- HALTED (BRK) --'); const o=cpu.state().out; if(o) lines.push('output: '+JSON.stringify(o)); }
    this.print(lines); this.forceUpdate();
  }
  cliVmStop(quiet){
    if(this._cliVmTimer){ clearInterval(this._cliVmTimer); this._cliVmTimer=null; if(!quiet) this.print(['-- clock stopped --']); }
    else if(!quiet){ this.print(['(clock is not running)']); }
    this.vmRunning=false; this.forceUpdate();
  }
  cliVmRun(){
    const cpu=this.ensureVM(); if(!cpu) return;
    if(this._cliVmTimer){ this.cliVmStop(); return; }
    if(cpu.halted){ this.print(['(halted - type  6502 reset  to reload)']); return; }
    const sp=this.vmSpeed_();
    const turbo = sp.burst>1;
    this.print(['', 'RUN @ '+sp.label+'   (type  6502 stop  to halt)', this.cliVmHeader()]);
    this._cliVmTimer=setInterval(()=>{
      if(turbo){ cpu.runBurst(sp.burst); }
      else { cpu.step(); this.print([this.cliVmLine(cpu)]); }
      if(cpu.halted){
        clearInterval(this._cliVmTimer); this._cliVmTimer=null; this.vmRunning=false;
        const st=cpu.state();
        const tail=[];
        if(turbo) tail.push(this.cliVmLine(cpu));
        tail.push('-- HALTED (BRK) --');
        if(st.out) tail.push('output: '+JSON.stringify(st.out));
        tail.push('cycles '+st.stats.cycles+'   retired '+st.stats.retired+'   IPC '+st.stats.ipc.toFixed(3));
        tail.push('stalls: fetch '+st.stats.fetchStalls+'   inc '+st.stats.incStalls+'   branch-flush '+st.stats.branchFlushes);
        this.print(tail);
      }
      this.forceUpdate();
    }, sp.iv);
    this.vmRunning=true;
  }
  cliVm(arg){
    const cpu=this.ensureVM(); if(!cpu){ this.print(['6502: engine failed to load']); return; }
    const parts=(arg||'').trim().split(/\s+/).filter(Boolean);
    const sub=(parts[0]||'').toLowerCase();
    const a=parts.slice(1).join(' ');
    if(!sub || sub==='help' || sub==='?'){ this.print(this._cliVmHelp()); return; }
    if(sub==='list' || sub==='ls' || sub==='dir'){ this.print(['loadable programs:'].concat(this.vmPrograms().map(p=>'  '+(p.key===this.vmProgKey?'\u00bb ':'  ')+p.label))); return; }
    if(sub==='load' || sub==='open'){ this._cliVmLoad(a); return; }
    if(sub==='reset'){ this.loadProgramKey(this.vmProgKey); this.print(['reset - '+(this._vmLoadMsg||'')]); this.forceUpdate(); return; }
    if(sub==='reg' || sub==='regs' || sub==='r'){ this.print(this._cliVmRegs(cpu)); return; }
    if(sub==='mem' || sub==='m'){ const pg=a?(parseInt(a.replace(/^\$/,''),16)||0):0; this.print(this._cliVmMem(cpu,pg)); return; }
    if(sub==='out' || sub==='output'){ const o=cpu.state().out; this.print(['SYS output:', o?o:'(none yet)']); return; }
    if(sub==='speed' || sub==='clock'){ if(a!=='') this.vmSetSpeed(parseInt(a,10)); this.print(['clock = '+this.vmSpeed_().label+'   (0..'+(this.vmSpeeds().length-1)+')']); return; }
    if(sub==='stop' || sub==='halt' || sub==='s'){ this.cliVmStop(); return; }
    if(sub==='step' || sub==='st'){ const n=a?Math.max(1,parseInt(a,10)||1):1; this.cliVmStepN(n); return; }
    if(sub==='run' || sub==='go' || sub==='g'){ if(a) this._cliVmLoad(a); this.cliVmRun(); return; }
    // bare name -> load it
    if(this._cliVmLoad(sub)){ this.print(['type  6502 run  or  6502 step']); return; }
  }

  componentDidMount(){
    // Hide any timeline photo that fails to load (e.g. before an image is added).
    // 'error' doesn't bubble, so listen in the capture phase.
    this._onImgErr = (e)=>{ const t=e.target; if(t && t.tagName==='IMG'){ t.style.display='none'; } };
    document.addEventListener('error', this._onImgErr, true);
    this._onKey = (e)=>{
      this._bootSound();
      this.keyClick(e);
      if(this.state.booting){ this.finishBoot(); return; }
      if(this.state.bossMode){ if(e.key==='Escape'){ e.preventDefault(); this.setState({ bossMode:false }); setTimeout(()=>{ const el=this.state.cliMode?this._cli:this._cmd; if(el) el.focus(); }, 20); } return; }
      if(e.key==='F1'){ e.preventDefault(); if(this.state.dialog==='help') this.closeDialog(); else this.openHelp(); return; }
      if(e.key==='F4'){ e.preventDefault(); if(this.state.dialog==='resume') this.closeDialog(); else this.openResume(); return; }
      // route gameplay keys to the active arcade game
      if(this._game && !this.state.cliMode && !this.state.dialog && !this.state.editing){
        if(/^(Arrow(Up|Down|Left|Right)|[wasdWASD]|[1-9]| )$/.test(e.key) || e.key==='r' || e.key==='R'){
          if(e.key===' '||/^Arrow/.test(e.key)) e.preventDefault();
          this._game.onKey(e.key); return;
        }
      }
      if(e.target && (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')){
        if(this.state.editing && e.key==='Tab'){ e.preventDefault(); this.edToNormal(); return; }
        if(e.key==='Escape' && this.state.dialog){ this.closeDialog(); }
        return;
      }
      if(e.key==='Escape'){ if(this.state.imgView){ this.setState({ imgView:null }); return; } if(this.state.editing){ this.closeEditor(); return; } if(this.state.dialog){ this.closeDialog(); return; } this.closeMenu(); return; }
      if(this.state.editing) return;
      if(e.key==='o' || e.key==='O'){ e.preventDefault(); this.toggleCli(); return; }
      if(e.key==='e' || e.key==='E'){ e.preventDefault(); this.editSelected(); return; }
      if(this.state.cliMode) return;
      const its=this.items(); let s=this.state.sel;
      if(e.key==='ArrowDown'){ e.preventDefault(); this.setState({ sel:Math.min(its.length-1, s+1) }); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); this.setState({ sel:Math.max(0, s-1) }); }
      else if(e.key==='Enter'){ e.preventDefault(); this.activate(s); }
      else if(e.key==='Backspace'){ if(this.state.stack.length>1){ e.preventDefault(); this._upDir(); } }
    };
    window.addEventListener('keydown', this._onKey);
    this._onPointer = (e)=>{ this._bootSound(); this.clickSound(); };
    window.addEventListener('pointerdown', this._onPointer);
    // DOS block mouse cursor: a character-cell block that inverts what's under it
    document.documentElement.classList.add('nc-blockcur');
    // Coalesce mouse moves into one transform write per animation frame (mice
    // poll far faster than 60Hz, and the mix-blend cursor repaints on every
    // write, one paint per event makes it visibly drag). translate3d keeps it
    // on its own layer.
    this._mouseXY = null;
    this._drawCursor = ()=>{ this._cursorRaf=0; const m=this._mouse, p=this._mouseXY; if(!m||!p) return; m.style.display='block'; m.style.transform='translate3d('+p.x+'px,'+(p.y-2)+'px,0)'; };
    this._onMouseMove = (e)=>{ this._mouseXY={ x:e.clientX, y:e.clientY }; if(!this._cursorRaf) this._cursorRaf=requestAnimationFrame(this._drawCursor); };
    this._onMouseOut = (e)=>{ if(!e.relatedTarget && !e.toElement && this._mouse){ this._mouse.style.display='none'; } };
    this._onWinBlur = ()=>{ if(this._mouse) this._mouse.style.display='none'; };
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseout', this._onMouseOut);
    window.addEventListener('blur', this._onWinBlur);
    this.tw = { p:0, c:0, del:false };
    this._twTick();
    // Audio stays locked until the first real user gesture: the keydown/pointer
    // handlers call _bootSound() to resume it then. (Browser autoplay policy.)
    this._bootStep();
  }
  _bootStep(){
    if(this._dead || !this.state.booting) return;
    const full=this.bootFull, n=this.state.bootText.length;
    if(n < full.length){
      const ch=full[n];
      this.setState(s=>({ bootText: full.slice(0, s.bootText.length+1) }));
      // teletype click as visible characters scan in (throttled so rapid runs aren't harsh)
      if(ch && ch!=='\n' && ch!==' '){ this._bootTick=(this._bootTick||0)+1; if(this._bootTick%2===0) this._bootClick(); }
      let delay = 16 + Math.random()*22;          // ~16-38ms per char (scan-in feel)
      if(ch==='\n') delay = 150;                    // settle at line breaks
      else if(ch==='.') delay = 8;                  // dot leaders zip
      else if(ch===':') delay = 70;
      this._bootT = setTimeout(()=>this._bootStep(), delay);
    } else {
      this._bootT = setTimeout(()=>this.finishBoot(), 850);
    }
  }
  finishBoot(){ clearTimeout(this._bootT); if(this.state.booting) this.setState({ booting:false }); }
  componentWillUnmount(){ this._dead=true; if(this._onImgErr) document.removeEventListener('error', this._onImgErr, true); window.removeEventListener('keydown', this._onKey); window.removeEventListener('mousemove', this._onMouseMove); window.removeEventListener('mouseout', this._onMouseOut); window.removeEventListener('blur', this._onWinBlur); document.documentElement.classList.remove('nc-blockcur'); clearTimeout(this._twT); if(this._cursorRaf) cancelAnimationFrame(this._cursorRaf); if(this._vmTimer) clearInterval(this._vmTimer); if(this._cliVmTimer) clearInterval(this._cliVmTimer); this._stopViz(); if(this._game) this._game.stop(); }
  componentDidUpdate(){ if(this.state.cliMode && this._termScroll){ this._termScroll.scrollTop = this._termScroll.scrollHeight; } }
  _twTick(){ /* tagline animation retired */ }

  renderVals(){
    const its = this.items();
    const dir = this.state.stack[this.state.stack.length-1];
    const sel = its[this.state.sel] || its[0];
    const rows = its.map((it,idx)=>({
      cls: 'nc-frow' + (idx===this.state.sel ? ' is-sel' : ''),
      name: it.name,
      size: (it.user && it.kind==='file') ? String((it.body||'').length) : (it.size || ''),
      date: it.date || '',
      nameColor: (idx===this.state.sel) ? '#0000a8' : (it.kind==='dir'||it.kind==='updir' ? '#ffffff' : '#d4d8dc'),
      onClick: ()=>this.activate(idx),
    }));
    let view='info';
    if(sel && sel.user && sel.kind==='file'){ view='text'; }
    else if(sel && sel.doc){ view = sel.doc.kind; }
    // arcade game lifecycle: start/switch when a .EXE game is selected; stop otherwise
    const wantGame = (view==='game' && sel && sel.doc) ? sel.doc.game : null;
    if(wantGame !== this._curGameId){
      if(wantGame){ if(this._gameCanvas){ this._startGame(wantGame, this._gameCanvas); } else { this._pendingGame=wantGame; this._curGameId=wantGame; } }
      else if(this._game){ this._stopGame(); }
    }
    // project visualization lifecycle: animate the hero ASCII when a doc with a viz is shown
    const wantViz = (view==='doc' && sel && sel.doc && sel.doc.viz) ? sel.doc.viz : null;
    if(wantViz !== this._curViz){
      if(wantViz){ if(this._vizEl){ this._startViz(wantViz); } else { this._pendingViz=wantViz; this._curViz=wantViz; } }
      else if(this._vizRaf || this._curViz){ this._stopViz(); }
    }
    const textBody = (sel && sel.user && sel.kind==='file') ? (sel.body||'') : ((sel && sel.doc && (sel.doc.kind==='text'||sel.doc.kind==='art')) ? sel.doc.body : '');
    const textEditable = !!(sel && sel.user && sel.kind==='file');
    const emptyTl = { intro:[], entries:[], footer:null, hasFooter:false };
    let d = { title:'', meta:'', sub:'', bullets:[], tags:[], link:'#', linkLabel:'', hasSub:false, hasBullets:false, hasTags:false, timeline:emptyTl, hasTimeline:false, hasGoto:false, gotoLabel:'', hasGoto2:false, gotoLabel2:'' };
    if(view==='doc'){
      const o=sel.doc;
      const tl = o.timeline ? {
        intro: o.timeline.intro||[],
        entries: (o.timeline.entries||[]).map(e=>({ date:e.date, title:e.title, desc:e.desc,
          imgs:(e.imgs||[]).map(src=>({ t:src.replace(/\.\w+$/,'-dither.png'), f:src })),
          onImgClick:(ev)=>{ const t=ev&&ev.target; if(t&&t.tagName==='IMG') this._imgOpen(t); },
          hasImgs:!!(e.imgs&&e.imgs.length) })),
        footer: o.timeline.footer||null, hasFooter: !!o.timeline.footer,
      } : emptyTl;
      d = { title:o.title, meta:o.meta||'', sub:o.sub||'', bullets:o.bullets||[], tags:o.tags||[], link:o.link||'#', linkLabel:o.linkLabel||'OPEN \u25b8',
            hasSub:!!o.sub, hasBullets:!!(o.bullets&&o.bullets.length), hasTags:!!(o.tags&&o.tags.length), dataviz:!!o.dataviz, demo:!!o.demo,
            art:o.art||'', hasArt:!!(o.art&&!o.imgSrc), imgSrc:o.imgSrc||'', hasImg:!!o.imgSrc,
            viz:o.viz||'', hasViz:!!o.viz, vizLabel:o.vizLabel||'', hasLink:!!o.link, imgFilter:!!o.imgFilter,
            timeline:tl, hasTimeline:!!(o.timeline&&o.timeline.entries&&o.timeline.entries.length),
            hasGoto:!!o.goto, gotoLabel:o.gotoLabel||'OPEN ▸', hasGoto2:!!o.goto2, gotoLabel2:o.gotoLabel2||'OPEN ▸' };
    }
    const base = dir.children||[];
    const fullPath = this.state.stack.map((n,i)=> i===0 ? n.path : n.name).join('\\');
    const menus = this.menus.map(m=>{
      const open=this.state.activeMenu===m.id;
      return {
        id:m.id, label:m.label, isOpen: open,
        tabBg: open?'#0000a8':'transparent', tabFg: open?'#54fcfc':'#0000a8',
        onClick: ()=>this.toggleMenu(m.id),
        onEnter: ()=>{ if(this.state.activeMenu && this.state.activeMenu!==m.id) this.openMenu(m.id); },
        items: m.items.map(it=>({ label:it.label, isSep:!!it.sep, color: it.sep?'#3f6dc4':(it.cmd?'#06457a':'#0000a8'), onClick:()=>this.runMenuItem(it) })),
      };
    });
    const cpu = (view==='vm') ? this.ensureVM() : this._cpu;
    let vmData=null;
    if(view==='vm' && cpu){
      const st=cpu.state();
      const hx=(n,w)=>n.toString(16).toUpperCase().padStart(w||2,'0');
      const flags=[{f:'Z',on:st.z},{f:'C',on:st.carry}].map(o=>({ f:o.f, col:o.on?'#fcfc54':'#3f6dc4' }));
      const mk=(lbl,sv)=>({ label:lbl, op:sv.op, mnem:sv.mnem, cls:'nc-stage'+(sv.empty?' bub':' act') });
      const stages=[ mk('FETCH',st.stages.F), mk('DECODE',st.stages.D), mk('EXEC',st.stages.E), mk('WRITE',st.stages.W), mk('INTR',st.stages.I) ];
      const memRows=cpu.dumpPage(this.vmPage).map(r=>({ addr:r.addr, cells:r.cells.map(c=>({
        v:c.v,
        bg: c.pc?'#fcfc54':(c.touched?'#13357a':'transparent'),
        fg: c.pc?'#0000a8':(c.zero?'#3f6dc4':'#54fcfc')
      })) }));
      const progs=this.vmPrograms().map(p=>({ key:p.key, label:p.label, sel:p.key===this.vmProgKey }));
      vmData={
        A:st.acc, X:st.x, Y:st.y, PC:st.pc, Z:st.z, C:st.carry, flags,
        stages, memRows, pageLabel:'$'+hx(this.vmPage,2)+'00',
        out: st.out || '', hasOut: !!(st.out && st.out.length),
        loadedName: st.loadedName, loadMsg: this._vmLoadMsg||'',
        cycles:st.stats.cycles, retired:st.stats.retired, ipc:st.stats.ipc.toFixed(3),
        fetchStalls:st.stats.fetchStalls, incStalls:st.stats.incStalls,
        branchFlushes:st.stats.branchFlushes, brkFlushes:st.stats.brkFlushes, bubbles:st.stats.bubbles,
        programs:progs,
        progKey:this.vmProgKey,
        speeds:this.vmSpeeds().map((s,i)=>({ i:i, label:s.label })),
        speedIdx:this.vmSpeed,
        onPickSpeed:(e)=>this.vmSetSpeed(parseInt(e.target.value,10)),
        runLabel:this.vmRunning?'\u25A0 Stop':'\u25B6 Run',
        haltMsg: st.halted ? 'BRK - halted' : (this.vmRunning?'running\u2026':(st.stats.cycles>0?'paused':'ready')),
        onPickProgram:(e)=>this.vmSetProgram(e.target.value),
      };
    }
    return {
      leftTitle: fullPath,
      pathLine: fullPath,
      rightTitle: (view==='info') ? 'Info' : (sel ? sel.name : 'Info'),
      rows,
      selName: sel ? sel.name : '',
      selDate: sel ? (sel.date || (sel.kind==='updir'?'09.03.15':'')) : '',
      fileCount: base.filter(x=>x.kind==='file').length,
      dirCount: base.filter(x=>x.kind==='dir').length,
      isInfo: view==='info' && !this.state.editing && !(sel && sel.kind==='dir'), isDoc: view==='doc', isEdu: view==='edu', isContact: view==='contact',
      isDataViz: view==='dataviz', openDataViz:()=>this.openDataViz(),
      openMcServer:()=>{ const f=this.flatten(this.root).find(x=>x.name && x.name.indexOf('MCSERVER')>=0); if(f) this.revealNode(f); },
      // jump to another file referenced by the current doc's `goto` field (internal link)
      gotoFile:()=>{ const its=this.items(); const cur=its[this.state.sel]; const name=cur&&cur.doc&&cur.doc.goto; if(!name) return; const key=String(name).replace(/\s+/g,'').toUpperCase(); const f=this.flatten(this.root).find(x=>x.kind==='file' && x.name.replace(/\s+/g,'').toUpperCase().indexOf(key)>=0); if(f) this.revealNode(f); },
      gotoFile2:()=>{ const its=this.items(); const cur=its[this.state.sel]; const name=cur&&cur.doc&&cur.doc.goto2; if(!name) return; const key=String(name).replace(/\s+/g,'').toUpperCase(); const f=this.flatten(this.root).find(x=>x.kind==='file' && x.name.replace(/\s+/g,'').toUpperCase().indexOf(key)>=0); if(f) this.revealNode(f); },
      openCompSoc:()=>{ const f=this.flatten(this.root).find(x=>x.name && x.name.indexOf('COMPSOC')>=0); if(f) this.revealNode(f); },
      openDataAnl:()=>{ const f=this.flatten(this.root).find(x=>x.name && x.name.indexOf('DATA-ANL')>=0); if(f) this.revealNode(f); },
      openNorton:()=>{ const f=this.flatten(this.root).find(x=>x.name && x.name.replace(/\s+/g,'').indexOf('NORTON')>=0); if(f) this.revealNode(f); },
      isGame: view==='game',
      gameTitle: (view==='game' && sel && sel.doc) ? (sel.doc.title||sel.doc.game) : '',
      gameStatusInit: this._gameStatus||'',
      gameHint: (view==='game' && sel && sel.doc && sel.doc.game==='tictactoe')
        ? 'Click a square (you are X), or press keys 1-9.  R resets.  CPU plays O.'
        : 'Use the arrow keys or the on-screen D-pad (or WASD).  Space/Start begins.  R restarts.',
      gameCanvasRef: this._gameCanvasRefCb, gameStatusRef: this._gameStatusRefCb,
      vizRef: this._vizRefCb,
      gameStart:()=>this.gameControl('start'), gameReset:()=>this.gameControl('reset'),
      gameUp:()=>this.gameControl('ArrowUp'), gameDown:()=>this.gameControl('ArrowDown'),
      gameLeft:()=>this.gameControl('ArrowLeft'), gameRight:()=>this.gameControl('ArrowRight'),
      isText: (view==='text'||view==='art'), isArt: view==='art', textBody, textEditable, textReadonly: !textEditable,
      d, edu:this.edu, helloArt:this.helloArt,
      // ISWP logo direct key (bypasses d object)
      docImgSrc: (view==='doc' && sel && sel.doc && sel.doc.imgSrc) ? (sel.doc.dither ? sel.doc.imgSrc.replace(/\.\w+$/,'-dither.png') : sel.doc.imgSrc) : '',
      docImgFull: (view==='doc' && sel && sel.doc && sel.doc.imgSrc) ? sel.doc.imgSrc : '',
      hasDocImg:  !!(view==='doc' && sel && sel.doc && sel.doc.imgSrc),
      isISWPImg: !!(view==='doc' && sel && sel.doc && sel.doc.imgSrc && sel.doc.imgFilter),
      isMCWImg: !!(view==='doc' && sel && sel.doc && sel.doc.imgSrc && !sel.doc.imgFilter),
      isRavenPhotos: !!(view==='doc' && sel && sel.doc && sel.doc.photoset==='raven'),
      isTrailPhotos: !!(view==='doc' && sel && sel.doc && sel.doc.photoset==='trail'),
      // directory preview (NC-authentic: right panel shows dir contents when folder is highlighted)
      isDirPreview: !!(sel && sel.kind==='dir'),
      dirPreviewItems: (sel && sel.kind==='dir') ? (sel.children||[]).map((c,idx)=>({
        n:c.name, s:c.size||'', i:idx, isDir:c.kind==='dir'||c.kind==='updir', color: c.kind==='dir'?'#fff':'#d4d8dc'
      })) : [],
      dirPreviewOpen:(ev)=>{ let el=ev&&ev.target; while(el && (!el.getAttribute || el.getAttribute('data-dpidx')==null) && el!==ev.currentTarget) el=el.parentElement; if(!el||!el.getAttribute) return; const idx=parseInt(el.getAttribute('data-dpidx'),10); if(isNaN(idx)) return; const dir=this.items()[this.state.sel]; if(!dir||dir.kind!=='dir') return; const child=(dir.children||[])[idx]; if(child) this.revealNode(child); },
      dirPreviewName: (sel && sel.kind==='dir') ? sel.name : '',
      dirPreviewEmpty: !!(sel && sel.kind==='dir' && !(sel.children && sel.children.length)),
      goRoot:this.goRoot,
      // CLI mode
      cliMode: this.state.cliMode, term: this.state.term, termText: this.state.term.join('\n'),
      cliRef:(el)=>{ this._cli=el; }, toggleCli:()=>this.toggleCli(),
      mouseRef:(el)=>{ this._mouse=el; },
      termScrollRef:(el)=>{ this._termScroll=el; },
      cliCursRef:(el)=>{ this._cliCurs=el; }, cmdCursRef:(el)=>{ this._cmdCurs=el; },
      onCliCaret:(e)=>this._moveCursor(this._cliCurs, e.target),
      onCmdCaret:(e)=>this._moveCursor(this._cmdCurs, e.target),
      cliPrompt: this.state.sudoFlow ? '[sudo] password for guest:' : (this.state.mailFlow ? (this.mailPrompt(this.state.mailFlow.step)+' >') : (fullPath+'>')),
      cliPromptColor: (this.state.mailFlow||this.state.sudoFlow) ? '#fcfc54' : '#d4d8dc',
      cliPlaceholder: this.state.sudoFlow ? '' : (this.state.mailFlow ? 'type your '+this.state.mailFlow.step+'  (or  cancel )' : ''),
      cliInputType: this.state.sudoFlow ? 'password' : 'text',
      focusCli:()=>{ if(this._cli) this._cli.focus(); },
      mailActive: !!this.state.mailFlow,
      onCliKey:(e)=>{ const el=e.target;
        // history recall (↑/↓) and tab-completion, only outside sudo/mail prompts
        if(!this.state.sudoFlow && !this.state.mailFlow){
          const hist=this._cmdHistory||[];
          if(e.key==='ArrowUp'){ e.preventDefault(); if(!hist.length) return; if(this._histIdx==null) this._histIdx=hist.length; this._histIdx=Math.max(0,this._histIdx-1); el.value=hist[this._histIdx]||''; this._moveCursor(this._cliCurs, el); return; }
          if(e.key==='ArrowDown'){ e.preventDefault(); if(this._histIdx==null) return; this._histIdx=Math.min(hist.length,this._histIdx+1); el.value=(this._histIdx>=hist.length)?'':(hist[this._histIdx]||''); this._moveCursor(this._cliCurs, el); return; }
          if(e.key==='Tab'){ e.preventDefault(); this._cliComplete(el); return; }
        }
        if(e.key==='Enter'){ const v=el.value; el.value=''; this._histIdx=null;
          if(this.state.sudoFlow){ this.sudoInput(v); }
          else if(this.state.mailFlow){ this.echo(this.mailPrompt(this.state.mailFlow.step)+' > '+v); this.mailInput(v); }
          else { this.runCommand(v); }
        } else if(e.key==='Escape'){ if(this.state.sudoFlow){ el.value=''; this.setState({ sudoFlow:null }); this.print(['[sudo] password for guest: ','^C','']); } else if(this.state.mailFlow){ this.setState({ mailFlow:null }); this.print(['^C  mail aborted.']); } } },
      // editor
      editing: this.state.editing, isEditing: !!this.state.editing,
      edInPanel: !!this.state.editing && !this.state.cliMode,
      edInCli: !!this.state.editing && this.state.cliMode,
      cliTermView: this.state.cliMode && !this.state.editing,
      edName: this.state.editing?this.state.editing.name:'',
      edRo: !!this.state.editing && (this.state.editing.ro || this.state.edModeV!=='insert'),
      edStatus: this.state.edStatus||'',
      edMode: this.state.editing ? (this.state.editing.ro ? '-- NORMAL --  [readonly]' : (this.state.edModeV==='insert'?'-- INSERT --':this.state.edModeV==='command'?'-- COMMAND --':'-- NORMAL --')) : '',
      edHint: this.state.edModeV==='insert' ? 'Esc/Tab: normal' : 'i insert · : cmd',
      edRef:(el)=>{ this._ed=el; }, edCmdRef:(el)=>{ this._edcmd=el; }, edCursRef:(el)=>{ this._edcurs=el; if(el) this._syncEdCursor(); },
      saveEditor:()=>this.saveEditor(), closeEditor:()=>this.closeEditor(),
      onEdKey:(e)=>this.vimKey(e),
      onEdCaret:(e)=>this._edCaret(),
      edCursor: this.state.edCursor||'1:1',
      onEdCmdKey:(e)=>{
        if(e.key==='Tab' || e.key==='Escape'){ e.preventDefault(); this.edToNormal(); return; }
        if(e.key==='Enter'){
          const v=e.target.value; e.target.value='';
          if(!v.trim()){ this.edToNormal(); return; }
          this.edCommand(v);
        }
      },
      editSelected:()=>this.editSelected(),
      fEdit:()=>this.editSelected(), fCli:()=>this.toggleCli(),
      // 6502 VM
      isVM: view==='vm', openVM:()=>this.openVM(),
      vm: vmData, vmRunning: !!this.vmRunning,
      vmStep:()=>this.vmStep(), vmRun:()=>this.vmRun(), vmReset:()=>this.vmReset(),
      vmEdit:()=>this.vmEditProgram(), vmNew:()=>this.vmNewProgram(),
      vmPageUp:()=>this.vmPageStep(1), vmPageDown:()=>this.vmPageStep(-1),
      menus, anyMenuOpen:!!this.state.activeMenu, closeMenu:this.closeMenu,
      cmdMsg:this.state.cmdMsg, hasCmdMsg:!!this.state.cmdMsg, cmdRef:this.cmdRef,
      onCmdKey:(e)=>{
        if(this.state.cliMode) return;
        if(e.key==='ArrowDown'){ e.preventDefault(); this._navSel(1); return; }
        if(e.key==='ArrowUp'){ e.preventDefault(); this._navSel(-1); return; }
        if(e.key==='Enter'){ const v=e.target.value; if(v.trim()){ e.target.value=''; this.runCommand(v); } else { e.preventDefault(); this.activate(this.state.sel); } return; }
        if(e.key==='Backspace' && !e.target.value){ if(this.state.stack.length>1){ e.preventDefault(); this._upDir(); } return; }
      },
      showStatus: this.cfg.mini,
      homeSkills: this.homeSkills,
      crt: this.cfg.crt,
      // CRT scanline intensity: build the gradient from the saved alpha, plus
      // the slider bar/label that drives it.
      // softer line profile (small solid core + gradient falloff) reduces the
      // shimmer/moiré that hard 1px lines cause; 3px period keeps the roll seamless
      crtScanBg: (()=>{ const a=(this.cfg.crtIntensity==null?0.22:this.cfg.crtIntensity); return 'repeating-linear-gradient(0deg, rgba(0,0,0,'+a+') 0px, rgba(0,0,0,'+a+') 0.6px, rgba(0,0,0,0) 1.8px, rgba(0,0,0,0) 3px)'; })(),
      crtBar: this._mkSlider((v)=>this.setCrtIntensity(v), 0.06, 0.5),
      crtSegs: (()=>{ const min=0.06,max=0.5,n=10,step=(max-min)/n; const v=(this.cfg.crtIntensity==null?0.22:this.cfg.crtIntensity); const cur=Math.round((v-min)/step); const a=[]; for(let i=0;i<=n;i++){ a.push({ ch: i<=cur?'█':'░' }); } return a; })(),
      crtPct: Math.round(((this.cfg.crtIntensity==null?0.22:this.cfg.crtIntensity)-0.06)/(0.5-0.06)*100)+'%',
      crtOpacity: this.cfg.crt ? 1 : 0.5,
      imgViewOpen: !!this.state.imgView,
      imgViewSrc: this.state.imgView ? this.state.imgView.src : '',
      imgViewNode: this.state.imgView ? React.createElement('img', { src:this.state.imgView.src, alt:this.state.imgView.name, style:{ maxWidth:'86vw', maxHeight:'74vh', width:'auto', height:'auto', display:'block', imageRendering:'auto' } }) : null,
      imgViewName: this.state.imgView ? this.state.imgView.name : '',
      imgViewMeta: this.state.imgView ? this.state.imgView.meta : '',
      viewImg:(e)=>{ const img=e&&e.currentTarget; if(!img) return; const full=img.getAttribute('data-full')||img.getAttribute('src'); const name=(img.getAttribute('alt')||'IMAGE').toUpperCase(); const meta=(img.getAttribute('data-full')?'SOURCE: original capture (filters off)':'SOURCE: '+full.split('/').pop()); this.setState({ imgView:{ src:full, name, meta } }); },
      // Hide an image that fails to load (e.g. a timeline photo not added yet)
      imgError:(e)=>{ const img=e&&e.currentTarget; if(img){ img.style.display='none'; } },
      closeImg:()=>this.setState({ imgView:null }),
      dialog: this.state.dialog,
      isConfig: this.state.dialog==='config',
      bossMode: this.state.bossMode,
      bossRows: [
        { n:'1', a:'FY2026 OPERATING PLAN', b:'Q1', c:'Q2', d:'Q3', e:'Q4', wt:'700', lc:'#1a1a1a' },
        { n:'2', a:'Net Revenue', b:'128,400', c:'131,900', d:'140,200', e:'152,750', wt:'400', lc:'#1a1a1a' },
        { n:'3', a:'Cost of Goods', b:'(52,100)', c:'(53,400)', d:'(55,900)', e:'(60,100)', wt:'400', lc:'#1a1a1a' },
        { n:'4', a:'Gross Margin', b:'76,300', c:'78,500', d:'84,300', e:'92,650', wt:'700', lc:'#1a1a1a' },
        { n:'5', a:'Payroll', b:'(41,200)', c:'(41,200)', d:'(43,800)', e:'(43,800)', wt:'400', lc:'#1a1a1a' },
        { n:'6', a:'Marketing', b:'(8,500)', c:'(12,000)', d:'(9,750)', e:'(14,200)', wt:'400', lc:'#1a1a1a' },
        { n:'7', a:'R&D', b:'(15,000)', c:'(15,000)', d:'(16,500)', e:'(18,000)', wt:'400', lc:'#1a1a1a' },
        { n:'8', a:'Facilities', b:'(6,300)', c:'(6,300)', d:'(6,300)', e:'(6,300)', wt:'400', lc:'#1a1a1a' },
        { n:'9', a:'G&A', b:'(4,100)', c:'(4,250)', d:'(4,400)', e:'(4,600)', wt:'400', lc:'#1a1a1a' },
        { n:'10', a:'Operating Income', b:'1,200', c:'(250)', d:'3,550', e:'5,750', wt:'700', lc:'#1a1a1a' },
        { n:'11', a:'Taxes (21%)', b:'(252)', c:'-', d:'(745)', e:'(1,207)', wt:'400', lc:'#1a1a1a' },
        { n:'12', a:'NET INCOME', b:'948', c:'(250)', d:'2,805', e:'4,543', wt:'700', lc:'#1a1a1a' },
        { n:'13', a:'', b:'', c:'', d:'', e:'', wt:'400', lc:'#1a1a1a' },
        { n:'14', a:'memo: portfolio.xls', b:'see N14', c:'', d:'', e:'', wt:'400', lc:'#999999' },
      ],
      isAbout: this.state.dialog==='about',
      isContactDlg: this.state.dialog==='contact',
      isHelp: this.state.dialog==='help',
      isDash: this.state.dialog==='dash1' || this.state.dialog==='dash2',
      dashTitle: this.state.dialog==='dash2' ? 'Marist Event Calendar' : 'Automation Job-Threat Overview',
      dashLink: this.state.dialog==='dash2' ? 'https://public.tableau.com/views/MaristEventCalendar/Dashboard1' : 'https://public.tableau.com/views/automation_jobloss/AutomationJobThreatOverview',
      dashSrc: this.state.dialog==='dash2' ? 'https://public.tableau.com/views/MaristEventCalendar/Dashboard1?:showVizHome=no&:embed=true&:toolbar=yes&:display_count=no' : 'https://public.tableau.com/views/automation_jobloss/AutomationJobThreatOverview?:showVizHome=no&:embed=true&:toolbar=yes&:display_count=no',
      openDash1: ()=>this.openDash(1), openDash2: ()=>this.openDash(2), openHelp: ()=>this.openHelp(),
      isResume: this.state.dialog==='resume', openResume: ()=>this.openResume(),
      sent: this.state.sent, notSent: !this.state.sent, sending: !!this.state.sending,
      contactErr: this.state.contactErr||'', hasContactErr: !!this.state.contactErr,
      cNameRef:(el)=>{ this._cName=el; }, cEmailRef:(el)=>{ this._cEmail=el; }, cMsgRef:(el)=>{ this._cMsg=el; },
      openContact: ()=>this.openContact(),
      sendContact: ()=>this.sendContact(),
      socials: [
        { glyph:'\u25D1', label:'GitHub',   handle:'RPlante28',     href:'https://github.com/RPlante28' },
        { glyph:'in',     label:'LinkedIn', handle:'rohan-plante',  href:'https://linkedin.com/in/rohan-plante' },
        { glyph:'@',      label:'E-mail',   handle:'rohanplante',   href:'mailto:rohanplante@gmail.com' },
        { glyph:'\u25A4', label:'Résumé',   handle:'resume.pdf',    href:'uploads/Rohan_Plante_resume.pdf' },
      ],
      booting: this.state.booting,
      bootText: this.state.bootText,
      bootLogo: this.art.boot,
      bootDone: this.state.bootText.length >= this.bootFull.length,
      skipBoot: ()=>this.finishBoot(),
      fHelp: ()=>this.openHelp(),
      fMenu: ()=>this.openMenu('commands'),
      fConfig: ()=>this.setState({ dialog:'config', activeMenu:null }),
      closeDialog: ()=>this.closeDialog(),
      resetCfg: ()=>this.resetCfg(),
      stop: (e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); },
      cfgRows: [
        { k:'hidden',  label:'Show hidden files',      on:this.cfg.hidden },
        { k:'ins',     label:'Ins moves down',         on:this.cfg.ins },
        { k:'autodir', label:'Auto change directory',  on:this.cfg.autodir },
        { k:'automenu',label:'Auto menus',             on:this.cfg.automenu },
        { k:'mini',    label:'Mini status',            on:this.cfg.mini },
        { k:'keysound',label:'Keyboard click sound',     on:this.cfg.keysound },
        { k:'bootSound',label:'Startup sound',          on:this.cfg.bootSound },
        { k:'crt',     label:'CRT scanlines',          on:this.cfg.crt },
      ].map(r=>({ label:r.label, box: r.on?'[x]':'[ ]', boxColor: r.on?'#0000a8':'#06457a', onClick:()=>this.toggleCfg(r.k) })),
      soundOpacity: this.cfg.keysound ? 1 : 0.4,
      soundProfiles: [
        { id:'thock', name:'thock' }, { id:'clicky', name:'clicky' },
        { id:'typewriter', name:'type' }, { id:'soft', name:'soft' },
      ].map(p=>{ const sel=(this.cfg.soundProfile||'thock')===p.id; return {
        name:p.name, mark: sel?'(o) ':'( ) ',
        color: sel?'#0000a8':'#06457a', weight: sel?'700':'400',
        onClick:()=>this.setSoundProfile(p.id) }; }),
      clickProfiles: [
        { id:'tick', name:'tick' }, { id:'tap', name:'tap' }, { id:'beep', name:'beep' }, { id:'off', name:'off' },
      ].map(p=>{ const sel=(this.cfg.clickProfile||'tick')===p.id; return {
        name:p.name, mark: sel?'(o) ':'( ) ',
        color: sel?'#0000a8':'#06457a', weight: sel?'700':'400',
        onClick:()=>this.setClickProfile(p.id) }; }),
      pitchSegs: (()=>{ const v=(this.cfg.pitch==null?1:this.cfg.pitch), min=0.6, step=0.1, n=10, cur=Math.round((v-min)/step); const a=[]; for(let i=0;i<=n;i++){ a.push({ ch: i<=cur?'\u2588':'\u2591', onClick:()=>this.setPitch(min+i*step) }); } return a; })(),
      clickSegs: (()=>{ const v=(this.cfg.click==null?0.6:this.cfg.click), min=0, step=0.1, n=10, cur=Math.round((v-min)/step); const a=[]; for(let i=0;i<=n;i++){ a.push({ ch: i<=cur?'\u2588':'\u2591', onClick:()=>this.setClick(min+i*step) }); } return a; })(),
      pitchLabel: (this.cfg.pitch==null?1:this.cfg.pitch).toFixed(2)+'\u00d7',
      clickLabel: Math.round((this.cfg.click==null?0.6:this.cfg.click)*100)+'%',
      mPitchSegs: (()=>{ const v=(this.cfg.mousePitch==null?1:this.cfg.mousePitch), min=0.6, step=0.1, n=10, cur=Math.round((v-min)/step); const a=[]; for(let i=0;i<=n;i++){ a.push({ ch: i<=cur?'\u2588':'\u2591', onClick:()=>this.setMousePitch(min+i*step) }); } return a; })(),
      mClickSegs: (()=>{ const v=(this.cfg.mouseClick==null?0.6:this.cfg.mouseClick), min=0, step=0.1, n=10, cur=Math.round((v-min)/step); const a=[]; for(let i=0;i<=n;i++){ a.push({ ch: i<=cur?'\u2588':'\u2591', onClick:()=>this.setMouseClick(min+i*step) }); } return a; })(),
      mPitchLabel: (this.cfg.mousePitch==null?1:this.cfg.mousePitch).toFixed(2)+'\u00d7',
      mClickLabel: Math.round((this.cfg.mouseClick==null?0.6:this.cfg.mouseClick)*100)+'%',
      // drag-slider handlers for the jumper bars (min/max match the seg ranges)
      pitchBar:  this._mkSlider((v,p)=>this.setPitch(v,p),      0.6, 1.6),
      clickBar:  this._mkSlider((v,p)=>this.setClick(v,p),      0,   1),
      mPitchBar: this._mkSlider((v,p)=>this.setMousePitch(v,p), 0.6, 1.6),
      mClickBar: this._mkSlider((v,p)=>this.setMouseClick(v,p), 0,   1),
      kbAdv: !!this.state.kbAdv, mouseAdv: !!this.state.mouseAdv,
      kbAdvCaret: this.state.kbAdv?'\u25be':'\u25b8', mouseAdvCaret: this.state.mouseAdv?'\u25be':'\u25b8',
      kbAdvToggle: ()=>this.setState(s=>({ kbAdv:!s.kbAdv })),
      mouseAdvToggle: ()=>this.setState(s=>({ mouseAdv:!s.mouseAdv })),
    };
  }
}

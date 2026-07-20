// =====================================================================
//  Engine.js - the ROHAN-DOS application logic.
//
//  Ported verbatim from the original single-file app's logic class. The only
//  changes vs. the original are the store plumbing at the top (subscribe /
//  setState / forceUpdate / _emit) which replaces the dc-runtime base class;
//  every method below is unchanged behaviour. React drives it via
//  useSyncExternalStore + effects that call componentDidMount / DidUpdate /
//  WillUnmount. It reads window.PORTFOLIO / window.VIZ / window.CPU6502.
//
//  MAP OF THIS FILE (search for the section banners):
//    constructor            content tree, menus, boot script, initial state
//    CLI helpers            history recall + tab completion
//    persisted config       cfg defaults, themes, screensaver settings, sliders
//    keyboard / mouse sound WebAudio synth (keyClick, clickSound, boot ticks)
//    user filesystem        MY-FILES: nested dirs/files in localStorage
//    mail                   CLI composer, vim composer, contact.php delivery
//    editor                 vim modes, motions, operators, :commands
//    find/grep/wc helpers   whole-tree file search
//    man pages              documentation for  man <cmd>  /  help <cmd>
//    deep links             URL-hash <-> panel navigation
//    pipes + runCommand     the command parser (every CLI/GUI command)
//    items/activate         file-panel navigation
//    6502 VM                GUI transport + text-mode monitor (cliVm)
//    lifecycle              componentDidMount / boot / unmount
//    renderVals             the one big `vals` object every component reads
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
    this.profile = P.profile || {};
    // One source of truth for links and the version banner (from content.js),
    // with fallbacks so the app still runs if the profile is trimmed down.
    this.links = Object.assign(
      { email:'rohanplante@gmail.com', github:'https://github.com/RPlante28', linkedin:'https://linkedin.com/in/rohan-plante' },
      this.profile.links || {});
    this.build = Object.assign(
      { os:'ROHAN-DOS', version:'5.51', released:'JUN 2026', year:'MMXXVI', org:'Plante Systems', edition:'Computer Science Edition' },
      this.profile.build || {});
    this.verLine = this.build.os+' '+this.build.version;   // "ROHAN-DOS 5.51"
    // flat list of every skill tag (from the SKILLS folder) for the WHOAMI card
    { const sd=(this.root.children||[]).find(c=>c.name==='SKILLS'); this.homeSkills = sd ? (sd.children||[]).reduce((a,c)=>a.concat((c.doc&&c.doc.tags)||[]),[]) : []; }
    // live counts for the WHOAMI footer, so they never drift from the content
    { const dirs=(this.root.children||[]).filter(c=>c.kind==='dir').length;
      const pf=this.flatten(this.root).find(x=>x.name==='PROJECTS' && x.kind==='dir');
      const projects=pf ? this.flatten(pf).filter(x=>x.kind==='file').length : 0;
      this.homeStats = { dirs, projects }; }

    this.helloArt = [
      " +-----------------------------+",
      " |                             |",
      " |   > say hello, world_       |",
      " |     to rohan  :)            |",
      " |                             |",
      " +-----------------------------+",
    ].join("\n");

    this.goRoot = ()=>{ this.setState({ stack:[this.root], sel:0, activeMenu:null, cmdMsg:'', editing:null }); };
    // activate the idle screensaver in a given mode; _saverAt guards the launching
    // key/click from instantly dismissing it (that same event bubbles to window).
    // manual = launched from a command; those exit only on key or click, not a
    // stray mouse move (you just typed the command, your hand is on the mouse).
    this._startSaver = (mode, manual)=>{ this._saverAt=Date.now(); this._saverManual=!!manual; this.setState({ saver:true, saverMode:mode }); };
    this.cfg = this._loadCfg();
    this._eggs = this._loadEggs();
    this._cmdHistory = this._loadHistory();
    // user filesystem (nested, persisted)
    this.userRoot = { name:'MY-FILES', kind:'dir', home:true, user:true, size:'\u25b6SUB-DIR\u25c4', date:'06.25.26', children:this._loadFS() };
    this._tagUser(this.userRoot);
    const myIdx=this.root.children.findIndex(c=>c.home);
    if(myIdx>=0) this.root.children[myIdx]=this.userRoot;
    this.homeDir = this.userRoot;
    this.vmPage = 0x00;       // which memory page the VM dump shows
    this.vmProgKey = 'HELLO'; // currently selected sample/user program
    this.vmSpeed = 3;         // index into vmSpeeds() - default 5 Hz (visible)
    this._vizGens = this._mkVizGens();
    this._vizRefCb = (el)=>{ this._vizEl = el; if(el){ if(this._pendingViz){ const t=this._pendingViz; this._pendingViz=null; this._startViz(t); } } else { this._stopViz(); } };
    this.state = { stack:[this.root], sel:0, activeMenu:null, sortKey:null, cmdMsg:'', dialog:null, booting:true, bootText:'', sent:false, cliMode:false, editing:null, edMode:'insert', edModeV:'normal', term:[], mailFlow:null };
    this.bootScript = [
      this.build.os+' BIOS v'+this.build.version+'  (C) '+this.build.year+' '+this.build.org,
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
        { label:'head / tail / stat   peek at a file', cmd:true },
        { label:'touch / mkdir / rm   manage MY-FILES', cmd:true },
        { label:'find / grep / wc     search files', cmd:true },
        { label:'6502         launch the CPU VM', cmd:true },
        { label:'viz          analytics dashboards', cmd:true },
        { label:'mail · resume · go <github|linkedin>', cmd:true },
        { label:'cli / gui    toggle CLI mode  ( clear )', cmd:true },
        { label:'sysinfo · man <cmd> · help · config · about', cmd:true },
      ]},
      { id:'options', label:'Options', items:[
        { label:'Help & shortcuts\u2026   (F1)', act:()=>this.openHelp() },
        { label:'Configuration\u2026', act:()=>this.setState({ dialog:'config', activeMenu:null }) },
        { label:'CLI-only mode        (O)', act:()=>this.toggleCli() },
        { label:'About this site\u2026', act:()=>this.setState({ dialog:'about', activeMenu:null }) },
        { label:'\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', sep:true },
        { label:'GitHub  \u2192 RPlante28', act:()=>window.open(this.links.github,'_blank') },
        { label:'LinkedIn \u2192 rohan-plante', act:()=>window.open(this.links.linkedin,'_blank') },
        { label:'E-mail  \u2192 '+this.links.email, act:()=>window.open('mailto:'+this.links.email) },
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

  toggleCfg(k){ this.cfg[k]=!this.cfg[k]; this._saveCfg(); if(k==='hidden' && this.cfg[k]) this._egg('hidden'); this.forceUpdate(); }
  // mobile: how much of the stacked-panel area the file browser takes (percent).
  // A draggable grip + quick buttons let you collapse it or make it full-screen.
  setNavPct(p){ this.setState({ navPct: Math.max(12, Math.min(88, Math.round(p))) }); }
  _navGripHandlers(){
    if(this.__navGrip) return this.__navGrip;
    this.__navGrip = {
      down:(e)=>{ this._navDrag=true; this._navCont=e.currentTarget.parentNode; try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){ } if(e.preventDefault) e.preventDefault(); },
      move:(e)=>{ if(!this._navDrag||!this._navCont) return; const r=this._navCont.getBoundingClientRect(); if(!r.height) return; this.setNavPct((r.bottom-(e.clientY||0))/r.height*100); },
      up:()=>{ this._navDrag=false; },
    };
    return this.__navGrip;
  }
  resetCfg(){ this.cfg = this._cfgDefaults(); this._saveCfg(); this.forceUpdate(); }
  // ----- CLI helpers: command-history recall + tab completion -----
  // NOTE: undocumented "secrets" commands (matrix, pipes, starfield, logo, sl,
  // cowsay, fortune, boss, sudo, xyzzy, …) are deliberately kept OUT of this
  // list so they never surface via Tab-completion or `help`. They live only in
  // the `secrets` ledger once discovered.
  _commandNames(){ return ['cd','ls','dir','tree','open','cat','edit','vim','make','touch','mkdir','rm','rename','cp','find','grep','wc','head','tail','stat','echo','pwd','history','clear','6502','viz','mail','resume','go','copy','sysinfo','neofetch','man','theme','cli','gui','config','about','help','whoami','date','ver','bc','ps','top','sound','screensaver']; }
  // only complete against what's in the CURRENT directory (what's actually available)
  _completionNames(){
    const set=new Set();
    (this.items()||[]).forEach(it=>{ if(it.name && it.kind!=='updir') set.add(it.name.replace(/\s+/g,'')); });
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
  _cfgDefaults(){ return { hidden:false, ins:true, autodir:true, automenu:false, mini:true, crt:false, crtIntensity:0.22, keysound:true, soundProfile:'thock', pitch:1.0, click:0.6, bootSound:true, clickProfile:'tick', mousePitch:1.0, mouseClick:0.6, theme:'blue', motion:'auto', saver:this._saverDefaults() }; }
  _saverDefaults(){ return {
    enabled:true, timeout:60,
    modes:{ logo:true, stars:true, matrix:true, pipes:true },
    speed:{ logo:1, stars:1, matrix:1, pipes:1 },       // per-mode multiplier
    matrixColor:'green',                                 // green|amber|cyan|rainbow
    starColor:'white',                                   // white|cyan|amber|green|rainbow
    stars:{ shooting:true },
    pipes:{ busy:'normal' }                              // busy: how many pipes grow at once
  }; }
  // ----- monitor phosphor theme (blue default, or amber / green / white) -----
  setTheme(name){ this.cfg.theme=name; this._saveCfg(); this._applyTheme(); this.forceUpdate(); }
  _applyTheme(){
    const t=this.cfg.theme||'blue';
    try{
      document.documentElement.setAttribute('data-theme', t);
      if(this._tint){ const bg={ amber:'#ffb400', green:'#3bff70' }[t]||''; this._tint.style.background=bg; this._tint.style.display=bg?'block':'none'; }
    }catch(e){}
  }
  _loadCfg(){ const d=this._cfgDefaults(); try{ const r=localStorage.getItem('rohanCfg'); if(r){ const o=JSON.parse(r); if(o&&typeof o==='object'){ const sv=o.saver; const merged=Object.assign(d, o); // deep-merge the nested saver object so new keys keep their defaults
        merged.saver=Object.assign({}, d.saver, sv||{}, { modes:Object.assign({}, d.saver.modes, (sv&&sv.modes)||{}), speed:Object.assign({}, d.saver.speed, (sv&&sv.speed)||{}), stars:Object.assign({}, d.saver.stars, (sv&&sv.stars)||{}), pipes:Object.assign({}, d.saver.pipes, (sv&&sv.pipes)||{}) }); return merged; } } }catch(e){} return d; }
  // ----- screensaver configuration -----
  setMotion(m){ this.cfg.motion=m; this._saveCfg(); if(m==='reduced' && this.state.saver) this.setState({ saver:false }); this.forceUpdate(); }
  toggleSaver(){ this.cfg.saver.enabled=!this.cfg.saver.enabled; if(!this.cfg.saver.enabled && this.state.saver) this.setState({ saver:false }); this._saveCfg(); this.forceUpdate(); }
  setSaverTimeout(sec){ this.cfg.saver.timeout=Math.max(10, Math.min(1800, Math.round(sec))); this._saveCfg(); this.forceUpdate(); }
  toggleSaverMode(k){ const m=this.cfg.saver.modes; m[k]=!m[k]; this._saveCfg(); this.forceUpdate(); }
  setSaverSpeed(k, v){ this.cfg.saver.speed[k]=v; this._saveCfg(); this.forceUpdate(); }
  setMatrixColor(c){ this.cfg.saver.matrixColor=c; this._saveCfg(); this.forceUpdate(); }
  setStarColor(c){ this.cfg.saver.starColor=c; this._saveCfg(); this.forceUpdate(); }
  setPipeOpt(k, v){ this.cfg.saver.pipes[k]=v; this._saveCfg(); this.forceUpdate(); }
  toggleStarOpt(k){ const s=this.cfg.saver.stars; s[k]=!s[k]; this._saveCfg(); this.forceUpdate(); }
  _enabledSaverModes(){ const m=this.cfg.saver.modes||{}; return Object.keys(m).filter(k=>m[k]); }
  _speedLabel(v){ if(v<=0.4) return 'slowest'; if(v<=0.7) return 'slow'; if(v<1.2) return 'normal'; if(v<1.8) return 'fast'; return 'fastest'; }
  _timeoutLabel(s){ return s<60 ? (s+'s') : (s%60===0 ? (s/60+'m') : (Math.floor(s/60)+'m '+(s%60)+'s')); }
  // the classic sl(1) gag: you typed  sl  instead of  ls
  _slArt(){ return [
    '      ====        ________                ___________',
    '  _D _|  |_______/        \\__I_I_____===__|_________|',
    '   |(_)---  |   H\\________/ |   |        =|___ ___|',
    '   /     |  |   H  |  |     |   |         ||_| |_||',
    '  |      |  |   H  |__--------------------| [___] |',
    '  | ________|___H__/__|_____/[][]~\\_______|       |',
    '  |/ |   |-----------I_____I [][] []  D   |=======|__',
    '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
    ' |/-=|___|=    ||    ||    ||    |_____/~\\___/',
    '  \\_/      \\O=====O=====O=====O_/      \\_/',
    '',
    'woo woo!  (you typed  sl  - did you mean  ls ?)' ]; }
  // a themed fake process table for  ps / top
  _psList(full){
    const procs=[
      ['1','0.0','0.4','init'],
      ['7','0.3','1.2','command.com'],
      ['19','1.1','3.4','nc-shell'],
      ['42','0.9','2.6','render-engine'],
      ['55','0.4','1.1','crt-overlay'],
      ['66','0.6','2.8','viz-engine'],
      ['88','0.1','0.8','hit-counter'],
      ['101','0.0','0.5','boot-sound'],
      ['128','13.7','9.9','6502-vm'],
      ['200','0.0','0.3',(this.state.saver?'screensaver':'screensaver (idle)')],
    ];
    const rows=[];
    if(full){ rows.push('ROHAN-DOS - top - load average 0.42, 0.31, 0.19',
      'Tasks: '+procs.length+' total, 1 running, '+(procs.length-1)+' sleeping',
      'CPU: MOS 6502 @ 1.79 MHz    Mem: 640K total, 512K used, 128K free', ''); }
    rows.push('  PID  %CPU  %MEM  COMMAND');
    procs.forEach(p=>rows.push(' '+p[0].padStart(4)+'  '+p[1].padStart(4)+'  '+p[2].padStart(4)+'  '+p[3]));
    return rows;
  }
  _saveCfg(){ try{ localStorage.setItem('rohanCfg', JSON.stringify(this.cfg)); }catch(e){} }
  // ----- undocumented-feature ledger (the "secrets" hunt) -----
  // Every entry here is UNDOCUMENTED on purpose: none of these appear in `help`
  // or in tab-completion. `reveal` is shown once found (and doubles as its own
  // how-to); `clue` is a terse pointer shown until then.
  _eggCatalog(){ return [
    { id:'hidden', reveal:'hidden files      Config (F5) › Show hidden files',   clue:'the file browser hides its dotfiles.' },
    { id:'matrix', reveal:'matrix            also: pipes, starfield, logo',        clue:'some rain is not wet.' },
    { id:'ascii',  reveal:'cowsay / fortune  also: sl, coffee',                    clue:'make the machine talk.' },
    { id:'boss',   reveal:'boss              blank the screen, fast',              clue:'someone is coming.' },
    { id:'sudo',   reveal:'sudo <cmd>        you are not root',                    clue:'try to pull rank.' },
    { id:'xyzzy',  reveal:'xyzzy             (nothing happens)',                   clue:'a hollow voice, from Colossal Cave.' },
  ]; }
  _loadEggs(){ try{ const r=localStorage.getItem('rohanEggs'); const o=r?JSON.parse(r):null; return (o&&typeof o==='object')?o:{}; }catch(e){ return {}; } }
  _saveEggs(){ try{ localStorage.setItem('rohanEggs', JSON.stringify(this._eggs||{})); }catch(e){} }
  _egg(id){
    if(!this._eggs) this._eggs=this._loadEggs();
    if(this._eggs[id]) return;                 // already logged
    this._eggs[id]=1; this._saveEggs();
    const n=Object.keys(this._eggs).length, total=this._eggCatalog().length;
    const msg='✦ logged an undocumented feature  ('+n+'/'+total+')  ·  type  secrets';
    if(this.state.cliMode) this.print(['', msg, '']); else this.setState({ cmdMsg:msg });
  }
  _secretsPanel(){
    if(!this._eggs) this._eggs=this._loadEggs();
    const cat=this._eggCatalog();
    const started=!!this._eggs.hidden || Object.keys(this._eggs).length>0;
    if(!started){ return ['secrets: nothing logged yet.', '(the file browser keeps hidden files. try Configuration, F5.)']; }
    const found=cat.filter(e=>this._eggs[e.id]).length;
    const rule='─'.repeat(58);
    const lines=['SECRETS.SYS  ·  undocumented features  ·  found '+found+' of '+cat.length, rule];
    cat.forEach(e=>{ lines.push(this._eggs[e.id] ? ('[x] '+e.reveal) : ('[ ] '+('·'.repeat(16))+'  '+e.clue)); });
    lines.push(rule);
    if(found>=cat.length){
      lines.push('all features found. nothing else is hidden — you read the whole machine.',
        '', 'more of my work lives at  github.com/RPlante28');
    } else {
      lines.push('keep poking. every entry above is a real command or switch.');
    }
    return lines;
  }
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
      // pointer events so mouse and touch both work; capture keeps the drag
      // tracking even when the finger slides off the thin bar
      down:(e)=>{ this._sliding=true; try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){ } if(e.preventDefault) e.preventDefault(); apply(e, false); },
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
  say(msg){ if(this._capture){ if(msg) this._capture.push(msg); return; } if(this.state.cliMode && msg){ this.setState(s=>({ cmdMsg:msg, term:s.term.concat([msg]) })); } else { this.setState({ cmdMsg:msg }); } }

  // ----- user filesystem (nested, localStorage) -----
  // today as a DOS-style MM.DD.YY stamp (used for created/saved user files)
  _today(){ const d=new Date(); const p=(n)=>String(n).padStart(2,'0'); return p(d.getMonth()+1)+'.'+p(d.getDate())+'.'+p(d.getFullYear()%100); }
  _loadFS(){
    try{
      const r=localStorage.getItem('rohanFS');
      if(r){ const o=JSON.parse(r); if(o&&Array.isArray(o.children)) return o.children; }
      const old=localStorage.getItem('rohanUserFiles');
      if(old){ const a=JSON.parse(old); if(Array.isArray(a)) return a.map(f=>({ name:f.name, kind:'file', body:f.body||'', date:f.date||this._today() })); }
    }catch(e){}
    return [];
  }
  _saveFS(){ try{ localStorage.setItem('rohanFS', JSON.stringify({ children:this.userRoot.children })); }catch(e){} }
  _tagUser(node){ (node.children||[]).forEach(c=>{ c.user=true; if(c.kind==='dir'){ c.size='\u25b6SUB-DIR\u25c4'; if(!c.children) c.children=[]; this._tagUser(c); } else { if(c.body===undefined) c.body=''; } }); }
  curUserDir(){ const c=this.cur(); return c.user ? c : this.userRoot; }
  findInDir(dir, name){ const n=name.replace(/\s+/g,'').toLowerCase(); return (dir.children||[]).find(x=>x.name.replace(/\s+/g,'').toLowerCase()===n); }
  findUserFile(name){ const n=name.replace(/\s+/g,'').toLowerCase(); let hit=null; const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.kind==='file' && c.name.replace(/\s+/g,'').toLowerCase().indexOf(n)>=0 && !hit) hit=c; if(c.kind==='dir') walk(c); }); }; walk(this.userRoot); return hit; }
  mkdirIn(name){ const dir=this.curUserDir(); name=(name||'').trim().toUpperCase(); if(!name) return null; if(this.findInDir(dir,name)) return this.findInDir(dir,name); const node={ name, kind:'dir', user:true, size:'\u25b6SUB-DIR\u25c4', date:this._today(), children:[] }; dir.children.push(node); this._saveFS(); return node; }
  makeFile(name){ const dir=this.curUserDir(); name=(name||'').trim(); if(!name) return null; if(!/\./.test(name)) name+='.txt'; name=name.toUpperCase(); let f=this.findInDir(dir,name); if(!f){ f={ name, kind:'file', user:true, body:'', date:this._today() }; dir.children.push(f); this._saveFS(); } return f; }
  // create a NEW file that is NOT committed to disk until :w  (so :q on a brand-new file discards it)
  makeFileProvisional(name){ const dir=this.curUserDir(); name=(name||'').trim(); if(!name) return null; if(!/\./.test(name)) name+='.txt'; name=name.toUpperCase(); let f=this.findInDir(dir,name); if(f) return f; f={ name, kind:'file', user:true, body:'', date:this._today(), _provisional:true }; dir.children.push(f); return f; }
  deleteUser(name){ const dir=this.curUserDir(); const f=this.findInDir(dir,name); if(!f){ const g=this.findUserFile(name); if(!g) return false; this._removeNode(this.userRoot,g); this._saveFS(); return true; } dir.children=dir.children.filter(x=>x!==f); this._saveFS(); return true; }
  _removeNode(parent, node){ if(!parent.children) return false; const i=parent.children.indexOf(node); if(i>=0){ parent.children.splice(i,1); return true; } return parent.children.some(c=>c.kind==='dir'&&this._removeNode(c,node)); }

  // ----- terminal scrollback -----
  print(lines){ const arr=Array.isArray(lines)?lines:[lines]; if(this._capture){ arr.forEach(l=>this._capture.push(l)); return; } this.setState(s=>({ term:s.term.concat(arr) })); }
  echo(cmd){ this.setState(s=>({ term:s.term.concat([ this._promptStr()+'> '+cmd ]) })); }
  _promptStr(){ return this.state.stack.map((n,i)=> i===0 ? n.path : n.name).join('\\'); }
  out(lines){ const a=Array.isArray(lines)?lines:[lines]; if(this._capture){ a.forEach(l=>this._capture.push(l)); return; } if(this.state.cliMode) this.print(a); else this.say(a.join('   ')); }
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
      row(' to     : '+this.links.email),
      row(' from   : '+(data.name||'?')+'  <'+(data.email||'?')+'>'),
      row(' subject: '+(data.subject||'(none)')),
      row(' '),
    ].concat((data.message||'').split('\n').map(l=>row(' '+l))).concat([
      bar, ''
    ]));
    this._postMail(data).then(res=>{
      this.print([ res&&res.ok ? '  ✓ delivered - Rohan will write back soon.'
        : '  ✗ could not send - e-mail '+this.links.email+' directly.', '']);
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
      if(o.tags&&o.tags.length) lines.push('', 'tags: '+o.tags.join(', '));
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
    if(node){ node.body=body; node.date=this._today(); if(node._provisional) delete node._provisional; this._saveFS(); }
    const bytes=body.length;
    this.setState(s=>({ editing:{...s.editing, body, ref:node}, edStatus:'"'+ed.name+'" '+bytes+'B written' }));
    return true;
  }
  edToNormal(){ this.setState({ edModeV:'normal' }); setTimeout(()=>{ if(this._ed) this._ed.focus(); this._syncEdCursor(); }, 10); }
  edToCommand(){ this.setState({ edModeV:'command' }); setTimeout(()=>{ if(this._edcmd) this._edcmd.focus(); this._syncEdCursor(); }, 10); }
  // line:col cursor readout for the vim status bar
  _edCaret(){ const ta=this._ed; if(!ta) return; const pos=ta.selectionStart||0; const before=ta.value.slice(0,pos); const line=before.split('\n').length; const col=pos-before.lastIndexOf('\n'); this.setState({ edCursor: line+':'+col }); this._moveEdCursor(); }
  _syncEdCursor(){ requestAnimationFrame(()=>this._moveEdCursor()); }
  // exact monospace advance width for the editor font (measured + cached per font)
  _measureCharW(cs){
    const key=cs.fontSize+'|'+cs.fontFamily+'|'+cs.fontWeight+'|'+cs.letterSpacing;
    if(this._cwCache && this._cwCache.key===key) return this._cwCache.w;
    let w=(parseFloat(cs.fontSize)||13.5)*0.6;
    try{
      const s=document.createElement('span');
      s.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;font-family:'+cs.fontFamily+';font-size:'+cs.fontSize+';font-weight:'+cs.fontWeight+';letter-spacing:'+cs.letterSpacing;
      s.textContent='0000000000000000000000000000';   // 28 chars
      document.body.appendChild(s);
      const m=s.getBoundingClientRect().width/28; if(m>0) w=m;
      document.body.removeChild(s);
    }catch(e){}
    this._cwCache={ key, w };
    return w;
  }
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
    const chW=this._measureCharW(cs);                  // exact glyph advance for this font/size
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
      'To:      '+this.links.email,
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
    // [ \t]* (not \s*) so an empty header line stays empty instead of the
    // match spilling onto the next line of the template
    const get=(label)=>{ const m=text.match(new RegExp('^'+label+':[ \\t]*(.*)$','im')); return m?m[1].trim():''; };
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
        row(' to     : '+this.links.email),
        row(' from   : '+(from||'(anonymous)')),
        row(' subject: '+(subject||'(no subject)')),
        row(' size   : '+body.length+' bytes'),
        bar, '']);
    }
    this._postMail({ name, email, subject, message:body }).then(res=>{
      const ok=res&&res.ok;
      if(this.state.cliMode) this.print([ ok ? '  ✓ delivered - Rohan will write back soon.'
        : '  ✗ could not send - e-mail '+this.links.email+' directly.', '']);
      if(this.state.dialog==='mailsent') this.setState({ mailSent:Object.assign({}, this.state.mailSent, { ok, done:true }) });
    });
  }
  edToInsert(after){
    if(this.state.editing && this.state.editing.ro){ this.setState({ edStatus:"E21: '"+this.state.editing.name+"' is read-only (press :q to leave)" }); return; }
    this.setState({ edModeV:'insert' });
    const ta=this._ed; if(!ta) return;
    setTimeout(()=>{ ta.focus(); if(typeof after==='number'){ ta.setSelectionRange(after,after); } this._syncEdCursor(); }, 10);
  }
  // ================= vim editor internals: motions, operators, counts =================
  _pushUndo(){ const ta=this._ed; if(!ta) return; if(!this._vimUndo) this._vimUndo=[]; this._vimUndo.push({ v:ta.value, p:ta.selectionStart||0 }); if(this._vimUndo.length>200) this._vimUndo.shift(); }
  _vimUndoPop(){ const ta=this._ed; if(!ta||!this._vimUndo||!this._vimUndo.length){ this.setState({ edStatus:'Already at oldest change' }); return; } const s=this._vimUndo.pop(); ta.value=s.v; const c=Math.min(s.p,s.v.length); ta.setSelectionRange(c,c); this._dirtyVim(); this._syncEdCursor(); }
  _firstNonBlank(v,ls,le){ let i=ls; while(i<le && (v[i]===' '||v[i]==='\t')) i++; return i; }
  _vcls(c){ return c===undefined?0:(/\s/.test(c)?0:(/\w/.test(c)?1:2)); }
  _vimWordFwd(v,p){ const n=v.length; let i=p; const c0=this._vcls(v[i]); if(c0!==0){ while(i<n && this._vcls(v[i])===c0) i++; } while(i<n && /\s/.test(v[i])) i++; return Math.min(i,n); }
  _vimWordEnd(v,p){ const n=v.length; let i=p+1; while(i<n && /\s/.test(v[i])) i++; if(i>=n) return Math.max(p,n-1); const c=this._vcls(v[i]); while(i+1<n && this._vcls(v[i+1])===c) i++; return i; }
  _vimWordBack(v,p){ let i=p-1; while(i>0 && /\s/.test(v[i])) i--; if(i<=0) return 0; const c=this._vcls(v[i]); while(i>0 && this._vcls(v[i-1])===c) i--; return Math.max(0,i); }
  _lineIndexAt(v,p){ return v.slice(0,p).split('\n').length-1; }
  _lineStartOf(v,idx){ const lines=v.split('\n'); let s=0; for(let i=0;i<idx && i<lines.length;i++) s+=lines[i].length+1; return s; }
  _vimGotoLine(v,ln){ const lines=v.split('\n'); const li=Math.max(0,Math.min(lines.length-1,ln-1)); const s=this._lineStartOf(v,li); return this._firstNonBlank(v,s,s+lines[li].length); }
  _vimMotionPos(v,p,k,count){
    const N=Math.max(1,count||1);
    const ls=v.lastIndexOf('\n',p-1)+1, le=(v.indexOf('\n',p)===-1?v.length:v.indexOf('\n',p));
    if(k==='h') return Math.max(ls,p-N);
    if(k==='l'||k===' ') return Math.min(le,p+N);
    if(k==='0') return ls;
    if(k==='^') return this._firstNonBlank(v,ls,le);
    if(k==='$'){ let cur=le; for(let i=1;i<N && cur<v.length;i++){ const ns=cur+1; cur=(v.indexOf('\n',ns)===-1?v.length:v.indexOf('\n',ns)); } return cur; }
    if(k==='w'){ let q=p; for(let i=0;i<N;i++) q=this._vimWordFwd(v,q); return q; }
    if(k==='e'){ let q=p; for(let i=0;i<N;i++) q=this._vimWordEnd(v,q); return q; }
    if(k==='b'){ let q=p; for(let i=0;i<N;i++) q=this._vimWordBack(v,q); return q; }
    if(k==='j'||k==='k'){ const col=p-ls; let q=p; for(let i=0;i<N;i++){ const qls=v.lastIndexOf('\n',q-1)+1, qle=(v.indexOf('\n',q)===-1?v.length:v.indexOf('\n',q)); if(k==='j'){ if(qle>=v.length) break; const ns=qle+1, ne=(v.indexOf('\n',ns)===-1?v.length:v.indexOf('\n',ns)); q=Math.min(ns+col,ne); } else { if(qls===0) break; const ps=v.lastIndexOf('\n',qls-2)+1; q=Math.min(ps+col,qls-1); } } return q; }
    if(k==='G') return this._vimGotoLine(v, count? N : v.split('\n').length);
    return null;
  }
  _vimMotionRange(v,p,k,count){
    if(k==='j'||k==='k'||k==='G'){ const li=this._lineIndexAt(v,p), N=Math.max(1,count||1);
      if(k==='j') return { linewise:true, a:li, b:li+N };
      if(k==='k') return { linewise:true, a:li-N, b:li };
      return { linewise:true, a:li, b: count?(N-1):v.split('\n').length-1 }; }
    const inclusive=(k==='e'||k==='$');
    let t=this._vimMotionPos(v,p,k,count); if(t==null) return null;
    if(inclusive) t=Math.min(v.length,t+1);
    return (t>=p)?{ from:p, to:t, linewise:false }:{ from:t, to:p, linewise:false };
  }
  _vimOperate(op,range){
    const ta=this._ed, v=ta.value; if(!range) return;
    let from=Math.max(0,range.from), to=Math.min(v.length,range.to);
    if(to<=from){ if(op==='c'){ this.edToInsert(from); } return; }
    this._vimReg={ text:v.slice(from,to), linewise:false };
    if(op==='y'){ ta.setSelectionRange(from,from); this.setState({ edStatus:(to-from)+' chars yanked' }); this._syncEdCursor(); return; }
    this._pushUndo();
    ta.value=v.slice(0,from)+v.slice(to);
    if(op==='c'){ this.edToInsert(from); }
    else { const c=Math.min(from,ta.value.length); ta.setSelectionRange(c,c); this._dirtyVim(); this._syncEdCursor(); }
  }
  _vimLinesOp(op,a,b){
    const ta=this._ed, v=ta.value; const lines=v.split('\n');
    if(a>b){ const t=a; a=b; b=t; }
    a=Math.max(0,a); b=Math.min(lines.length-1,b);
    this._vimReg={ text:lines.slice(a,b+1).join('\n')+'\n', linewise:true };
    if(op==='y'){ const s=this._lineStartOf(v,a); ta.setSelectionRange(s,s); this.setState({ edStatus:(b-a+1)+' line(s) yanked' }); this._syncEdCursor(); return; }
    this._pushUndo();
    const from=this._lineStartOf(v,a); const end=this._lineStartOf(v,b)+lines[b].length;
    if(op==='c'){ ta.value=v.slice(0,from)+v.slice(end); this.edToInsert(from); return; }
    let df=from, dt=end; if(dt<v.length) dt++; else if(df>0) df--;
    const rest=v.slice(0,df)+v.slice(dt); ta.value=rest;
    const np=Math.min(df,rest.length); const nls=rest.lastIndexOf('\n',np-1)+1, nle=(rest.indexOf('\n',np)===-1?rest.length:rest.indexOf('\n',np));
    const c=this._firstNonBlank(rest,nls,nle); ta.setSelectionRange(c,c); this._dirtyVim(); this._syncEdCursor();
  }
  _vimReplace(pend,ch){ const ta=this._ed, v=ta.value; const p=pend.pos; let end=p; for(let i=0;i<pend.n && end<v.length && v[end]!=='\n'; i++) end++; if(end>p){ this._pushUndo(); ta.value=v.slice(0,p)+ch.repeat(end-p)+v.slice(end); const c=Math.max(p,end-1); ta.setSelectionRange(c,c); this._dirtyVim(); this._syncEdCursor(); } }
  _vimPaste(after,N){
    const ta=this._ed, v=ta.value, p=ta.selectionStart; const reg=this._vimReg; if(!reg||!reg.text) return;
    this._pushUndo();
    let text=reg.text; if(N>1) text=reg.text.repeat(N);
    if(reg.linewise){
      const le=(v.indexOf('\n',p)===-1?v.length:v.indexOf('\n',p)); const ls=v.lastIndexOf('\n',p-1)+1;
      if(after){ if(le<v.length){ ta.value=v.slice(0,le+1)+text+v.slice(le+1); ta.setSelectionRange(le+1,le+1); } else { ta.value=v.slice(0,le)+'\n'+text.replace(/\n$/,'')+v.slice(le); ta.setSelectionRange(le+1,le+1); } }
      else { ta.value=v.slice(0,ls)+text+v.slice(ls); ta.setSelectionRange(ls,ls); }
    } else { const at=Math.min(v.length, after?p+1:p); ta.value=v.slice(0,at)+text+v.slice(at); const c=at+text.length-1; ta.setSelectionRange(c,c); }
    this._dirtyVim(); this._syncEdCursor();
  }
  _vimIndent(op,a,b){ const ta=this._ed, v=ta.value; const lines=v.split('\n'); if(a>b){ const t=a; a=b; b=t; } a=Math.max(0,a); b=Math.min(lines.length-1,b); this._pushUndo(); for(let i=a;i<=b;i++){ if(op==='>') lines[i]='  '+lines[i]; else lines[i]=lines[i].replace(/^( {1,2}|\t)/,''); } ta.value=lines.join('\n'); const pos=this._firstNonBlank(ta.value, this._lineStartOf(ta.value,a), this._lineStartOf(ta.value,a)+lines[a].length); ta.setSelectionRange(pos,pos); this._dirtyVim(); this._syncEdCursor(); }
  _vimShow(extra){ this.setState({ edPend:(this._vimCount||'')+(this._vimOp||'')+(extra||'') }); }
  vimKey(e){
    const mode=this.state.edModeV||'insert';
    const ta=this._ed; if(!ta) return;
    if(mode==='insert'){ if(e.key==='Escape'){ e.preventDefault(); this.edToNormal(); } return; }
    const k=e.key;
    if(k==='Shift'||k==='Control'||k==='Alt'||k==='Meta'||k==='CapsLock') return;
    const ro=this.state.editing && this.state.editing.ro;
    const done=()=>{ this._vimCount=''; this._vimOp=null; this._vimG=false; this._vimShow(); };
    // waiting for a replacement char (r)
    if(this._vimPending){ e.preventDefault(); const pend=this._vimPending; this._vimPending=null; if(k.length===1 && k!=='Escape') this._vimReplace(pend,k); done(); return; }
    // numeric count prefix (0 is a motion when the count is empty)
    if(/^[0-9]$/.test(k) && !(k==='0' && !this._vimCount)){ e.preventDefault(); this._vimCount=(this._vimCount||'')+k; this._vimShow(); return; }
    const count=this._vimCount?parseInt(this._vimCount,10):null;
    const N=Math.max(1,count||1);
    const v=ta.value, p=ta.selectionStart;
    const ls=v.lastIndexOf('\n',p-1)+1, le=(v.indexOf('\n',p)===-1?v.length:v.indexOf('\n',p));
    const li=this._lineIndexAt(v,p);
    const setSel=(n)=>{ const c=Math.max(0,Math.min(v.length,n)); ta.setSelectionRange(c,c); this._syncEdCursor(); };
    // second g of gg (also works as an operator motion: dgg / 5gg)
    if(this._vimG){ e.preventDefault(); this._vimG=false;
      if(k==='g'){ if(this._vimOp){ this._vimLinesOp(this._vimOp, count?(N-1):0, li); } else setSel(this._vimGotoLine(v, count?N:1)); }
      done(); return; }
    // operator pending (d / c / y already pressed)
    if(this._vimOp){ e.preventDefault(); const op=this._vimOp;
      if(k==='g'){ this._vimG=true; this._vimShow('g'); return; }
      if(op==='>'||op==='<'){ if(k===op){ this._vimIndent(op, li, li+N-1); } else { const r=this._vimMotionRange(v,p,k,count); if(r) this._vimIndent(op, r.linewise?r.a:li, r.linewise?r.b:li); } done(); return; }
      if((op==='d'&&k==='d')||(op==='c'&&k==='c')||(op==='y'&&k==='y')){ this._vimLinesOp(op, li, li+N-1); done(); return; }
      const range=this._vimMotionRange(v,p,k,count);
      if(range){ if(range.linewise) this._vimLinesOp(op, range.a, range.b); else this._vimOperate(op,range); }
      done(); return; }
    e.preventDefault();
    // operators wait for a motion
    if(k==='d'||k==='y'||k==='c'||k==='>'||k==='<'){ if(k!=='y'&&ro){ done(); return; } this._vimOp=k; this._vimShow(); return; }
    if(k==='g'){ this._vimG=true; this._vimShow('g'); return; }
    // one-shot edits
    if(k==='D'){ if(!ro) this._vimOperate('d',{from:p,to:le,linewise:false}); done(); return; }
    if(k==='C'){ if(!ro) this._vimOperate('c',{from:p,to:le,linewise:false}); done(); return; }
    if(k==='Y'){ this._vimLinesOp('y', li, li+N-1); done(); return; }
    if(k==='x'){ if(!ro){ let end=p; for(let i=0;i<N && end<v.length && v[end]!=='\n'; i++) end++; if(end>p){ this._vimReg={ text:v.slice(p,end), linewise:false }; this._pushUndo(); ta.value=v.slice(0,p)+v.slice(end); setSel(Math.min(p,ta.value.length)); this._dirtyVim(); } } done(); return; }
    if(k==='X'){ if(!ro){ let st=p; for(let i=0;i<N && st>ls; i++) st--; if(st<p){ this._pushUndo(); ta.value=v.slice(0,st)+v.slice(p); setSel(st); this._dirtyVim(); } } done(); return; }
    if(k==='r'){ if(!ro){ this._vimPending={ n:N, pos:p }; this._vimShow('r'); } else done(); return; }
    if(k==='~'){ if(!ro){ let s=''; let i=p; for(let c=0;c<N && i<v.length && v[i]!=='\n'; c++,i++){ const ch=v[i]; s+=(ch.toLowerCase()===ch?ch.toUpperCase():ch.toLowerCase()); } if(i>p){ this._pushUndo(); ta.value=v.slice(0,p)+s+v.slice(i); setSel(Math.min(i,ta.value.length)); this._dirtyVim(); } } done(); return; }
    if(k==='J'){ if(!ro){ this._pushUndo(); let val=v; const joins=Math.max(1,N-1); for(let j=0;j<joins;j++){ const e2=val.indexOf('\n',p); if(e2<0) break; let af=e2+1; while(val[af]===' '||val[af]==='\t') af++; val=val.slice(0,e2)+' '+val.slice(af); } ta.value=val; setSel(p); this._dirtyVim(); } done(); return; }
    if(k==='p'||k==='P'){ if(!ro) this._vimPaste(k==='p',N); done(); return; }
    if(k==='u'){ this._vimUndoPop(); done(); return; }
    // enter insert mode
    if(k==='i'){ if(!ro) this._pushUndo(); done(); this.edToInsert(p); return; }
    if(k==='a'){ if(!ro) this._pushUndo(); done(); this.edToInsert(Math.min(p+1,le)); return; }
    if(k==='A'){ if(!ro) this._pushUndo(); done(); this.edToInsert(le); return; }
    if(k==='I'){ if(!ro) this._pushUndo(); done(); this.edToInsert(this._firstNonBlank(v,ls,le)); return; }
    if(k==='s'){ if(!ro){ let end=p; for(let i=0;i<N && end<v.length && v[end]!=='\n'; i++) end++; this._pushUndo(); ta.value=v.slice(0,p)+v.slice(end); done(); this.edToInsert(p); } else done(); return; }
    if(k==='S'){ if(!ro) this._vimLinesOp('c', li, li+N-1); done(); return; }
    if(k==='o'){ if(ro){ done(); this.edToInsert(); return; } this._pushUndo(); ta.value=v.slice(0,le)+'\n'+v.slice(le); done(); this.edToInsert(le+1); return; }
    if(k==='O'){ if(ro){ done(); this.edToInsert(); return; } this._pushUndo(); ta.value=v.slice(0,ls)+'\n'+v.slice(ls); done(); this.edToInsert(ls); return; }
    if(k===':'){ done(); this.edToCommand(); return; }
    // plain motions
    const mv=this._vimMotionPos(v,p,k,count);
    if(mv!=null) setSel(mv);
    done();
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
    else if(/^\d+$/.test(c) || c==='$'){ const ta=this._ed; if(ta){ const ln=c==='$'?ta.value.split('\n').length:parseInt(c,10); const pos=this._vimGotoLine(ta.value,ln); ta.setSelectionRange(pos,pos); } this.edToNormal(); }
    else if((c==='%d'||c==='%d!'||c==='1,$d') && !(edm&&edm.ro)){ const ta=this._ed; if(ta){ this._pushUndo(); ta.value=''; ta.setSelectionRange(0,0); this._dirtyVim(); } this.edToNormal(); }
    else if(c==='help'){ this.setState({ edStatus:'motions h j k l w b e 0 ^ $ gg G  ·  ops d c y (+ dd cc yy)  ·  x r ~ p u  ·  counts e.g. 100dd  ·  :w :q :wq :N' }); this.edToNormal(); }
    else { this.setState({ edStatus:'E492: not an editor command: '+c }); this.edToNormal(); }
  }

  flatten(node, acc){ acc=acc||[]; (node.children||[]).forEach(c=>{ acc.push(c); if(c.children) this.flatten(c, acc); }); return acc; }
  // ----- shared helpers for find / grep / wc (search the WHOLE tree) -----
  // every file node anywhere (portfolio docs + your MY-FILES)
  _allFiles(){ const out=[]; const walk=(d)=>{ (d.children||[]).forEach(c=>{ if(c.kind==='file') out.push(c); if(c.kind==='dir') walk(c); }); }; walk(this.root); return out; }
  // the readable text of any node - exactly what `cat` shows (title/meta/bullets
  // for portfolio docs, the body for your files) - so grep/wc see real content
  _nodeText(node){ return (node && node.kind==='file') ? (this.bufferFor(node).body||'') : ''; }
  // resolve a scope (space-separated names and/or *.glob) to file nodes; empty = all
  _matchFiles(scope){
    const norm=s=>s.replace(/\s+/g,'').toLowerCase();
    const all=this._allFiles();
    if(!scope) return all;
    const picked=[];
    scope.split(/\s+/).filter(Boolean).forEach(tok=>{
      const p=norm(tok);
      if(/[*?]/.test(p)){ const rx=new RegExp('^'+p.replace(/[.]/g,'\\.').replace(/\*/g,'.*').replace(/\?/g,'.')+'$'); all.forEach(n=>{ if(rx.test(norm(n.name))) picked.push(n); }); }
      else { const hit=all.find(n=>norm(n.name)===p) || all.find(n=>norm(n.name).includes(p)); if(hit) picked.push(hit); }
    });
    return picked.filter((n,i)=>picked.indexOf(n)===i);
  }
  // command history persisted across visits
  _loadHistory(){ try{ const r=localStorage.getItem('rohanHist'); if(r){ const a=JSON.parse(r); if(Array.isArray(a)) return a.slice(-50); } }catch(e){} return []; }
  _saveHistory(){ try{ localStorage.setItem('rohanHist', JSON.stringify((this._cmdHistory||[]).slice(-50))); }catch(e){} }
  // man pages (also used by  help <cmd> )
  _manPages(){ return {
    'cd': { d:'change directory', s:'cd <dir> | cd .. | cd \\', l:['Descends into a subfolder of the current directory. cd .. goes up a level,','cd \\ returns to C:\\ROHAN.'] },
    'ls|dir': { d:'list directory', s:'ls', l:['Lists the files and folders in the current directory.'] },
    'tree': { d:'print the directory tree', s:'tree', l:['Prints the folder tree from the current directory downward.'] },
    'cat|open': { d:'show a file', s:'cat <file> | cat *.txt', l:['Prints a file. A glob reads every match in the current folder.'] },
    'find': { d:'find files by name', s:'find <name> | find *.ext', l:['Searches the whole tree and prints the full path of each match.'] },
    'grep': { d:'search inside files', s:'grep <term> [file|*.ext]', l:['Searches file contents across the whole tree - titles, text and tags.','Pass a file or glob to narrow the search.'] },
    'wc': { d:'word / line / char count', s:'wc <file> [file2 …]', l:['Counts lines, words and characters; prints a total across many files.'] },
    'head|tail': { d:'show the start / end of a file', s:'head <file> [n]', l:['Prints the first (head) or last (tail) n lines. Default n = 10.'] },
    'stat': { d:'file details', s:'stat <file>', l:['Shows a file’s type, size, line count and date.'] },
    'edit|vim': { d:'edit a file', s:'edit <file>', l:['Opens a vim-style editor. Your MY-FILES files save with :w, :q to quit.'] },
    'make|touch|mkdir': { d:'create files / folders', s:'make <name> | touch <name> | mkdir <name>', l:['Create files and folders under MY-FILES.'] },
    'echo': { d:'print text / write a file', s:'echo <text> [> file]', l:['Prints text, or writes it to a MY-FILES file with > (>> appends).'] },
    'rm|rename|cp': { d:'manage your files', s:'rm <name> | rename <a> <b> | cp <a> <b>', l:['Delete, rename or copy files in MY-FILES.'] },
    '6502': { d:'the 6502 CPU emulator', s:'6502 [help|list|run|step|speed|mem]', l:['Launches the scalar-pipeline 6502 VM. In CLI, 6502 help lists subcommands.'] },
    'mail': { d:'compose an email', s:'mail', l:['Opens the email composer; sends through the contact backend.'] },
    'go': { d:'open a link', s:'go <github|linkedin|marist>', l:['Opens an external link in a new tab.'] },
    'copy': { d:'copy to clipboard', s:'copy <email|github|linkedin|resume>', l:['Copies a contact detail to the clipboard.'] },
    'sysinfo|neofetch': { d:'system summary', s:'sysinfo', l:['Prints a neofetch-style summary of this machine.'] },
    'theme|color|monitor': { d:'monitor phosphor colour', s:'theme <blue|amber|green|white>', l:['Switches the display between the blue default and amber / green / white','phosphor. Also in Configuration.'] },
    'cli|gui': { d:'toggle CLI mode', s:'cli | gui', l:['Switches between the full-screen terminal and the file browser.'] },
    'clear|cls': { d:'clear the screen', s:'clear', l:['Clears the terminal scrollback.'] },
    'pwd': { d:'print working directory', s:'pwd', l:['Prints the full path of the current folder.'] },
    'history': { d:'command history', s:'history', l:['Lists your recent commands (also recalled with ↑ / ↓).'] },
    'whoami': { d:'who is this machine about', s:'whoami', l:['Prints the owner of this machine. See also  cat WHOAMI.TXT .'] },
    'date|time': { d:'current date & time', s:'date', l:['Prints the real date and time (the one thing here that is not 1986).'] },
    'ver|version': { d:'OS version', s:'ver', l:['Prints the ROHAN-DOS version banner.'] },
    'bc|calc': { d:'calculator', s:'bc <expression>', l:['Evaluates a math expression, e.g.  bc (2+3)*4  or  bc 2^10 .'] },
    'ps|top': { d:'process table', s:'ps | top', l:['Shows what this machine claims to be running.'] },
    'screensaver|matrix|pipes|starfield|logo': { d:'start a screensaver', s:'matrix | pipes | starfield | logo | screensaver', l:['Starts a screensaver now: matrix rain, pipes, a warp starfield, the','bouncing logo, or a random enabled one. Configure them in F5 · Screensaver.'] },
    'sound|keysound': { d:'keyboard sound on/off', s:'sound [on|off]', l:['Toggles the mechanical keyboard click. Fine-tune it in Configuration.'] },
    'config|setup|options': { d:'open Configuration', s:'config', l:['Opens the Configuration dialog (also F5): panels, display, sound, screensaver.'] },
    'resume|cv': { d:'open the resume', s:'resume', l:['Opens RESUME.PDF in a viewer window (also F4).'] },
    'viz': { d:'analytics dashboards', s:'viz', l:['Jumps to the DATA-ANL.LOG entry with the live Tableau dashboards.'] },
  }; }
  _manPage(name){
    const k=(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const M=this._manPages();
    const key=Object.keys(M).find(kk=>kk.split('|').includes(k));
    if(!key) return ['man: no manual entry for '+name+'   (try  help )'];
    const m=M[key];
    return ['NAME','  '+key.split('|')[0]+' - '+m.d, '', 'SYNOPSIS', '  '+m.s, '', 'DESCRIPTION'].concat(m.l.map(x=>'  '+x));
  }
  // ----- deep links: shareable URLs like  /#maristmaps  open that file -----
  _slugOf(name){ return (name||'').replace(/\s+/g,'').replace(/\.[a-z0-9]+$/i,'').toLowerCase(); }
  // reflect the folder you're in (plus the highlighted file) into the URL hash,
  // e.g.  #experience/projects/systems/cpu6502  - no browser-history spam
  _syncHash(){
    if(this.state.booting || typeof location==='undefined') return;
    const parts=this.state.stack.slice(1).map(n=>this._slugOf(n.name));   // folders you're inside
    const its=this.items(), sel=its[this.state.sel];
    if(sel && sel.kind==='file') parts.push(this._slugOf(sel.name));      // + the highlighted file
    const want = parts.length ? '#'+parts.join('/') : '';
    if((location.hash||'')!==want){ try{ history.replaceState(null, '', location.pathname+location.search+want); }catch(e){} }
  }
  // navigate to whatever the URL hash points at (on load, paste, back/forward).
  // Walks a slug path; also accepts a single bare slug (legacy / shorthand links).
  _applyHash(){
    if(typeof location==='undefined') return;
    const raw=decodeURIComponent((location.hash||'').replace(/^#/,'')).toLowerCase().trim();
    if(!raw) return;
    const segs=raw.split('/').filter(Boolean);
    let node=this.root; const stack=[this.root];
    for(let i=0;i<segs.length;i++){
      const seg=segs[i], kids=node.children||[];
      const dir=kids.find(c=>c.kind==='dir' && this._slugOf(c.name)===seg);
      if(dir){ node=dir; stack.push(dir); continue; }
      const file=kids.find(c=>c.kind==='file' && this._slugOf(c.name)===seg);
      if(file){ this.revealNode(file); return; }
      // segment not a child here: fall back to a global lookup (bare-slug links)
      const anyFile=this.flatten(this.root).find(n=>n.kind==='file' && this._slugOf(n.name)===seg);
      if(anyFile){ this.revealNode(anyFile); return; }
      const anyDir=this.flatten(this.root).find(n=>n.kind==='dir' && this._slugOf(n.name)===seg);
      if(anyDir){ const path=this._stackTo(anyDir); if(path){ this.setState({ stack:path.concat([anyDir]), sel:(anyDir.children&&anyDir.children.length)?1:0, activeMenu:null, editing:null, cmdMsg:'' }); } return; }
      return;
    }
    // resolved to a folder path: enter it
    this.setState({ stack, sel:(stack.length>1 && node.children && node.children.length)?1:0, activeMenu:null, editing:null, cmdMsg:'' });
  }
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

  // ----- real pipes:  stage0 generates lines, later stages filter them -----
  _runPipeline(stages){
    let buf=this._captureRun(stages[0]);
    for(let i=1;i<stages.length;i++) buf=this._applyFilter(stages[i], buf);
    this.print(buf.length?buf:['']);
  }
  // run one command with its output captured into an array instead of printed
  _captureRun(stageLine){
    const prev=this._capture; this._capture=[];
    try{ this.runCommand(stageLine, { silent:true }); }
    catch(e){ this._capture.push('pipe: '+(e&&e.message||e)); }
    const b=this._capture; this._capture=prev; return b;
  }
  // apply a stdin-aware filter stage (wc/grep/head/tail/sort/uniq/nl/rev/tac/cat)
  _applyFilter(stageLine, lines){
    const args=stageLine.split(/\s+/); const cmd=(args.shift()||'').toLowerCase();
    const flags=args.filter(a=>/^-/.test(a)), rest=args.filter(a=>!/^-/.test(a));
    const hasF=(ch)=>flags.some(f=>f.indexOf(ch)>=0);
    const getN=(def)=>{ let n=def; for(let i=0;i<args.length;i++){ const a=args[i]; if(/^-\d+$/.test(a)) n=parseInt(a.slice(1),10); else if(a==='-n'&&args[i+1]){ n=parseInt(args[i+1],10); i++; } else if(/^\d+$/.test(a)) n=parseInt(a,10); } return Math.max(0,n); };
    switch(cmd){
      case 'wc': {
        const L=lines.length, W=lines.reduce((n,l)=>n+(l.trim()?l.trim().split(/\s+/).length:0),0), C=lines.join('\n').length;
        if(hasF('l')) return [String(L)]; if(hasF('w')) return [String(W)]; if(hasF('c')) return [String(C)];
        return [String(L).padStart(6)+' '+String(W).padStart(6)+' '+String(C).padStart(7)];
      }
      case 'grep': {
        const inv=hasF('v'), ic=hasF('i'), nn=hasF('n'), ct=hasF('c'); const pat=rest.join(' ');
        const test=(l)=>ic?l.toLowerCase().includes(pat.toLowerCase()):l.includes(pat);
        const out=[]; lines.forEach((l,i)=>{ let m=test(l); if(inv) m=!m; if(m) out.push(nn?((i+1)+': '+l):l); });
        return ct?[String(out.length)]:out;
      }
      case 'head': { const n=getN(10); return lines.slice(0,n); }
      case 'tail': { const n=getN(10); return lines.slice(Math.max(0,lines.length-n)); }
      case 'sort': { let out=lines.slice(); if(hasF('n')) out.sort((a,b)=>parseFloat(a)-parseFloat(b)); else out.sort(); if(hasF('r')) out.reverse(); return out; }
      case 'uniq': { const out=[]; let prev=null,run=0; const push=()=>{ if(prev!==null) out.push(hasF('c')?(String(run).padStart(4)+' '+prev):prev); }; lines.forEach(l=>{ if(l===prev){ run++; } else { push(); prev=l; run=1; } }); push(); return out; }
      case 'nl': return lines.map((l,i)=>String(i+1).padStart(5)+'  '+l);
      case 'rev': return lines.map(l=>l.split('').reverse().join(''));
      case 'tac': return lines.slice().reverse();
      case 'cat': return lines;
      default: return this._captureRun(stageLine);   // unknown stage: treat as a fresh source
    }
  }
  runCommand(raw, opts){
    opts=opts||{};
    const line=(raw||'').trim();
    if(!line){ return; }
    if(!opts.silent){
      if(line[0]!=='!'){ if(!this._cmdHistory) this._cmdHistory=[]; this._cmdHistory.push(line); if(this._cmdHistory.length>50) this._cmdHistory.shift(); this._saveHistory(); }
      if(this.state.cliMode) this.echo(line);
      // real pipes:  grep foo | wc -l  ,  cat *.txt | grep x | sort | uniq
      if(line.indexOf('|')>=0 && !/(>>|>)\s*\S/.test(line)){
        const stages=line.split('|').map(s=>s.trim()).filter(Boolean);
        if(stages.length>1){ this._runPipeline(stages); return; }
      }
    }
    const parts=line.split(/\s+/);
    const cmd=parts[0].toLowerCase();
    const arg=parts.slice(1).join(' ');
    const argU=arg.toUpperCase();
    if(cmd==='clear' || cmd==='cls'){ this.setState({ term:[], cmdMsg:'' }); return; }
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
      // `copy <email|github|linkedin|resume>` copies a contact detail to the
      // clipboard; anything else falls through to the DOS file copy below.
      if(cmd==='copy'){
        const map={ email:this.links.email, github:this.links.github, linkedin:this.links.linkedin, resume:'uploads/Rohan_Plante_resume.pdf' };
        const v=map[(arg||'').toLowerCase()];
        if(v){
          try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(v).then(()=>this.out(['copied: '+v]), ()=>this.out([v])); return; } }catch(e){}
          this.out([v]); return;
        }
      }
      if(!arg){ this.say('usage: cp <src> <dest>   ·   copy <email|github|linkedin|resume>'); return; }
      const parts=arg.split(/\s+/); if(parts.length<2){ this.say('usage: cp <src> <dest>'); return; }
      const src=this.findInDir(this.curUserDir(),parts[0])||this.findUserFile(parts[0]);
      if(!src||src.kind!=='file'){ this.say('cp: source not found: '+parts[0]); return; }
      const f=this.makeFile(parts[1]); f.body=src.body||''; this._saveFS(); this.forceUpdate(); this.out(['copied '+src.name+' \u2192 '+f.name]); return;
    }
    if(cmd==='find'){
      if(!arg){ this.say('usage: find <name>   (searches the whole tree, also  find *.txt )'); return; }
      const norm=s=>s.replace(/\s+/g,'').toLowerCase();
      const p=norm(arg), glob=/[*?]/.test(p);
      const rx=glob?new RegExp('^'+p.replace(/[.]/g,'\\.').replace(/\*/g,'.*').replace(/\?/g,'.')+'$'):null;
      const results=[];
      const walk=(d,path)=>{ (d.children||[]).forEach(c=>{ const nm=norm(c.name), full=path+'\\'+c.name.replace(/\s+/g,'')+(c.kind==='dir'?'\\':''); if(rx?rx.test(nm):nm.includes(p)) results.push(full); if(c.kind==='dir') walk(c, path+'\\'+c.name.replace(/\s+/g,'')); }); };
      walk(this.root, this.root.path);
      this.out(results.length?results:['find: no match for '+arg]); return;
    }
    if(cmd==='grep'){
      if(!arg){ this.say('usage: grep <term> [file|*.ext]   (whole tree if no file given)'); return; }
      const parts=arg.split(/\s+/), term=parts[0], scope=parts.slice(1).join(' ');
      const files=this._matchFiles(scope);
      if(scope && !files.length){ this.say('grep: no such file: '+scope); return; }
      const t=term.toLowerCase(), results=[], multi=files.length>1;
      files.forEach(n=>{ this._nodeText(n).split('\n').forEach((l,i)=>{ if(l.toLowerCase().includes(t)){ results.push((multi?n.name.replace(/\s+/g,'')+':':'')+(i+1)+': '+l.trim().slice(0,90)); } }); });
      if(results.length>150){ const more=results.length-150; results.length=150; results.push('… +'+more+' more matches (narrow with a file: grep '+term+' <file>)'); }
      this.out(results.length?results:['grep: no matches for '+term]); return;
    }
    if(cmd==='wc'){
      if(!arg){ this.say('usage: wc <file> [file2 …]   (also  wc *.txt )'); return; }
      const files=this._matchFiles(arg);
      if(!files.length){ this.say('wc: not found: '+arg); return; }
      const rows=['lines  words   chars  name']; let TL=0,TW=0,TC=0;
      files.forEach(n=>{ const b=this._nodeText(n); const L=b.split('\n').length, Wd=b.trim()?b.trim().split(/\s+/).length:0, C=b.length; TL+=L;TW+=Wd;TC+=C; rows.push(String(L).padStart(5)+' '+String(Wd).padStart(6)+' '+String(C).padStart(7)+'  '+n.name.replace(/\s+/g,'')); });
      if(files.length>1) rows.push(String(TL).padStart(5)+' '+String(TW).padStart(6)+' '+String(TC).padStart(7)+'  total');
      this.out(rows); return;
    }
    if(cmd==='head' || cmd==='tail'){
      if(!arg){ this.say('usage: '+cmd+' <file> [n]'); return; }
      const parts=arg.split(/\s+/); let n=10; if(/^\d+$/.test(parts[parts.length-1])){ n=Math.max(1,parseInt(parts.pop(),10)); }
      const files=this._matchFiles(parts.join(' ')); if(!files.length){ this.say(cmd+': not found: '+parts.join(' ')); return; }
      const lines=this._nodeText(files[0]).split('\n');
      this.out(cmd==='head'?lines.slice(0,n):lines.slice(Math.max(0,lines.length-n))); return;
    }
    if(cmd==='stat'){
      if(!arg){ this.say('usage: stat <file>'); return; }
      const files=this._matchFiles(arg); if(!files.length){ this.say('stat: not found: '+arg); return; }
      const nd=files[0], b=this._nodeText(nd);
      const kind=nd.user?'user file':(nd.doc?('document ('+(nd.doc.kind||'doc')+')'):'file');
      this.out(['  File: '+nd.name.replace(/\s+/g,''), '  Type: '+kind,
        '  Size: '+b.length+' bytes    Lines: '+b.split('\n').length,
        '  Date: '+(nd.date||'\u2014')+(nd.user?'    (yours, editable)':'    (read-only)')]); return;
    }
    if(cmd==='echo'){
      const m=arg.match(/^([\s\S]*?)\s*(>>|>)\s*(\S+)\s*$/);
      if(m){ const text=m[1].replace(/^["']|["']$/g,''); const append=m[2]==='>>'; const fnode=this.makeFile(m[3]); if(!fnode){ this.say('echo: bad filename'); return; } fnode.body=append?((fnode.body||'')+(fnode.body?'\n':'')+text):text; fnode.date=this._today(); if(fnode._provisional) delete fnode._provisional; this._saveFS(); this.forceUpdate(); this.out([(append?'appended to ':'wrote ')+fnode.name.replace(/\s+/g,'')]); return; }
      this.out([arg]); return;
    }
    if(cmd==='sysinfo' || cmd==='neofetch'){
      const logo=[
        '  +-----------+',
        '  | +-------+ |',
        '  | | ROHAN | |',
        '  | |  DOS  | |',
        '  | | >_    | |',
        '  | +-------+ |',
        '  +-----------+',
        '     |_____|   ',
        '   _/=======\\_ ',
      ];
      const info=['guest@ROHAN-DOS','===============','OS      : '+this.verLine,'Host    : Portfolio Commander','CPU     : MOS 6502 @ 1.79 MHz','Memory  : 640K conventional','Shell   : COMMAND.COM','Uptime  : since you booted','Files   : '+this._allFiles().length+' on C:\\ROHAN','Stack   : React \u00b7 Vite \u00b7 Tailwind','Contact : '+this.links.email];
      const W=Math.max.apply(null, logo.map(l=>l.length));
      const out=[]; for(let i=0;i<Math.max(logo.length,info.length);i++){ out.push((logo[i]||'').padEnd(W)+'   '+(info[i]||'')); }
      this.out(out); return;
    }
    if(cmd==='theme' || cmd==='color' || cmd==='monitor'){ const t=(arg||'').toLowerCase(); if(['blue','amber','green','white'].includes(t)){ this.setTheme(t); this.say('monitor: '+t+' phosphor'); } else { this.say('monitor themes:  blue · amber · green · white   (e.g.  theme amber )'); } return; }
    if(cmd==='man'){ if(!arg){ this.say('usage: man <command>   (e.g.  man grep )'); return; } this.out(this._manPage(arg)); return; }
    if(cmd==='history'){ const h=this._cmdHistory||[]; this.out(h.length?h.map((c,i)=>('  '+(i+1)+'  '+c)):['(no history)']); return; }
    if(cmd==='help' || cmd==='?'){ if(arg){ this.out(this._manPage(arg)); return; } if(this.state.cliMode){ this.print(this._helpLines()); } else { this.openMenu('commands'); this.say('commands listed above \u2191'); } return; }
    if(cmd==='home' || cmd==='cd\\' || (cmd==='cd' && (arg==='\\'||arg==='/'))){ this.goRoot(); this.say(''); return; }
    if(cmd==='cd'){
      if(arg==='..'){ if(this.state.stack.length>1){ this._upDir(); this.say(''); } else this.say('already at C:\\ROHAN'); return; }
      if(arg===''||arg==='.'){ this.say(''); return; }
      // only descend into a subdirectory of the CURRENT folder (no teleporting
      // to nested dirs elsewhere in the tree)
      const norm=s=>s.replace(/\s+/g,'').toUpperCase();
      const kids=(this.cur().children||[]).filter(c=>c.kind==='dir');
      const target=kids.find(c=>norm(c.name)===norm(arg)) || kids.find(c=>norm(c.name).startsWith(norm(arg)));
      if(target){ this.setState(s=>({ stack:s.stack.concat([target]), sel:(target.children&&target.children.length)?1:0, activeMenu:null, cmdMsg:'', editing:null })); return; }
      this.say('directory not found here: '+arg); return;
    }
    if(cmd==='open' || cmd==='view' || cmd==='read'){
      // a glob ( open * , open *.txt ) reads everything in the current folder
      if(arg && (arg.indexOf('*')>=0 || arg.indexOf('?')>=0)){ this.runCommand('cat '+arg); return; }
      // search whole tree for a file
      const all=this.flatten(this.root);
      const hit=all.find(x=>x.kind==='file' && x.name.replace(/\s+/g,'').toUpperCase().includes(argU.replace(/\s+/g,'')));
      if(hit){ this.revealNode(hit); return; }
      this.say('file not found: '+arg); return;
    }
    if(cmd==='go' || cmd==='start'){
      const map={ github:this.links.github, linkedin:this.links.linkedin, marist:'https://www.marist.edu', alltrails:'https://www.alltrails.com' };
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
    // ----- easter eggs -----
    if(cmd==='sudo'){
      if(!this.state.cliMode){ this.say('sudo needs a real terminal - press 7 (CLI), then try  sudo  again.'); return; }
      this._egg('sudo');
      this.setState({ sudoFlow:{ cmd:arg||'' } });
      setTimeout(()=>{ if(this._cli){ this._cli.value=''; this._cli.focus(); } }, 20);
      return;
    }
    if(cmd==='xyzzy'){ this._egg('xyzzy'); this.out(['Nothing happens.']); return; }
    if(cmd==='secrets' || cmd==='secret' || cmd==='sesame' || cmd==='eggs'){ this.out(this._secretsPanel()); return; }
    if(cmd==='boss' || cmd==='b0ss'){ this._egg('boss'); this.setState({ bossMode:true, activeMenu:null, dialog:null }); return; }
    if(cmd==='cowsay'){ this._egg('ascii'); this.out(this.cowsay(arg||'hire Rohan')); return; }
    if(cmd==='fortune'){ this._egg('ascii'); this.out(this.art.fortune.split('\n')); return; }
    if(cmd==='coffee' || cmd==='brew'){ this._egg('ascii'); this.out(this.art.coffee.split('\n')); return; }
    if(cmd==='sound' || cmd==='keysound'){ const on = arg ? /^(on|1|yes|true)$/i.test(arg) : !this.cfg.keysound; this.cfg.keysound=on; this.forceUpdate(); this.say('keyboard sound '+(on?'ON':'OFF')); return; }
    if(cmd==='matrix'){ if(this._reduceMotion()){ this.out(['(reduced motion is on - the matrix rain is disabled)']); return; } this._egg('matrix'); this.say('wake up, Neo...'); this._startSaver('matrix', true); return; }
    if(cmd==='starfield' || cmd==='stars' || cmd==='warp'){ if(this._reduceMotion()){ this.out(['(reduced motion is on)']); return; } this.say('engaging warp …'); this._startSaver('stars', true); return; }
    if(cmd==='pipes'){ if(this._reduceMotion()){ this.out(['(reduced motion is on)']); return; } this.say('laying pipe …'); this._startSaver('pipes', true); return; }
    if(cmd==='logo' || cmd==='bounce' || cmd==='dvd'){ if(this._reduceMotion()){ this.out(['(reduced motion is on)']); return; } this.say('bouncing …'); this._startSaver('logo', true); return; }
    if(cmd==='screensaver' || cmd==='saver' || cmd==='ss'){ if(this._reduceMotion()){ this.out(['(reduced motion is on)']); return; } const en=this._enabledSaverModes(); const M=en.length?en:['logo','stars','matrix','pipes']; this._startSaver(M[(Math.random()*M.length)|0], true); return; }
    if(cmd==='bc' || cmd==='calc'){
      const e=(arg||'').trim();
      if(!e){ this.out(['usage: bc <expression>    e.g.  bc (2+3)*4    bc 2^10    bc 22/7']); return; }
      if(!/^[-+*/%^().0-9eE\s]+$/.test(e)){ this.out(['bc: only numbers and + - * / % ^ ( ) are allowed']); return; }
      try{ const r=Function('"use strict";return ('+e.replace(/\^/g,'**')+')')(); if(typeof r!=='number'||!isFinite(r)){ this.out(['bc: math error']); return; } this.out([String(Math.round(r*1e10)/1e10)]); }
      catch(_){ this.out(['bc: syntax error']); }
      return;
    }
    if(cmd==='sl'){ this._egg('ascii'); this.out(this._slArt()); return; }
    if(cmd==='ps' || cmd==='top' || cmd==='htop'){ this.out(this._psList(cmd!=='ps')); return; }
    if(cmd==='date' || cmd==='time'){ this.out([new Date().toString()]); return; }
    if(cmd==='ver' || cmd==='version'){ this.out([this.verLine+' - Portfolio Commander - (c) '+this.build.year]); return; }
    if(cmd==='hire' || cmd==='hireme'){ this.out(['> Rohan is open to internships & new-grad SWE roles.', '  resume: F4   \u00b7   mail: type  mail    \u00b7   github: go github']); return; }
    if(cmd==='rohan' || cmd==='me'){ this.out(['Rohan Plante - CS @ Marist, Eagle Scout, hackathon winner.', 'type  whoami , or  cat WHOAMI.TXT']); return; }
    if(cmd==='6502' || cmd==='cpu' || cmd==='mon'){ if(this.state.cliMode){ this.cliVm(arg); } else { this.openVM(); } return; }
    if(cmd==='viz' || cmd==='dataviz' || cmd==='dashboards' || cmd==='tableau'){ if(this.state.cliMode){ this.openDataViz(); this.say('opened DATA-ANL.LOG - use the dashboard buttons'); } else { this.openDataViz(); this.say(''); } return; }
    if(cmd==='games' || cmd==='play' || cmd==='snake' || cmd==='pacman' || cmd==='tictactoe' || cmd==='ttt' || cmd==='combinatris' || cmd==='comb' || cmd==='doom'){
      if(cmd==='doom'){ const pr=(this.root.children||[]).find(c=>c.name==='PROGRAMS'); const d=pr&&pr.children.find(c=>c.name.indexOf('DOOM')>=0); if(d){ this.setState({ stack:[this.root, pr], sel:pr.children.indexOf(d)+1, activeMenu:null, editing:null, cliMode:false }); return; } }
      this.say('arcade games were retired - this machine ships work only. try  cd programs  for the 6502 VM.'); return;
    }
    if(this.state.cliMode && (cmd==='step' || cmd==='speed' || cmd==='reg' || cmd==='regs' || cmd==='mem')){ this.cliVm(cmd+' '+arg); return; }
    if(cmd==='run' || cmd==='asm' || cmd==='load'){
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
    'COMMANDS   ( man <cmd>  for detail )',
    '  cd <dir> / ..     open a folder / go up      ls · dir · tree',
    '  open <file>       read a file   ( cat ,  also  cat *.txt )',
    '  head / tail / stat <file>        peek at a file',
    '  find <t> · grep <t> · wc <file> · pwd · history · clear',
    '  edit <file>       vim editor    ( make <name>  = new + edit )',
    '  touch · mkdir · rm · rename · cp · echo <text> > file',
    '  6502              launch the CPU VM   ( in CLI:  6502 help )',
    '  viz · mail · resume · go <github|linkedin> · copy <email>',
    '  sysinfo · theme <amber|green|white> · man <cmd> · cli / gui',
    '  chaining:  grep foo | wc -l  ·  ls | sort  ·  cat *.txt | head 5',
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
      base = base.concat([{ name:'.SECRET .EGG', kind:'file', size:'42', date:'01.01.70', hidden:true, doc:{ kind:'doc', title:'.SECRET.EGG', meta:'HIDDEN FILE', sub:'The machine keeps a ledger of its undocumented features.', link:this.links.github, linkLabel:'OPEN THE REPOS \u25b8', tags:['hidden'], bullets:[
        'Norton Commander hid its dotfiles until you flipped this switch in Configuration. You flipped it.',
        'There are a handful of things this desktop can do that are not in any help screen. Type  secrets  in the terminal to open the ledger: it lists what you have already turned up and leaves a one-line pointer for each one you have not.',
        'No trophies, no timer. Work through the pointers and you will have seen everything worth seeing in here.' ] } }]);
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
        ? 'Network error - please e-mail '+this.links.email+' directly.'
        : 'Could not send - please e-mail '+this.links.email+' directly.' }); }
    });
  }
  openHelp(){ this.setState({ dialog:'help', activeMenu:null }); }
  openDash(which){ this.setState({ dialog:(which===2?'dash2':'dash1'), activeMenu:null }); }
  openResume(){ this.setState({ dialog:'resume', activeMenu:null }); }
  // open an <img> element in the full-screen image viewer (used by timeline photos)
  // describe one <img> for the viewer
  _imgInfo(img){ const full=img.getAttribute('data-full')||img.getAttribute('src'); const name=(img.getAttribute('alt')||'IMAGE').toUpperCase(); const meta=img.getAttribute('data-full')?'SOURCE: original capture (filters off)':'SOURCE: '+full.split('/').pop(); return { src:full, name, meta }; }
  // open the viewer as a gallery: gather every image in the current entry so the
  // user can page through them; start on the one they clicked
  _imgOpen(img){
    if(!img) return;
    const scope=img.closest('.overflow-auto')||img.parentElement||img;
    const imgs=Array.from(scope.querySelectorAll('img'));
    const list=(imgs.length?imgs:[img]).map(im=>this._imgInfo(im));
    let i=imgs.indexOf(img); if(i<0) i=0;
    this.setState({ imgView:{ list, i } });
  }
  _imgNav(d){ const iv=this.state.imgView; if(!iv||!iv.list||iv.list.length<2) return; const n=iv.list.length; const i=((iv.i+d)%n+n)%n; this.setState({ imgView:{ list:iv.list, i } }); }

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

  // ===== project ASCII visualizations (animated heroes) =====
  _reduceMotion(){ const m=this.cfg&&this.cfg.motion; if(m==='reduced') return true; if(m==='full') return false; try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } }
  // ----- visitor counter (counter.php when deployed; localStorage fallback) -----
  _fetchHits(){
    const set=(n)=>{ if(typeof n==='number' && !isNaN(n)){ this._hits=n; this.forceUpdate(); } };
    try{
      fetch('counter.php', { cache:'no-store' })
        .then(r=>r.json())
        .then(d=>{ if(d && typeof d.count==='number') set(d.count); else set(this._localHits()); })
        .catch(()=>set(this._localHits()));
    }catch(e){ set(this._localHits()); }
  }
  _localHits(){
    try{
      let n=parseInt(localStorage.getItem('rohanVisits')||'0',10)||0;
      if(!sessionStorage.getItem('rohanCounted')){ n++; localStorage.setItem('rohanVisits', String(n)); sessionStorage.setItem('rohanCounted','1'); }
      return n;
    }catch(e){ return null; }
  }
  _startViz(type){
    this._stopViz();
    const gen = this._vizGens[type];
    if(!gen || !this._vizEl){ this._curViz=type; return; }
    this._curViz=type;
    // Respect "reduce motion": draw one settled frame and don't animate.
    if(this._reduceMotion()){ try{ this._vizEl.textContent=gen(40); }catch(e){} return; }
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
    if(sub==='speed' || sub==='clock'){ const n=parseInt(a,10); if(a!=='' && !isNaN(n)) this.vmSetSpeed(n); this.print(['clock = '+this.vmSpeed_().label+'   (0..'+(this.vmSpeeds().length-1)+')']); return; }
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
      this._lastActivity=Date.now();
      if(this.state.saver){ if(Date.now()-(this._saverAt||0)>250) this.setState({ saver:false }); return; }   // any key wakes the screensaver (after a brief guard so the launching key doesn't instantly close it)
      this.keyClick(e);
      if(this.state.booting){ this.finishBoot(); return; }
      if(this.state.bossMode){ if(e.key==='Escape'){ e.preventDefault(); this.setState({ bossMode:false }); setTimeout(()=>{ const el=this.state.cliMode?this._cli:this._cmd; if(el) el.focus(); }, 20); } return; }
      // Function keys F1..F10 mirror the on-screen bar. preventDefault stops the
      // browser from hijacking them (F1 help, F3 find, F5 reload, F6 address bar).
      if(/^F([1-9]|10)$/.test(e.key)){
        e.preventDefault();
        switch(e.key){
          case 'F1': if(this.state.dialog==='help') this.closeDialog(); else this.openHelp(); break;
          case 'F2': this.openMenu('commands'); break;
          case 'F3': if(!this.state.editing) this.editSelected(); break;
          case 'F4': if(this.state.dialog==='resume') this.closeDialog(); else this.openResume(); break;
          case 'F5': this.setState({ dialog:'config', activeMenu:null }); break;
          case 'F6': this.openContact(); break;
          case 'F7': this.toggleCli(); break;
          case 'F8': window.open(this.links.github, '_blank', 'noopener'); break;
          case 'F9': this.goRoot(); break;
          case 'F10': this.goRoot(); break;
        }
        return;
      }
      if(e.target && (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')){
        if(this.state.editing && e.key==='Tab'){ e.preventDefault(); this.edToNormal(); return; }
        if(e.key==='Escape' && this.state.dialog){ this.closeDialog(); }
        return;
      }
      if(this.state.imgView){ if(e.key==='Escape'){ this.setState({ imgView:null }); return; } if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' '){ e.preventDefault(); this._imgNav(1); return; } if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); this._imgNav(-1); return; } }
      if(e.key==='Escape'){ if(this.state.editing){ this.closeEditor(); return; } if(this.state.dialog){ this.closeDialog(); return; } this.closeMenu(); return; }
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
    // deep links: apply the initial URL hash, and follow later hash changes
    this._onHash = ()=>this._applyHash();
    window.addEventListener('hashchange', this._onHash);
    this._applyHash();
    // phosphor tint overlay (amber / green monitor modes), above everything
    this._tint = document.createElement('div');
    this._tint.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;mix-blend-mode:multiply;display:none';
    document.body.appendChild(this._tint);
    this._applyTheme();
    this._onPointer = (e)=>{ this._lastActivity=Date.now(); if(this.state.saver && Date.now()-(this._saverAt||0)>250){ this.setState({ saver:false }); } this._bootSound(); this.clickSound(); };
    window.addEventListener('pointerdown', this._onPointer);
    // DOS block mouse cursor: a character-cell block that inverts what's under it
    document.documentElement.classList.add('nc-blockcur');
    // Coalesce mouse moves into one transform write per animation frame (mice
    // poll far faster than 60Hz, and the mix-blend cursor repaints on every
    // write, one paint per event makes it visibly drag). translate3d keeps it
    // on its own layer.
    this._mouseXY = null;
    this._drawCursor = ()=>{ this._cursorRaf=0; const m=this._mouse, p=this._mouseXY; if(!m||!p) return; m.style.display='block'; m.style.transform='translate3d('+p.x+'px,'+(p.y-2)+'px,0)'; };
    this._onMouseMove = (e)=>{ this._lastActivity=Date.now(); if(this.state.saver && !this._saverManual && Date.now()-(this._saverAt||0)>250){ this.setState({ saver:false }); } this._mouseXY={ x:e.clientX, y:e.clientY }; if(!this._cursorRaf) this._cursorRaf=requestAnimationFrame(this._drawCursor); };
    this._onMouseOut = (e)=>{ if(!e.relatedTarget && !e.toElement && this._mouse){ this._mouse.style.display='none'; } };
    this._onWinBlur = ()=>{ if(this._mouse) this._mouse.style.display='none'; };
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseout', this._onMouseOut);
    window.addEventListener('blur', this._onWinBlur);
    // Audio stays locked until the first real user gesture: the keydown/pointer
    // handlers call _bootSound() to resume it then. (Browser autoplay policy.)
    // idle screensaver: after ~60s with no input, drift the logo DVD-style
    this._lastActivity=Date.now();
    this._idleTimer=setInterval(()=>{ const sv=this.cfg.saver||{}; if(!sv.enabled || this.state.saver || this.state.booting || this._reduceMotion()) return; const to=(sv.timeout||60)*1000; if(Date.now()-this._lastActivity>to){ const en=this._enabledSaverModes(); if(en.length) this._startSaver(en[(Math.random()*en.length)|0]); } }, 1000);
    this._fetchHits();
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
  componentWillUnmount(){ this._dead=true; if(this._onImgErr) document.removeEventListener('error', this._onImgErr, true); window.removeEventListener('keydown', this._onKey); if(this._onHash) window.removeEventListener('hashchange', this._onHash); if(this._tint&&this._tint.parentNode) this._tint.parentNode.removeChild(this._tint); if(this._idleTimer) clearInterval(this._idleTimer); window.removeEventListener('mousemove', this._onMouseMove); window.removeEventListener('mouseout', this._onMouseOut); window.removeEventListener('blur', this._onWinBlur); document.documentElement.classList.remove('nc-blockcur'); if(this._cursorRaf) cancelAnimationFrame(this._cursorRaf); if(this._vmTimer) clearInterval(this._vmTimer); if(this._cliVmTimer) clearInterval(this._cliVmTimer); this._stopViz(); }
  componentDidUpdate(){ if(this.state.cliMode && this._termScroll){ this._termScroll.scrollTop = this._termScroll.scrollHeight; } this._syncHash(); }
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
            beforeSrc:o.beforeSrc||'', afterSrc:o.afterSrc||'', hasBeforeAfter:!!(o.beforeSrc&&o.afterSrc),
            beforeLabel:o.beforeLabel||'BEFORE', afterLabel:o.afterLabel||'AFTER', beforeAfterLabel:o.beforeAfterLabel||'BEFORE / AFTER',
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
      vizRef: this._vizRefCb,
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
      edMode: this.state.editing ? (this.state.editing.ro ? '-- NORMAL --  [readonly]' : (this.state.edModeV==='insert'?'-- INSERT --':this.state.edModeV==='command'?'-- COMMAND --':('-- NORMAL --'+(this.state.edPend?('   '+this.state.edPend):'')))) : '',
      edHint: this.state.edModeV==='insert' ? 'Esc/Tab: normal' : (this.state.edModeV==='command' ? ':w :q :wq :N' : 'd/c/y · w b e · u undo · p · :help'),
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
      profile: this.profile,
      build: this.build,
      links: this.links,
      homeStats: this.homeStats,
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
      imgViewSrc: this.state.imgView ? this.state.imgView.list[this.state.imgView.i].src : '',
      imgViewNode: this.state.imgView ? React.createElement('img', { key:this.state.imgView.i, src:this.state.imgView.list[this.state.imgView.i].src, alt:this.state.imgView.list[this.state.imgView.i].name, style:{ maxWidth:'86vw', maxHeight:'72vh', width:'auto', height:'auto', display:'block', imageRendering:'auto' } }) : null,
      imgViewName: this.state.imgView ? this.state.imgView.list[this.state.imgView.i].name : '',
      imgViewMeta: this.state.imgView ? this.state.imgView.list[this.state.imgView.i].meta : '',
      imgViewCount: this.state.imgView ? this.state.imgView.list.length : 0,
      imgViewIndex: this.state.imgView ? this.state.imgView.i : 0,
      imgPrev:()=>this._imgNav(-1),
      imgNext:()=>this._imgNav(1),
      imgGoto:(i)=>{ const iv=this.state.imgView; if(iv) this.setState({ imgView:{ list:iv.list, i } }); },
      viewImg:(e)=>{ this._imgOpen(e&&e.currentTarget); },
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
      // vim composer send receipt (GUI mode; the CLI prints its own box)
      isMailSent: this.state.dialog==='mailsent',
      mailSent: this.state.mailSent || { from:'', subject:'', bytes:0, ok:false, done:false },
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
        { glyph:'\u25D1', label:'GitHub',   handle:'RPlante28',     href:this.links.github },
        { glyph:'in',     label:'LinkedIn', handle:'rohan-plante',  href:this.links.linkedin },
        { glyph:'@',      label:'E-mail',   handle:'rohanplante',   href:'mailto:'+this.links.email },
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
      saver: !!this.state.saver,
      saverMode: this.state.saverMode||null,
      saverManual: !!this._saverManual,
      saverCfg: this.cfg.saver,
      // ----- Configuration dialog: Display / Screensaver sections -----
      motionOpts: [ {id:'auto',name:'auto'},{id:'full',name:'full'},{id:'reduced',name:'reduced'} ].map(p=>{ const sel=(this.cfg.motion||'auto')===p.id; return { name:p.name, mark: sel?'(o) ':'( ) ', color: sel?'#0000a8':'#06457a', weight: sel?'700':'400', onClick:()=>this.setMotion(p.id) }; }),
      saverEnabled: !!this.cfg.saver.enabled,
      saverEnabledBox: this.cfg.saver.enabled?'[x]':'[ ]',
      saverToggle: ()=>this.toggleSaver(),
      saverOpacity: this.cfg.saver.enabled?1:0.4,
      saverModes: [ {k:'logo',label:'Bouncing logo'},{k:'stars',label:'Starfield'},{k:'matrix',label:'Matrix rain'},{k:'pipes',label:'Pipes'} ].map(m=>{ const on=!!this.cfg.saver.modes[m.k]; return { key:m.k, label:m.label, box:on?'[x]':'[ ]', boxColor:on?'#0000a8':'#06457a', on, onClick:()=>this.toggleSaverMode(m.k) }; }),
      saverSpeedOpts: [ {v:0.4,label:'slowest'},{v:0.7,label:'slow'},{v:1,label:'normal'},{v:1.5,label:'fast'},{v:2.2,label:'fastest'} ],
      saverSpeeds: [ {k:'logo',label:'Logo'},{k:'stars',label:'Stars'},{k:'matrix',label:'Matrix'},{k:'pipes',label:'Pipes'} ].map(m=>{ const v=this.cfg.saver.speed[m.k]||1; return { key:m.k, label:m.label, value:v, onChange:(nv)=>this.setSaverSpeed(m.k, nv) }; }),
      matrixColors: [ {id:'green',name:'green'},{id:'amber',name:'amber'},{id:'cyan',name:'cyan'},{id:'rainbow',name:'rainbow'} ].map(p=>{ const sel=(this.cfg.saver.matrixColor||'green')===p.id; return { name:p.name, mark: sel?'(o) ':'( ) ', color: sel?'#0000a8':'#06457a', weight: sel?'700':'400', onClick:()=>this.setMatrixColor(p.id) }; }),
      starColors: [ {id:'white',name:'white'},{id:'cyan',name:'cyan'},{id:'amber',name:'amber'},{id:'green',name:'green'},{id:'rainbow',name:'rainbow'} ].map(p=>{ const sel=(this.cfg.saver.starColor||'white')===p.id; return { name:p.name, mark: sel?'(o) ':'( ) ', color: sel?'#0000a8':'#06457a', weight: sel?'700':'400', onClick:()=>this.setStarColor(p.id) }; }),
      starOpts: [ {k:'shooting',label:'Shooting stars'} ].map(o=>{ const on=!!this.cfg.saver.stars[o.k]; return { key:o.k, label:o.label, box:on?'[x]':'[ ]', boxColor:on?'#0000a8':'#06457a', on, onClick:()=>this.toggleStarOpt(o.k) }; }),
      pipeBusyOpts: [ {v:'calm',label:'calm'},{v:'normal',label:'normal'},{v:'busy',label:'busy'},{v:'frantic',label:'frantic'} ],
      pipeBusy: this.cfg.saver.pipes.busy,
      setPipeBusy:(v)=>this.setPipeOpt('busy', v),
      saverTimeouts: [15,30,60,120,300,600].map(s=>({ label:this._timeoutLabel(s), sel:this.cfg.saver.timeout===s, color:this.cfg.saver.timeout===s?'#0000a8':'#06457a', weight:this.cfg.saver.timeout===s?'700':'400', onClick:()=>this.setSaverTimeout(s) })),
      // mobile: draggable split between the file browser and the info pane
      navPct: this.state.navPct||52,
      navGrip: this._navGripHandlers(),
      navSmaller: ()=>this.setNavPct((this.state.navPct||52)-16),
      navBigger: ()=>this.setNavPct((this.state.navPct||52)+16),
      hitLabel: (this._hits!=null) ? ('VISITOR '+String(this._hits).padStart(6,'0')) : '',
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
      ].map(r=>({ k:r.k, label:r.label, on:r.on, box: r.on?'[x]':'[ ]', boxColor: r.on?'#0000a8':'#06457a', onClick:()=>this.toggleCfg(r.k) })),
      soundOpacity: this.cfg.keysound ? 1 : 0.4,
      themes: [
        { id:'blue', name:'blue' }, { id:'amber', name:'amber' }, { id:'green', name:'green' }, { id:'white', name:'white' },
      ].map(p=>{ const sel=(this.cfg.theme||'blue')===p.id; return {
        name:p.name, mark: sel?'(o) ':'( ) ',
        color: sel?'#0000a8':'#06457a', weight: sel?'700':'400',
        onClick:()=>this.setTheme(p.id) }; }),
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

// =====================================================================
//  Adventure.js - BOOT SECTOR, a text adventure inside the machine.
//
//  You play GUEST, an unprivileged process. The boot sector on track 0
//  has lost its signature bytes (0x55AA) and the machine hesitates at
//  every power-on. Nine rooms, all real PC subsystems; five items; one
//  fixed puzzle chain worth 100 points; and eight "side notes", optional
//  lore that maps to the rest of the portfolio (education, experience,
//  projects, awards, hobbies) for players who examine everything.
//
//  The Engine owns the CLI; this class is pure state + text. start()
//  and input() return arrays of lines to print. Progress persists in
//  localStorage on every move, so quit/reload resumes cleanly.
// =====================================================================

const SAVE_KEY = 'rohanAdv';
const NOTE_TOTAL = 8;

export default class Adventure {
  constructor(){
    this.reset();
    try{ const r=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(r && r.room) this._load(r); }catch{ /* fresh run */ }
  }
  reset(){
    this.room='memory';
    this.inv=[];                              // item ids carried
    this.flags={};                            // cpuAwake, modemHooked, jumperWrite, headFlying, won
    this.notes={};                            // side-note ids noticed
    this.score=0; this.moves=0;
    this.seen={};                             // room ids already described
    this.itemLoc={ unpark:'memory', crystal:'cmos', vector:'irq' };  // b55/baa spawn later
  }
  _load(r){ this.room=r.room; this.inv=r.inv||[]; this.flags=r.flags||{}; this.notes=r.notes||{}; this.score=r.score||0; this.moves=r.moves||0; this.seen=r.seen||{}; this.itemLoc=r.itemLoc||this.itemLoc; }
  serialize(){ return { room:this.room, inv:this.inv, flags:this.flags, notes:this.notes, score:this.score, moves:this.moves, seen:this.seen, itemLoc:this.itemLoc }; }
  save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.serialize())); }catch{ /* storage full */ } }
  static wipe(){ try{ localStorage.removeItem(SAVE_KEY); }catch{ /* ignore */ } }

  // ----- items ---------------------------------------------------------
  items(){ return {
    unpark: { names:['unpark','unpark.com','utility','program','com'], short:'UNPARK.COM',
      here:'UNPARK.COM is resident here, doing nothing in particular.',
      desc:'A 412 byte utility with one job: convincing a parked disk head to fly again. The copyright string inside just says GOOD LUCK.',
      points:5,
      takeMsg:'You lift UNPARK.COM out of upper memory. It weighs 412 bytes and seems glad to be needed.' },
    crystal: { names:['crystal','quartz','xtal'], short:'a quartz crystal',
      here:'A quartz crystal shivers in its socket, 32,768 beats per second.',
      desc:'It vibrates faintly in your hand, still counting, out of habit.',
      points:10,
      takeMsg:'You pull the crystal free. The ticking stops. Inside the CMOS chip, time is now officially somebody else\'s problem.' },
    vector: { names:['vector','pointer','irq4','int0c'], short:'an interrupt vector',
      here:'A dropped interrupt vector lies on the ground, still pointing at nothing.',
      desc:'Four bytes of segment and offset, coiled like wire. It is heavier than a pointer should be. The tag reads INT 0C, COM1.',
      points:5,
      takeMsg:'You coil the vector and pocket it. The bare signpost looks relieved.' },
    b55: { names:['55','$55','0x55','byte 55','first byte'], short:'the byte $55',
      here:'The byte $55 sits in the accumulator, ready to be copied out.',
      desc:'01010101. Half of a boot signature. It hums with intent.',
      points:10,
      takeMsg:'You copy $55 out of the accumulator. The CPU does not object. Registers are public property here.' },
    baa: { names:['aa','$aa','0xaa','byte aa','second byte'], short:'the byte $AA',
      here:'The byte $AA blinks in the receive buffer.',
      desc:'10101010. The other half of a boot signature, delivered over copper by someone, or something, that wanted this machine to live.',
      points:10,
      takeMsg:'You lift $AA out of the buffer. The modem\'s lights settle back into a slow, satisfied scan.' },
  }; }

  // ----- rooms -----------------------------------------------------------
  // x entries: 'noun|noun2': string, or { t:'text', note:'id' } to log a side
  // note (the optional lore layer) the first time it is examined.
  rooms(){ const F=this.flags; return {
    memory: { name:'Conventional Memory',
      exits:{ e:'bus' },
      desc:[ 'You are standing in conventional memory, all 640 kilobytes of it.',
        'Address zero is somewhere below your feet. Above you, past the 640K',
        'line, upper memory stretches away into shadow, and resident programs',
        'doze in the high addresses. The only exit is east, onto the bus.' ],
      listen:'The refresh cycles wash over the rows like surf. Every bit here is re-remembered a thousand times a second, which is either romantic or exhausting.',
      x:{
        'memory|ram|addresses':'Six hundred forty kilobytes. It was supposed to be enough for anyone.',
        'residents|programs|tsrs|tsr|shadow|upper': { note:'residents',
          t:'You read the resident list. UNPARK.COM, idle. TABLEAU.DRV, rendering dashboards for an office upstairs. And EAGLE.SYS, resident since 2016: it maintains the trails through memory, checks on the younger processes, and cannot be unloaded. Nobody has ever wanted to.' },
        'zero|address zero|null':'You reach toward address zero. Every process in memory holds its breath. You reconsider. Some null pointers are best left for others to dereference.',
        'line|640k|640k line':'The line where conventional memory ends and excuses begin.',
      } },
    bus: { name:'The Bus',
      exits:{ w:'memory', n:'cpu', e:'platters', s:'modem', u:'bios', d:'irq' },
      desc:[ 'The ISA bus, eight bits wide and honest. Traffic rattles past in both',
        'directions at 4.77 megahertz. Lanes lead west into conventional memory,',
        'north to the coprocessor socket, east toward the disk platters, and',
        'south to the modem. A service ladder climbs up to the BIOS ROM, and a',
        'hatch drops down to the interrupt vector table.' ],
      listen:'A steady clatter of timer ticks, and underneath it the long patient hiss of a machine that intends to outlive its warranty.',
      x:{
        'traffic|data|lanes|packets': { note:'traffic',
          t:'You watch the traffic. Keyboard interrupts. A Tableau extract headed for the display adapter. One lost mouse packet, looking for a driver that will love it. And a single packet stamped CLASSIFIED that declines, politely, to say where it is going.' },
        'ladder':'Sturdy enough. It leads up to the oldest memory this machine has.',
        'hatch':'It opens onto the bottom of memory, addresses 0000 to 03FF.',
      } },
    cpu: { name:'The 6502 Coprocessor',
      exits:{ s:'bus', w:'cmos' },
      desc: F.cpuAwake
        ? [ 'The coprocessor socket. The MOS 6502 rests here, halted at a clean',
            'instruction boundary, looking quietly pleased with itself. The bus is',
            'back south, and a thin trace leads west to the CMOS clock.' ]
        : [ 'The coprocessor socket. A MOS 6502 sits here, hand-soldered into a',
            'machine that never officially supported one. Somebody built this for',
            'the joy of it: every cycle stepped, every stage of the pipeline laid',
            'bare, decimal mode and all. The CPU is frozen mid-instruction; its',
            'clock input is silent. The bus is back south, and a thin trace leads',
            'west to the CMOS clock.' ],
      listen: F.cpuAwake ? 'Silence, but a smug kind of silence.' : 'Nothing. A CPU without a clock is the quietest thing in the world. It is not asleep. It is between moments.',
      x:{
        'cpu|6502|processor|coprocessor': F.cpuAwake
          ? ('Halted at $C004, accumulator ' + (this.itemLoc && this.itemLoc.b55==='cpu' ? 'holding $55.' : 'empty. It gave you what it had.'))
          : 'Program counter parked at $C002. The instruction latched in the decoder is LDA #$55: load the accumulator with $55. It has been waiting years for one more clock edge.',
        'clock|clock input|edge|pin':'The clock input is a bare pin, silent. One tick from a real crystal would do it.',
        'socket|trace|solder':'The solder work is careful, the traces rerouted by hand. Whoever did this checked it twice and then wrote an emulator to check it a third time.',
        'accumulator|register': F.cpuAwake ? (this.itemLoc && this.itemLoc.b55==='cpu' ? 'The accumulator reads $55. Yours for the taking.' : 'Empty now.') : 'Empty. The load never happened.',
      } },
    cmos: { name:'CMOS / Real-Time Clock',
      exits:{ e:'cpu' },
      desc:[ 'The real-time clock: a battered CMOS chip with a coin cell riveted on',
        'like a lifeboat. It has kept the date through every winter since the',
        'machine was first assembled in Poughkeepsie. The only way out is east,',
        'along the trace.' ],
      listen: this._crystalGone() ? 'Nothing. You are standing in a stopped clock, which is a strange place to stand.' : 'Tick. 32,768 times a second, which to human ears is one long unbroken note of quiet competence.',
      x:{
        'clock|cmos|rtc|chip|date': this._crystalGone()
          ? 'Frozen at the moment you took the crystal. It will forgive you if you win.'
          : 'The date reads '+this._dosDate()+'. Checksum valid. It is quietly proud of this.',
        'battery|cell|coin cell':'Three volts of stubbornness. Rated for five years, serving its fifteenth.',
        'registers|alarm|alarms|calendar|calendars': { note:'calendars',
          t:'Two academic calendars are burned into the alarm registers. The older one is set to Danvers, Massachusetts, vocational-technical, honors flagged. The newer one is set to Poughkeepsie, computer science, and it is still accumulating.' },
      } },
    platters: { name:'The Disk Platters',
      exits: F.headFlying ? { w:'bus', e:'boot' } : { w:'bus' },
      desc: F.headFlying
        ? [ 'The top platter of drive C, a lacquered aluminum plain. The read-write',
            'head sails above the surface at eight microns, on station and ready.',
            'Track 0 lies east. The bus is west.' ]
        : [ 'You stand on the top platter of drive C, a lacquered aluminum plain',
            'spinning at 3,600 rpm, though from up here it feels still. Data',
            'streams past underfoot, tracks of it, a whole life in sectors. The',
            'read-write head is parked at the far edge, arms folded, out of',
            'service. Track 0 lies east, behind it. The bus is west.' ],
      listen:'A hum so pure the platters could tune an orchestra. 3,600 rpm, never sharp, never flat.',
      x:{
        'head|actuator|arm': F.headFlying ? 'Flying at eight microns. From the platter\'s point of view, a jetliner at ankle height.' : 'Parked, by the book, the way heads were parked before every shutdown in the old days. Nothing short of a proper utility will convince it to fly again.',
        'data|files|surface|tracks|sectors|life': { note:'fragments',
          t:'You kneel and read the surface as it streams past. A bouldering problem, annotated hold by hold. A reading list with Red Rising dog-eared and a three-body problem pending. A campus route solver with every shaded path graded. A LiDAR point cloud that still thinks it is driving. And an elevation profile for a volcano out west, filed under SOON.' },
        'platter|drive|disk':'Certified for 40 megabytes and carrying a whole person\'s work anyway. The defragmenter has been through recently. It did good work.',
      } },
    boot: { name:'The Boot Sector',
      exits:{ w:'platters' },
      desc: F.won
        ? [ 'Track 0, sector 1. The last two bytes read 55 AA, as they should.',
            'The machine boots clean now. You did that.' ]
        : [ 'Track 0, sector 1. Five hundred twelve bytes that decide every',
            'morning whether this machine gets to exist. The code is intact until',
            'the very end, where the boot signature should read 55 AA. It reads',
            '00 00. That silence is why the machine hesitates at power-on. The',
            'platters are back west.' ],
      listen: F.won ? 'The sector hums the first four bytes of its loader to itself, like someone humming stairs.' : 'You put your ear to the sector. Five hundred ten bytes of held breath.',
      x:{
        'signature|bytes|55aa|510|offset|end': F.won ? '55 AA. Valid. Permanent, barring further adventures.' : 'Two zeroed bytes at offset 510. The BIOS checks them before it will trust a single instruction here. No signature, no boot. Rules are rules.',
        'code|loader|sector': { note:'loader',
          t:'You read the loader itself. It is compact, patient, hand-tuned: it retries without complaining, fails without drama, and comments its one clever trick so the next person will not have to be clever. Whoever wrote it read the manual twice and the errata once.' },
      } },
    modem: { name:'The Modem',
      exits:{ n:'bus' },
      desc: F.modemHooked
        ? [ 'The external modem sits at the end of its serial cable, lights idling',
            'in a slow scan, line hooked and listening. The bus is north.' ]
        : [ 'An external modem squats at the end of its serial cable, lights dark,',
            'speaker silent. A sticker on the case reads 33.6, THE LAST GOOD',
            'SPEED. It is off-hook and sulking: its interrupt line ends in',
            'mid-air, connected to nothing. The bus is north.' ],
      listen:'Through the cable insulation, very faint, a dial tone. Somewhere out there a bulletin board is still up, still answering, out of principle.',
      x:{
        'modem|lights': F.modemHooked ? 'Content, in its way. It did its one job.' : 'The serial port raises IRQ 4 when data arrives, but the vector that should catch it is missing. Any byte that came down the wire right now would arrive to an empty room.',
        'sticker|case':'33.6, THE LAST GOOD SPEED. Below it, in smaller print: 56K IS A LIE THEY TELL AT TRADE SHOWS.',
        'cable|line|wire':'Copper all the way to somewhere. You can feel the dial tone through the insulation, steady as a metronome.',
        'speaker': { note:'speaker',
          t:'The speaker has played exactly one song its whole life, the handshake, and it plays it with feeling. Someone here keeps drums, a bass, and a guitar upstairs; the modem has been taking notes on timing.' },
      } },
    bios: { name:'The BIOS ROM',
      exits:{ d:'bus' },
      desc:[ 'The BIOS ROM: a windowed EPROM under a peeling label. This is the',
        'machine\'s oldest memory, holding the power-on self-test, the disk',
        'services, the beep. Near the socket, a three-pin header labeled JP1',
        'wears its jumper on pins '+(F.jumperWrite?'2 and 3, marked WRITE TRK0.':'1 and 2, marked SAFE. Pins 2 and'),
        (F.jumperWrite?'Pins 1 and 2, marked SAFE, sit empty. The ladder goes back down.':'3 are marked WRITE TRK0. The ladder goes back down.') ],
      listen:'Nothing. ROM does not hum. ROM remembers.',
      x:{
        'rom|eprom|die|window':'Under the label, through the quartz window, you can see the die. It is beautiful the way bridges are beautiful.',
        'jumper|jp1|header|pins': F.jumperWrite ? 'JP1 sits on WRITE TRK0. Reckless. Correct.' : 'A two-millimeter decision. On SAFE, the drive controller refuses all writes to track 0. On WRITE TRK0, it minds its own business.',
        'label':'It reads ROHAN-DOS BIOS v2.11, and under that, in pencil, DO NOT ERASE AGAIN.',
        'post|self-test|log|test': { note:'postlog',
          t:'You page through the self-test log. Most entries are routine, but some nights are starred: FALL 2022, CYBER LEAGUE .... PASS. MAY 2024, OUTSTANDING VO-TECH .... PASS. APR 2026, HACKATHON, 24 HRS .... BEST OVERALL. The beep, the log notes separately, has never once been off pitch.' },
      } },
    irq: { name:'The Interrupt Vector Table',
      exits:{ u:'bus' },
      desc:[ 'The bottom of memory, addresses 0000 to 03FF, where the interrupt',
        'vector table lives. One thousand twenty four bytes of pure pointing.',
        'Rows of vectors stand like signposts, each aimed at its handler:',
        'timer, keyboard, disk. One post is bare. The hatch back up to the bus',
        'is overhead.' ],
      listen:'Interrupts arriving and being dispatched, over and over, a train station where every train is on time.',
      x:{
        'vectors|table|signposts|posts|rows':'INT 08, ticking. INT 09, waiting on the keyboard. INT 13, disk services, recently oiled. INT 1C runs a small hook that schedules events for a community server and has never missed one. And INT 0C, serial port COM1: bare.',
        'nmi': { note:'nmi',
          t:'The non-maskable interrupt line hums to itself. You cannot mask it. Nobody can. That is rather the point. If you ever meet a problem like this, the trick is not to silence it; the trick is to have written a good handler years in advance.' },
        'post|bare post|int 0c|0c|com1':'The post for INT 0C, COM1. Whatever it pointed to, it points there no longer.',
      } },
  }; }

  _crystalGone(){ return this.inv.indexOf('crystal')>=0 || (this.itemLoc && this.itemLoc.crystal!=='cmos'); }
  _dosDate(){ const d=new Date(); const p=(n)=>String(n).padStart(2,'0'); return p(d.getMonth()+1)+'-'+p(d.getDate())+'-'+String(d.getFullYear()); }

  // ----- scoring / progress ---------------------------------------------
  _award(pts){ this.score=Math.min(100, this.score+pts); return '[+'+pts+' points]'; }
  _noteCount(){ return Object.keys(this.notes).length; }
  _rank(){ const s=this.score;
    if(s>=100) return 'Ring 0';
    if(s>=75)  return 'Resident Utility';
    if(s>=50)  return 'Device Driver';
    if(s>=25)  return 'User-Mode Visitor';
    return 'Unprivileged Process'; }
  _checklist(){
    const F=this.flags, has=(id)=>this.inv.indexOf(id)>=0;
    const bx=(v)=> v?'[x]':'[ ]';
    return [ 'REPAIR CHECKLIST',
      '  '+bx(has('b55')||F.won)+' byte $55 recovered',
      '  '+bx(has('baa')||F.won)+' byte $AA recovered',
      '  '+bx(F.jumperWrite)+' track 0 write enabled (JP1)',
      '  '+bx(F.headFlying)+' disk head flying',
      '  '+bx(F.won)+' signature written' ];
  }
  _hint(){
    const F=this.flags, has=(id)=>this.inv.indexOf(id)>=0, loc=this.itemLoc;
    const say=(s)=>['HINT.SYS consults its notes:', '  '+s];
    if(F.won) return say('nothing left to fix. Some people examine things just to hear the descriptions.');
    if(!has('b55') && loc.b55!=='cpu'){
      if(!has('crystal') && loc.crystal==='cmos') return say('a frozen CPU wants one clock edge. Something in this machine still keeps perfect time.');
      if(has('crystal')) return say('you are carrying a tick. The 6502 is starving for exactly one.');
    }
    if(loc.b55==='cpu') return say('the accumulator is holding something for you. Registers are public property.');
    if(!has('baa') && loc.baa!=='modem'){
      if(!has('vector') && loc.vector==='irq') return say('the modem cannot deliver to an empty room. Down in the vector table, one signpost is bare and its pointer is on the ground.');
      if(has('vector')) return say('you are carrying a pointer with COM1 on the tag. The modem knows what to do with it.');
    }
    if(loc.baa==='modem') return say('a byte is blinking in the receive buffer. It came a long way. Take it.');
    if(!F.headFlying){
      if(!has('unpark') && loc.unpark==='memory') return say('the disk head will not move for pedestrians, but a resident in conventional memory was written for exactly this.');
      if(has('unpark')) return say('you are carrying a utility with one job. The parked head is its job.');
    }
    if(!F.jumperWrite) return say('the drive controller obeys a two-millimeter piece of plastic up in the BIOS. Walk it from SAFE to WRITE TRK0.');
    return say('you have everything. Track 0, sector 1, east of the platters. Write the signature.');
  }

  _lookLines(force){
    const R=this.rooms()[this.room];
    this.seen[this.room]=1;
    const out=[ '', R.name.toUpperCase(), ...R.desc ];
    const IT=this.items();
    Object.keys(this.itemLoc).forEach(id=>{ if(this.itemLoc[id]===this.room) out.push(IT[id].here); });
    return force?out:out;
  }

  // ----- entry points ---------------------------------------------------
  start(){
    const resumed = this.moves>0 || this.score>0 || this.inv.length>0 || this.room!=='memory';
    const head=[ '',
      'BOOT SECTOR',
      'A text adventure in 512 bytes of trouble.',
      '' ];
    const intro= resumed ? [ '(resuming a saved run: score '+this.score+', '+this.moves+' moves, '+this._noteCount()+' of '+NOTE_TOTAL+' side notes. type  restart  to start over.)' ]
      : [ 'You wake as GUEST, an unprivileged process, in the dark of',
          'conventional memory. The machine hesitated again at power-on this',
          'morning: the boot sector on track 0 has lost its signature, the two',
          'bytes that tell the BIOS a disk is worth trusting. If nobody fixes',
          'it, one of these mornings the machine will not come up at all.',
          '',
          'You have no privileges, no toolbox, and no idea how you got',
          'scheduled. But memory is open, the bus is humming, and somewhere on',
          'this machine the two halves of a boot signature are waiting.',
          '',
          'Type  help  for commands,  hint  if you stall,  quit  to leave',
          '(progress is saved). Examine everything. This machine has lived.' ];
    return head.concat(intro, this._lookLines(true));
  }

  _help(){ return [
    'Commands:',
    '  look (l)                 describe where you are',
    '  north south east west up down   or just  n s e w u d',
    '  examine <thing> (x)      look closely. this is where the good stuff is',
    '  take <thing> / drop <thing> / inventory (i)',
    '  use <thing> on <thing>   apply one thing to another',
    '  listen                   every room has a sound',
    '  score                    checklist, points, side notes, standing',
    '  hint                     a nudge from HINT.SYS, free of judgment',
    '  restart                  wipe the save and start over',
    '  quit                     leave; progress is saved',
    'Everything else you will have to discover. This machine keeps secrets.',
  ]; }

  _matchItem(noun, ids){
    const IT=this.items(); noun=noun.toLowerCase();
    return ids.find(id=> IT[id].names.some(n=> n===noun || noun.indexOf(n)>=0 || n.indexOf(noun)>=0 ));
  }

  input(raw){
    const out=[]; let quit=false;
    let s=(raw||'').trim().toLowerCase().replace(/\s+/g,' ');
    if(!s) return { lines:['Say again?'], quit:false };
    s=s.replace(/\b(the|a|an|at|to)\b/g,' ').replace(/\s+/g,' ').trim();
    this.moves++;
    const F=this.flags, IT=this.items();
    const words=s.split(' '); let verb=words[0]; let rest=words.slice(1).join(' ');
    if(verb==='go' || verb==='walk' || verb==='climb'){ verb=words[1]||''; rest=''; }
    const DIR={ n:'n', north:'n', s:'s', south:'s', e:'e', east:'e', w:'w', west:'w', u:'u', up:'u', d:'d', down:'d' };

    // -- movement --
    if(DIR[verb]!==undefined && !rest){
      const R=this.rooms()[this.room]; const to=R.exits[DIR[verb]];
      if(!to){
        if(this.room==='platters' && DIR[verb]==='e' && !F.headFlying) out.push('The parked head blocks the way onto track 0. It will not move for pedestrians.');
        else out.push('You can\'t go that way.');
      } else { this.room=to; out.push(...this._lookLines(false)); }
      this.save(); return { lines:out, quit };
    }

    switch(verb){
      case 'look': case 'l':
        out.push(...this._lookLines(true)); break;

      case 'help': case '?':
        out.push(...this._help()); break;

      case 'hint': case 'hints':
        out.push(...this._hint()); break;

      case 'listen': {
        const R=this.rooms()[this.room];
        out.push(R.listen || 'The usual electrical weather.'); break; }

      case 'smell': case 'sniff':
        out.push('Ozone, warm dust, a hint of flux. And, impossibly, from somewhere far above the case fan, something ambitious happening in a kitchen.');
        break;

      case 'inventory': case 'i': case 'inv': {
        if(!this.inv.length){ out.push('You are carrying nothing. Typical for a guest account.'); break; }
        out.push('You are carrying:');
        this.inv.forEach(id=> out.push('  '+IT[id].short));
        break; }

      case 'examine': case 'x': case 'inspect': case 'read': case 'r': {
        if(!rest){ out.push(verb==='read'?'Read what?':'Examine what?'); break; }
        const near=this.inv.concat(Object.keys(this.itemLoc).filter(id=>this.itemLoc[id]===this.room));
        const it=this._matchItem(rest, near);
        if(it){ out.push(IT[it].desc); break; }
        const R=this.rooms()[this.room]; let hit=null;
        Object.keys(R.x||{}).forEach(k=>{ if(!hit && k.split('|').some(n=> rest===n || rest.indexOf(n)>=0 )) hit=R.x[k]; });
        if(hit){
          if(typeof hit==='object'){
            const isNew=!this.notes[hit.note];
            if(isNew) this.notes[hit.note]=1;
            out.push(hit.t);
            if(isNew) out.push('[side note '+this._noteCount()+' of '+NOTE_TOTAL+' noticed]');
          } else out.push(hit);
        }
        else if(rest==='me'||rest==='self'||rest==='guest'){ out.push('GUEST. Priority 0, privileges none, determination unbounded.'); }
        else out.push('You see nothing special about that.');
        break; }

      case 'take': case 'get': case 'grab': case 'pick': {
        if(rest.indexOf('up ')===0) rest=rest.slice(3);
        if(!rest){ out.push('Take what?'); break; }
        const here=Object.keys(this.itemLoc).filter(id=>this.itemLoc[id]===this.room);
        const it=this._matchItem(rest, here);
        if(!it){
          if(this._matchItem(rest, this.inv)) out.push('You already have that.');
          else out.push('You can\'t take that.');
          break; }
        delete this.itemLoc[it]; this.inv.push(it);
        const pts=IT[it].points && !F['scored_'+it] ? IT[it].points : 0;
        if(pts) F['scored_'+it]=1;
        out.push((IT[it].takeMsg||('You take '+IT[it].short+'.')) + (pts?('  '+this._award(pts)):''));
        break; }

      case 'drop': case 'leave': {
        if(!rest){ out.push('Drop what?'); break; }
        const it=this._matchItem(rest, this.inv);
        if(!it){ out.push('You aren\'t carrying that.'); break; }
        this.inv=this.inv.filter(x=>x!==it); this.itemLoc[it]=this.room;
        out.push('Dropped.'); break; }

      case 'use': case 'apply': case 'put': case 'splice': case 'hook': case 'connect': case 'attach': case 'hold': {
        out.push(...this._use(verb, rest)); break; }

      case 'run': case 'exec': case 'execute': case 'load': {
        if(rest.indexOf('unpark')<0){ out.push('Run what?'); break; }
        out.push(...this._use('use','unpark on head')); break; }

      case 'move': case 'flip': case 'switch': {
        if(rest.indexOf('jumper')>=0 || rest.indexOf('jp1')>=0){ out.push(...this._moveJumper()); }
        else out.push('You can\'t move that.');
        break; }
      case 'set': {
        if(rest.indexOf('jumper')>=0 || rest.indexOf('jp1')>=0){ out.push(...this._moveJumper()); }
        else out.push('Set what?');
        break; }

      case 'write': case 'fix': case 'repair': case 'restore': {
        if(verb==='restore' && !rest){ out.push('Progress is saved automatically. There is nothing older to restore.'); break; }
        out.push(...this._writeSig()); break; }

      case 'score': case 'status': case 'progress':
        out.push(...this._checklist(),
          'Score: '+this.score+' of 100, in '+this.moves+' moves.',
          'Side notes: '+this._noteCount()+' of '+NOTE_TOTAL+' noticed.',
          'Standing: '+this._rank()+'.');
        break;

      case 'save':
        this.save(); out.push('Saved. It saves on every move anyway, but the gesture is appreciated.'); break;

      case 'restart':
        this.reset(); Adventure.wipe(); this.save();
        out.push('', 'The machine forgets you ever existed. Fresh page tables all around.', ...this._lookLines(true));
        break;

      case 'quit': case 'q': case 'exit': case 'bye':
        this.save(); quit=true;
        out.push('', 'Progress saved: '+this.score+' points, '+this._noteCount()+' of '+NOTE_TOTAL+' side notes, '+this.moves+' moves.',
          'Type  adventure  to return.');
        break;

      case 'xyzzy': case 'plugh':
        if(this.room==='memory'){ out.push('A hollow voice says, "This is not Colossal Cave." Nothing happens.'); }
        else { this.room='memory'; out.push('The word echoes down the address lines and, improbably, works.', ...this._lookLines(false)); }
        break;

      case 'jump':
        out.push(this.room==='platters' ? '3,600 rpm. No.' : 'You jump. The stack pointer flinches.');
        break;

      case 'wait': case 'z':
        out.push('Time passes.'+(this._crystalGone()?' Well. For the rest of the machine it doesn\'t, technically. That one is on you.':''));
        break;

      case 'pray':
        out.push('You are heard, but the interrupt controller has prayers masked at the moment.');
        break;

      case 'yell': case 'shout': case 'scream': case 'hello': case 'hi':
        out.push('Your voice does not carry in unshielded memory.');
        break;

      case 'dance': case 'sing':
        out.push('The bus arbitration unit files a complaint.');
        break;

      default:
        out.push('That verb is not in this machine\'s vocabulary. Try  help .');
    }
    this.save();
    return { lines:out, quit };
  }

  // ----- puzzle verbs ----------------------------------------------------
  _use(verb, rest){
    const F=this.flags;
    if(!rest) return [ (verb==='hook'||verb==='splice'||verb==='connect'||verb==='attach') ? 'Hook what to what?' : 'Use what on what?' ];
    const m=rest.match(/^(.*?)\s+(?:on|onto|with|into|in|against)\s+(.*)$/);
    let a=m?m[1].trim():rest, b=m?m[2].trim():'';
    // bare "use crystal" etc: infer the target from the room
    if(!b){
      if(this.room==='modem' && this._matchItem(a,['vector'])) b='modem';
      else if(this.room==='cpu' && this._matchItem(a,['crystal'])) b='cpu';
      else if(this.room==='platters' && this._matchItem(a,['unpark'])) b='head';
      else return ['Use '+a+' on what?'];
    }
    const holding=(id)=> this.inv.indexOf(id)>=0;

    // crystal on cpu
    if(this._matchItem(a,['crystal']) && /cpu|6502|processor|clock|coprocessor|pin/.test(b)){
      if(this.room!=='cpu') return ['The coprocessor is not here.'];
      if(!holding('crystal')) return ['You don\'t have the crystal.'];
      if(F.cpuAwake) return ['The 6502 has already had its clock edge. It is not greedy.'];
      F.cpuAwake=1; this.itemLoc.b55='cpu';
      return ['You hold the crystal against the bare clock pin.',
        '',
        'tick.',
        '',
        'The 6502 wakes, executes LDA #$55 in two cycles exactly, and halts at',
        'the next fetch, satisfied. After years of waiting, the whole operation',
        'took 559 nanoseconds. The accumulator now reads $55.  '+this._award(10)];
    }
    // vector on modem
    if(this._matchItem(a,['vector']) && /modem|irq|serial|com1|port|line/.test(b)){
      if(this.room!=='modem') return ['The modem is not here.'];
      if(!holding('vector')) return ['You don\'t have a vector to hook.'];
      if(F.modemHooked) return ['IRQ 4 is already hooked, and holding.'];
      F.modemHooked=1; this.inv=this.inv.filter(x=>x!=='vector'); this.itemLoc.baa='modem';
      return ['You splice the vector onto IRQ 4. The modem\'s lights blink once, all',
        'together, like a creature waking up. It clears its speaker and dials.',
        '',
        '   ATDT . . . RING . . . RING',
        '   CONNECT 33600',
        '',
        'One byte arrives, the distant end hangs up without a word, and the',
        'byte sits blinking in the receive buffer: $AA.  '+this._award(10)];
    }
    // unpark on head
    if((this._matchItem(a,['unpark'])||/unpark/.test(a)) && /head|drive|platter|disk|actuator/.test(b)){
      if(this.room!=='platters') return ['There is no disk head here.'];
      if(!holding('unpark')) return ['You don\'t have UNPARK.COM.'];
      if(F.headFlying) return ['The head is already flying. UNPARK.COM refuses to run twice; it has standards.'];
      F.headFlying=1;
      return ['UNPARK.COM loads, prints its one and only message,',
        '',
        '   HEAD RELEASED',
        '',
        'and exits without taking questions. The actuator swings the head off',
        'its ramp and it settles into a graceful float, eight microns off the',
        'surface. The way east is open.  '+this._award(10)];
    }
    // bytes on sector
    if((this._matchItem(a,['b55','baa']) || /byte|bytes|signature|55|aa/.test(a)) && /sector|boot|signature|510|offset|disk/.test(b)){
      return this._writeSig();
    }
    return ['That does nothing. The machine remains unimpressed.'];
  }

  _moveJumper(){
    const F=this.flags;
    if(this.room!=='bios') return ['There is no jumper here.'];
    if(F.jumperWrite) return ['JP1 is already on WRITE TRK0. Leave it. It is nervous enough.'];
    F.jumperWrite=1;
    return ['You walk the jumper cap from SAFE over to WRITE TRK0. Somewhere below,',
      'a warranty quietly voids. The drive controller will now accept writes',
      'to track 0.  '+this._award(10)];
  }

  _writeSig(){
    const F=this.flags;
    if(this.room!=='boot') return ['There is nothing here that takes a signature.'];
    if(F.won) return ['The sector already reads 55 AA. Perfection does not need a second coat.'];
    const has55=this.inv.indexOf('b55')>=0, hasAA=this.inv.indexOf('baa')>=0;
    if(!has55 && !hasAA) return ['You have nothing to write. The sector waits.'];
    if(!has55) return ['You have $AA, but a signature is two bytes. $55 is still out there,','somewhere a program counter got stuck.'];
    if(!hasAA) return ['You have $55, but a signature is two bytes. $AA is still out there,','somewhere at the end of a phone line.'];
    if(!F.jumperWrite) return ['The drive controller declines, politely but in capital letters:',
      '',
      '   TRACK 0 WRITE PROTECTED',
      '',
      'Somewhere, a jumper is still set to SAFE.'];
    F.won=1; this.inv=this.inv.filter(x=>x!=='b55'&&x!=='baa');
    const bonus=this._award(20);
    const notes=this._noteCount();
    this.save();
    const out=['You press $55 and $AA into the last two bytes of the sector. The head',
      'lifts. The write completes. For a moment, nothing happens.',
      '',
      'Then, somewhere above, a POST card flickers. The machine inhales.',
      '',
      '   ROHAN-DOS BIOS v2.11',
      '   MEM 640K OK',
      '   DRIVE C: SIGNATURE 55 AA .... VALID',
      '   BOOTING.',
      '',
      'The machine boots clean for the first time in years. Nobody will ever',
      'know why. You will.  '+bonus,
      '',
      '*** You have restored the boot sector ***',
      '',
      'Score: '+this.score+' of 100, in '+this.moves+' moves. Standing: '+this._rank()+'.',
      'Side notes: '+notes+' of '+NOTE_TOTAL+' noticed.'];
    if(notes<NOTE_TOTAL) out.push('(the machine had '+(NOTE_TOTAL-notes)+' more stories to tell. they are still in there,','somewhere behind an  examine .)');
    else out.push('You read every story this machine had. It will not forget that.');
    out.push('', '(keep wandering, type  restart  to run it back, or  quit .)');
    return out;
  }
}

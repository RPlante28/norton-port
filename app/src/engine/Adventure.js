// =====================================================================
//  Adventure.js - BOOT SECTOR, a two-act text adventure inside the machine.
//
//  ACT 1  - The fixed disk was pulled and reseated to fix a failing drive.
//           That reseat knocked the boot sector; the machine hesitates at
//           power-on. Get it to POST. (nine subsystems, the classic quest.)
//
//  ACT 2  - The machine boots, but the reseat also changed its hardware
//           fingerprint, and drive C was sealed by DISKREET (Norton's real
//           DOS-era disk cipher). The volume is locked, and the recovery
//           passphrase was never written down - out in the real world it was
//           never found. Reconstruct it from the key-shares DISKREET escrowed
//           to the hardware (a genuine XOR key-binding), and unseal the disk.
//
//  Pure state + text: start()/input() return arrays of lines to print.
//  uiHints() exposes structured room state so the GUI window can render
//  tappable compass + action buttons (mobile-friendly). Progress persists
//  to localStorage every move. Recovered data is intentionally unnamed.
// =====================================================================

const SAVE_KEY = 'rohanAdv';
const BEST_KEY = 'rohanAdvBest';

// ---- the DISKREET cipher: the passphrase spells HOME; each escrowed share
// is (passphrase byte) XOR (original drive signature). The reseat changed the
// signature, so the *current* fingerprint won't unmask them - you need K_ORIG.
const PASS = 'HOME';
const K_ORIG = 0x2a;                                   // original drive signature
const K_NOW  = 0x37;                                   // post-reseat fingerprint (red herring)
const SHARES = PASS.split('').map((c) => c.charCodeAt(0) ^ K_ORIG); // 0x62 65 67 6f
const hx = (n) => (n & 0xff).toString(16).toUpperCase().padStart(2, '0');

export default class Adventure {
  constructor(){
    this.reset();
    try{ const r=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(r && r.room) this._load(r); }catch{ /* fresh run */ }
  }
  reset(){
    this.act=1;
    this.room='memory';
    this.inv=[];
    this.flags={};        // cpuAwake modemHooked jumperWrite headFlying posted
                          // volumeSeen escrowRead sigFound lostOpen unsealed won
    this.notes={};        // side-note ids noticed
    this.fun={};          // amusing discoveries
    this.heard={};        // rooms listened to
    this.score=0; this.moves=0;
    this.seen={};
    this.itemLoc={ unpark:'memory', crystal:'cmos', vector:'irq' };
  }
  _load(r){ this.act=r.act||1; this.room=r.room; this.inv=r.inv||[]; this.flags=r.flags||{}; this.notes=r.notes||{}; this.fun=r.fun||{}; this.heard=r.heard||{}; this.score=r.score||0; this.moves=r.moves||0; this.seen=r.seen||{}; this.itemLoc=r.itemLoc||this.itemLoc; }
  serialize(){ return { act:this.act, room:this.room, inv:this.inv, flags:this.flags, notes:this.notes, fun:this.fun, heard:this.heard, score:this.score, moves:this.moves, seen:this.seen, itemLoc:this.itemLoc }; }
  save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.serialize())); }catch{ /* full */ } }
  static wipe(){ try{ localStorage.removeItem(SAVE_KEY); }catch{ /* ignore */ } }
  _best(){ try{ const b=JSON.parse(localStorage.getItem(BEST_KEY)||'null'); return (b&&typeof b==='object')?b:null; }catch{ return null; } }
  _saveBest(){
    const cur={ score:this.score, moves:this.moves, notes:this._noteCount(), fun:Object.keys(this.fun).length, pct:this._completion() };
    const old=this._best();
    const better=!old || cur.pct>old.pct || (cur.pct===old.pct && cur.moves<(old.moves||1e9));
    if(better){ try{ localStorage.setItem(BEST_KEY, JSON.stringify(cur)); }catch{ /* ignore */ } }
    return better;
  }

  // ----- items ---------------------------------------------------------
  items(){ return {
    unpark: { names:['unpark','unpark.com','utility','program','com'], short:'UNPARK.COM',
      here:'UNPARK.COM is resident here, doing nothing in particular.',
      desc:'A 412 byte utility with one job: convincing a parked disk head to fly again. The copyright string inside just says GOOD LUCK.',
      points:5, takeMsg:'You lift UNPARK.COM out of upper memory. It weighs 412 bytes and seems glad to be needed.' },
    crystal: { names:['crystal','quartz','xtal'], short:'a quartz crystal',
      here:'A quartz crystal shivers in its socket, 32,768 beats per second.',
      desc:'It vibrates faintly in your hand, still counting, out of habit.',
      points:5, takeMsg:'You pull the crystal free. The ticking stops. Inside the CMOS chip, time is now officially somebody else\'s problem.' },
    vector: { names:['vector','pointer','irq4','int0c'], short:'an interrupt vector',
      here:'A dropped interrupt vector lies on the ground, still pointing at nothing.',
      desc:'Four bytes of segment and offset, coiled like wire. The tag reads INT 0C, COM1.',
      points:5, takeMsg:'You coil the vector and pocket it. The bare signpost looks relieved.' },
    b55: { names:['55','$55','0x55','byte 55','first byte'], short:'the byte $55',
      here:'The byte $55 sits in the accumulator, ready to be copied out.',
      desc:'01010101. Half of a boot signature. It hums with intent.',
      points:5, takeMsg:'You copy $55 out of the accumulator. The CPU does not object. Registers are public property here.' },
    baa: { names:['aa','$aa','0xaa','byte aa','second byte'], short:'the byte $AA',
      here:'The byte $AA blinks in the receive buffer.',
      desc:'10101010. The other half of a boot signature, delivered over copper by someone who wanted this machine to live.',
      points:5, takeMsg:'You lift $AA out of the buffer. The modem\'s lights settle back into a slow, satisfied scan.' },
  }; }

  // ----- rooms ---------------------------------------------------------
  // Every room exists at all times; ACT-2 rooms are simply unreachable until
  // the machine POSTs (their entrances open on this.act===2). x-entries are a
  // string, or { t, note } to log a side note the first time it is examined.
  rooms(){ const F=this.flags, A2=this.act>=2; return {
    memory: { name:'Conventional Memory', exits:{ e:'bus' },
      desc:[ 'You are standing in conventional memory, all 640 kilobytes of it.',
        'Address zero is somewhere below your feet. Above you, past the 640K',
        'line, upper memory stretches into shadow, and resident programs doze',
        'in the high addresses. The only exit is east, onto the bus.' ],
      listen:'The refresh cycles wash over the rows like surf. Every bit here is re-remembered a thousand times a second, which is either romantic or exhausting.',
      x:{ 'memory|ram|addresses':'Six hundred forty kilobytes. It was supposed to be enough for anyone.',
        'residents|programs|tsrs|tsr|shadow|upper': { note:'residents', t:'You read the resident list. UNPARK.COM, idle. TABLEAU.DRV, rendering dashboards for an office upstairs. And EAGLE.SYS, resident since 2016: it maintains the trails through memory, checks on the younger processes, and cannot be unloaded. Nobody has ever wanted to.' },
        'zero|null':'You reach toward address zero. Every process in memory holds its breath. You reconsider. Some null pointers are best left for others to dereference.',
        'line|640k':'The line where conventional memory ends and excuses begin.' } },
    bus: { name:'The Bus', exits:{ w:'memory', n:'cpu', e:'platters', s:'modem', u:'bios', d:'irq' },
      desc:[ 'The ISA bus, eight bits wide and honest. Traffic rattles past at',
        '4.77 megahertz. Lanes lead west into memory, north to the coprocessor,',
        'east toward the disk platters, and south to the modem. A ladder climbs',
        'up to the BIOS ROM; a hatch drops down to the interrupt table.' ],
      listen:'A steady clatter of timer ticks, and underneath it the long patient hiss of a machine that intends to outlive its warranty.',
      x:{ 'traffic|data|lanes|packets': { note:'traffic', t:'You watch the traffic. Keyboard interrupts. A Tableau extract headed for the display adapter. One lost mouse packet looking for a driver that will love it. And a single packet stamped CLASSIFIED that declines, politely, to say where it is going.' },
        'ladder':'Sturdy enough. It leads up to the oldest memory this machine has.',
        'hatch':'It opens onto the bottom of memory, addresses 0000 to 03FF.' } },
    cpu: { name:'The 6502 Coprocessor', exits:{ s:'bus', w:'cmos' },
      desc: F.cpuAwake
        ? [ 'The coprocessor socket. The MOS 6502 rests here, halted at a clean',
            'instruction boundary, looking quietly pleased with itself. The bus',
            'is back south; a thin trace leads west to the CMOS clock.' ]
        : [ 'The coprocessor socket. A MOS 6502 sits here, hand-soldered into a',
            'machine that never officially supported one. Somebody built this',
            'for the joy of it: every cycle stepped, decimal mode and all. The',
            'CPU is frozen mid-instruction; its clock input is silent. The bus',
            'is back south; a thin trace leads west to the CMOS clock.' ],
      listen: F.cpuAwake ? 'Silence, but a smug kind of silence.' : 'Nothing. A CPU without a clock is the quietest thing in the world. It is not asleep. It is between moments.',
      x:{ 'cpu|6502|processor|coprocessor': F.cpuAwake ? ('Halted at $C004, accumulator '+(this.itemLoc.b55==='cpu'?'holding $55.':'empty. It gave you what it had.')) : 'Program counter parked at $C002. The instruction in the decoder is LDA #$55: load the accumulator with $55. It has waited years for one more clock edge.',
        'clock|edge|pin':'The clock input is a bare pin, silent. One tick from a real crystal would do it.',
        'socket|trace|solder':'The solder work is careful, the traces rerouted by hand. Whoever did this checked it twice, then wrote an emulator to check it a third time.',
        'accumulator|register': F.cpuAwake ? (this.itemLoc.b55==='cpu'?'The accumulator reads $55. Yours for the taking.':'Empty now.') : 'Empty. The load never happened.' } },
    cmos: { name:'CMOS / Real-Time Clock', exits:{ e:'cpu' },
      desc:[ 'The real-time clock: a battered CMOS chip with a coin cell riveted',
        'on like a lifeboat. It has kept the date through every winter since the',
        'machine was first assembled in Poughkeepsie. The only way out is east.' ],
      listen: this._crystalGone() ? 'Nothing. You are standing in a stopped clock, which is a strange place to stand.' : 'Tick. 32,768 times a second, which to human ears is one long unbroken note of quiet competence.',
      x:{ 'clock|cmos|rtc|chip|date': this._crystalGone() ? 'Frozen at the moment you took the crystal. It will forgive you if you win.' : 'The date reads '+this._dosDate()+'. Checksum valid. It is quietly proud of this.',
        'battery|cell':'Three volts of stubbornness. Rated for five years, serving its fifteenth.',
        'registers|alarm|alarms|calendar|calendars': { note:'calendars', t:'Two academic calendars are burned into the alarm registers. The older one is set to Danvers, Massachusetts, vocational-technical, honors flagged. The newer one is set to Poughkeepsie, computer science, and it is still accumulating.' } } },
    platters: { name:'The Disk Platters',
      exits: F.headFlying ? { w:'bus', e:'boot' } : { w:'bus' },
      desc: F.headFlying
        ? [ 'The top platter of drive C, a lacquered aluminum plain. The',
            'read-write head sails above the surface at eight microns, on station.',
            'Track 0 lies east. The bus is west.' ]
        : [ 'You stand on the top platter of drive C, a lacquered aluminum plain',
            'spinning at 3,600 rpm, though from up here it feels still. It was',
            'this drive that started failing, this drive that got pulled and',
            'reseated to save it. The read-write head is parked at the far edge,',
            'arms folded, out of service. Track 0 lies east, behind it. Bus west.' ],
      listen:'A hum so pure the platters could tune an orchestra. 3,600 rpm, never sharp, never flat.',
      x:{ 'head|actuator|arm': F.headFlying ? 'Flying at eight microns. From the platter\'s point of view, a jetliner at ankle height.' : 'Parked, by the book, the way heads were parked before every shutdown in the old days. Nothing short of a proper utility will convince it to fly again.',
        'label|sticker|signature|sig': 'A foil service sticker on the hub, half scratched off: DRIVE C  -  D.SIG '+hx(K_ORIG)+'  -  DO NOT RESEAT WHILE SEALED. Somebody reseated it anyway. That is why you are here.',
        'data|files|surface|tracks|sectors|life': { note:'fragments', t:'You kneel and read the surface as it streams past. A bouldering problem annotated hold by hold. A reading list with Red Rising dog-eared and a three-body problem pending. A campus route solver with every shaded path graded. A LiDAR point cloud that still thinks it is driving. An elevation profile for a volcano out west, filed under SOON. Most of it flickers behind a grey haze now, sealed.' },
        'platter|drive|disk':'Certified for 40 megabytes and carrying a whole person\'s work anyway. The defragmenter has been through recently. It did good work.' } },
    boot: { name:'The Boot Sector',
      exits: (A2 ? { w:'platters', e:'volume' } : { w:'platters' }),
      desc: F.posted
        ? [ 'Track 0, sector 1. The last two bytes read 55 AA, as they should;',
            'the machine boots clean now. But past the loader, where the file',
            'system should open, there is a bulkhead that was not here before: a',
            'sealed door stencilled DISKREET. It leads east, into the volume.',
            'The platters are back west.' ]
        : [ 'Track 0, sector 1. Five hundred twelve bytes that decide every',
            'morning whether this machine gets to exist. The code is intact until',
            'the very end, where the boot signature should read 55 AA. It reads',
            '00 00 - knocked loose when the drive was reseated. That silence is',
            'why the machine hesitates. The platters are back west.' ],
      listen: F.posted ? 'Behind the sealed door, a whole disk of held breath.' : 'You put your ear to the sector. Five hundred ten bytes of held breath.',
      x:{ 'signature|bytes|55aa|510|offset': F.posted ? '55 AA. Valid. It got the machine to POST. It could not open the lock behind it.' : 'Two zeroed bytes at offset 510. The BIOS checks them before it will trust a single instruction here. No signature, no boot.',
        'door|bulkhead|diskreet|seal|lock': F.posted ? 'A cipher bulkhead. The stencil reads DISKREET - DES VOLUME CIPHER, and under it: SEALED. RECOVERY PASSPHRASE REQUIRED. It opens east.' : 'Past the loader the way is dim; you can just make out a door that is not yet powered.',
        'code|loader|sector': { note:'loader', t:'You read the loader itself. Compact, patient, hand-tuned: it retries without complaining, fails without drama, and comments its one clever trick so the next person will not have to be clever. Whoever wrote it read the manual twice and the errata once.' } } },
    modem: { name:'The Modem', exits:{ n:'bus' },
      desc: F.modemHooked
        ? [ 'The external modem sits at the end of its serial cable, lights idling',
            'in a slow scan, line hooked and listening. The bus is north.' ]
        : [ 'An external modem squats at the end of its serial cable, lights dark.',
            'A sticker reads 33.6, THE LAST GOOD SPEED. It is off-hook and',
            'sulking: its interrupt line ends in mid-air, connected to nothing.',
            'The bus is north.' ],
      listen:'Through the cable insulation, very faint, a dial tone. Somewhere out there a bulletin board is still up, still answering, out of principle.',
      x:{ 'modem|lights': F.modemHooked ? 'Content, in its way. It did its one job.' : 'The serial port raises IRQ 4 when data arrives, but the vector that should catch it is missing. Any byte down the wire would arrive to an empty room.',
        'sticker|case':'33.6, THE LAST GOOD SPEED. Below it, smaller: 56K IS A LIE THEY TELL AT TRADE SHOWS.',
        'cable|line|wire':'Copper all the way to somewhere. You can feel the dial tone through the insulation, steady as a metronome.',
        'speaker': { note:'speaker', t:'The speaker has played exactly one song its whole life, the handshake, and it plays it with feeling. Someone here keeps drums, a bass, and a guitar upstairs; the modem has been taking notes on timing.' } } },
    bios: { name:'The BIOS ROM', exits:{ d:'bus' },
      desc:[ 'The BIOS ROM: a windowed EPROM under a peeling label, the machine\'s',
        'oldest memory. Near the socket, a three-pin header labeled JP1 wears',
        'its jumper on pins '+(F.jumperWrite?'2 and 3 (WRITE TRK0). Pins 1-2 (SAFE) sit empty.':'1 and 2 (SAFE). Pins 2-3 are marked WRITE TRK0.'),
        'The ladder goes back down.' ],
      listen:'Nothing. ROM does not hum. ROM remembers.',
      x:{ 'rom|eprom|die|window':'Through the quartz window you can see the die. It is beautiful the way bridges are beautiful.',
        'jumper|jp1|header|pins': F.jumperWrite ? 'JP1 sits on WRITE TRK0. Reckless. Correct.' : 'A two-millimeter decision. On SAFE, the controller refuses all writes to track 0. On WRITE TRK0, it minds its own business.',
        'label':'ROHAN-DOS BIOS v2.11, and under it in pencil: DO NOT ERASE AGAIN.',
        'post|self-test|log|test': { note:'postlog', t:'You page through the self-test log. Most nights are routine; some are starred: FALL 2022, CYBER LEAGUE .... PASS. MAY 2024, OUTSTANDING VO-TECH .... PASS. APR 2026, HACKATHON 24 HRS .... BEST OVERALL. The beep, the log notes, has never once been off pitch.' } } },
    irq: { name:'The Interrupt Vector Table', exits:{ u:'bus' },
      desc:[ 'The bottom of memory, 0000 to 03FF, where the interrupt vectors',
        'live. Rows of them stand like signposts, each aimed at its handler:',
        'timer, keyboard, disk. One post is bare. The hatch up to the bus is',
        'overhead.' ],
      listen:'Interrupts arriving and being dispatched, over and over: a train station where every train is on time.',
      x:{ 'vectors|table|signposts|posts|rows':'INT 08 ticking, INT 09 waiting on the keyboard, INT 13 disk services recently oiled. INT 1C runs a small hook that schedules events for a community server and has never missed one. And INT 0C, COM1: bare.',
        'nmi': { note:'nmi', t:'The non-maskable interrupt hums to itself. You cannot mask it. Nobody can. That is the point. When you meet a problem like this, the trick is not to silence it; the trick is to have written a good handler years in advance.' },
        'post|int 0c|0c|com1':'The post for INT 0C, COM1. Whatever it pointed to, it points there no longer.' } },

    // ---------------- ACT 2 : the sealed volume ------------------------
    volume: { name:'The Sealed Volume', exits: (this._lostOpen() ? { w:'boot', n:'keysafe', e:'vram', s:'opl', d:'lostfound' } : { w:'boot', n:'keysafe', e:'vram', s:'opl' }),
      desc: F.unsealed
        ? [ 'The interior of drive C, wide open now. The grey haze is gone; the',
            'files stand in the clear, readable, yours. Keysafe north, video',
            'memory east, the sound chip south. Boot sector west.' ]
        : [ 'The interior of drive C. You expected files; instead a grey cipher',
            'haze fills the space, and behind it you can make out shapes you',
            'cannot read: songs, a couple of homemade games, folders of source,',
            'a drift of photographs. All of it sealed by DISKREET. A lock stands',
            'at the centre, waiting for a passphrase. Keysafe north, video',
            'memory east, the sound chip south, boot sector west.' ],
      listen: F.unsealed ? 'The disk, humming to itself, doing the ordinary work of remembering.' : 'Muffled. Like a room full of people talking behind glass an inch too thick.',
      x:{ 'lock|passphrase|diskreet|cipher|volume|haze|seal': F.unsealed ? 'Open. The DES rounds have all unwound. It keeps its secrets for other people now.' : 'DISKREET, a DES volume cipher. It wants the recovery passphrase. There is a keypad: type  unseal <passphrase> . It will not brute-force; DES does not have the patience and neither do you. The escrowed key-shares are in the Keysafe, north.',
        'files|songs|games|source|photos|photographs|data|shapes': { note:'sealed', t:'You press close to the haze. The shapes resolve just enough to hurt: songs written late at night, two little games that only ever ran on this machine, project folders, photographs from summers that are over. Everything that would be unbearable to lose. Which is, of course, exactly what got sealed.' },
        'floor|bad sectors|badsectors|graveyard|cracks': this._lostOpen() ? 'The cracked sectors gape open; a passage drops down into the lost and found.' : { reveal:'lostfound', t:'You look closer at the floor. The haze is thinner over a patch of bad sectors, where the surface cracked. Peering in, you find a gap wide enough to climb down into. Something is filed down there.' } } },
    keysafe: { name:'The Keysafe', exits:{ s:'volume', w:'floppy' },
      desc:[ 'A small shielded coprocessor: the Keysafe, where DISKREET bound its',
        'volume key to this exact machine. A panel lists the escrowed key-',
        'shares. A single readout, labelled CURRENT FINGERPRINT, glows '+hx(K_NOW)+'.',
        'The volume is south; a short ribbon runs west to drive A.' ],
      listen:'A cricket-thin whine of a chip doing arithmetic it will never explain to you.',
      x:{ 'panel|shares|escrow|table|keyshares|key-shares|share': { note:'escrow', t:'The escrow panel lists four key-shares, one per byte of the passphrase:\n     S0 '+hx(SHARES[0])+'    S1 '+hx(SHARES[1])+'    S2 '+hx(SHARES[2])+'    S3 '+hx(SHARES[3])+'\nEach share is one passphrase byte XOR-masked by the drive\'s signature, so the shares alone are useless without the machine they were bound to. Unmask a share by XOR-ing it with that signature. There is a  xor  tool built into this room.' },
        ['fingerprint|current|readout|'+hx(K_NOW).toLowerCase()]: 'CURRENT FINGERPRINT '+hx(K_NOW)+'. This is what the Keysafe measures NOW, after the reseat. Try to unmask the shares with it and you get garbage: it is not the signature the key was sealed under. The original is stamped on the drive itself.',
        'keysafe|coprocessor|chip': { note:'binding', t:'This is where a key becomes a hostage. DISKREET measured the machine - drive, BIOS, clock - and fused the passphrase to that measurement, so a stolen disk in another machine stays dark. It is good security and a terrible trap: change the hardware, even to fix it, and the disk locks out its own owner. Nobody wrote the passphrase down, because the hardware was supposed to remember it. Then the hardware changed.' } } },
    floppy: { name:'Drive A', exits:{ e:'keysafe' },
      desc:[ 'The 5.25-inch floppy drive, drive A, its door still latched on a',
        'disk. The hand-inked label reads DISKREET KEYS - DO NOT LOSE. This is',
        'where the recovery passphrase was supposed to be saved. The Keysafe is',
        'back east.' ],
      listen:'The floppy ticks as the drive tries, once, to read it, and finds nothing to read.',
      x:{ 'floppy|disk|diskette|label|keys': { note:'neverwrote', t:'You read the escrow floppy. It is blank. Not erased - blank; the save was started and never finished, or finished onto a disk that has since given up its magnetism. The one copy of the passphrase that a careful person keeps in a drawer was never actually written. Out in the real world, this is where the story ends: the key is simply gone, and no drawer, no backup, no support line ever turned it up. In here you have one thing the real world did not - the hardware the key was bound to, still warm. So you will have to take the passphrase back out of the machine itself.' },
        'door|drive|latch':'A good mechanism, precise as a stapler. It did its job. The disk it was handed had nothing on it.' } },
    vram: { name:'Video Memory', exits:{ w:'volume' },
      desc: F.unsealed
        ? [ 'The video buffer, and it is no longer grey. Thumbnails resolve down',
            'the framebuffer - faces, a shoreline, a stage under bad lighting.',
            'The volume is back west.' ]
        : [ 'The video buffer, where the machine keeps whatever it is about to',
            'show. Right now it holds thumbnails, but every one is a grey',
            'rectangle: photographs, sealed, cached but unreadable. The volume',
            'is back west.' ],
      listen:'The flyback transformer sings its one high note, the sound every CRT of a certain age makes when it is trying.',
      x:{ 'thumbnails|photos|photographs|frames|faces|images|buffer': { note:'photos', t: F.unsealed ? 'The frames are readable now. You do not need to name them; they are the kind of photographs that are worth exactly nothing to anyone else and everything to one person. That is the whole category of thing this machine was hiding.' : 'Grey rectangles, each the ghost of a photograph. The palette registers survived; the pixels are enciphered. You can tell there are people in them the way you can tell there is furniture in a dark room.' } } },
    opl: { name:'The Sound Chip', exits:{ n:'volume' },
      desc: F.unsealed
        ? [ 'The OPL synthesiser, and it is playing. A song written on this',
            'machine, years ago, unfinished and unbothered about it, fills the',
            'small space. The volume is back north.' ]
        : [ 'The OPL FM synthesiser: two operators per voice, nine voices, the',
            'exact chip that scored a decade. Its patch memory is loaded and its',
            'output is dead silent - the samples it wants to play are sealed. The',
            'volume is back north.' ],
      listen: F.unsealed ? 'A song. Yours. Nobody else ever had a copy.' : 'The faint hiss of a synth that is powered, patched, and forbidden to make a sound.',
      x:{ 'songs|song|music|samples|patch|synth|chip|opl': { note:'songs', t: F.unsealed ? 'The songs play. A few of them are good and most of them are not, which is what a folder of songs is supposed to be. The point was never that they were good. The point was that they were yours and you thought they were gone.' : 'The patch registers are set for songs somebody wrote here: late, unhurried, unreleased. The note data is enciphered, so the chip sits with its instrument in its hands and no permission to use it.' } } },
    lostfound: { name:'Lost and Found', exits:{ u:'volume' },
      desc:[ 'A cramped space under the bad sectors where the file system keeps',
        'what it could not place: orphaned clusters, a CHK file or two, things',
        'rescued from crashes over the years. It smells of ozone and luck. The',
        'way up is back to the volume.' ],
      listen:'The small contented clicking of a place where lost things wait to be claimed.',
      x:{ 'clusters|chk|files|orphans|junk|pile': { note:'lostfound', t:'FILE0000.CHK, FILE0001.CHK: fragments the disk doctor swept up after old crashes. Most are noise. One is a single readable line of a song lyric with no song attached, and it is better than the song ever was. You leave them where they are. Some things are supposed to stay in the lost and found.' },
        'wd40|can|spray|luck|charm': 'A dented can of drive cleaner and a 2010 arcade token on a keyring. The patron saints of data recovery: contact cleaner and dumb luck.' } },
  }; }

  // ----- small helpers -------------------------------------------------
  _crystalGone(){ return this.inv.indexOf('crystal')>=0 || this.itemLoc.crystal!=='cmos'; }
  _lostOpen(){ return !!this.flags.lostOpen; }
  _dosDate(){ const d=new Date(); const p=(n)=>String(n).padStart(2,'0'); return p(d.getMonth()+1)+'-'+p(d.getDate())+'-'+String(d.getFullYear()); }
  _has(id){ return this.inv.indexOf(id)>=0; }

  // ----- scoring / progress --------------------------------------------
  _award(pts){ this.score=Math.min(100, this.score+pts); return '[+'+pts+' points]'; }
  _noteCatalog(){
    if(this.__notes) return this.__notes;
    const ids=new Set(); const rs=this.rooms();
    Object.keys(rs).forEach(k=>{ const x=rs[k].x||{}; Object.keys(x).forEach(n=>{ const v=x[n]; if(v&&typeof v==='object'&&v.note) ids.add(v.note); }); });
    this.__notes=[...ids]; return this.__notes;
  }
  _noteTotal(){ return this._noteCatalog().length; }
  _noteCount(){ return Object.keys(this.notes).length; }
  _rank(){ const s=this.score;
    if(s>=100) return 'Ring 0';
    if(s>=75)  return 'Resident Utility';
    if(s>=50)  return 'Device Driver';
    if(s>=25)  return 'User-Mode Visitor';
    return 'Unprivileged Process'; }
  _milestones(){ const F=this.flags; return [F.headFlying,F.cpuAwake,F.modemHooked,F.jumperWrite,F.posted,F.volumeSeen,F.escrowRead,F.sigFound,F.unsealed]; }
  _completion(){
    const ms=this._milestones(); const done=ms.filter(Boolean).length;
    const nt=this._noteTotal()||1, ft=this._funTotal()||1;
    return Math.min(100, Math.round(70*(done/ms.length) + 20*(this._noteCount()/nt) + 10*(Object.keys(this.fun).length/ft)));
  }
  _funNote(id){ if(this.fun[id]) return null; this.fun[id]=1; return '[the machine makes a note of that. '+Object.keys(this.fun).length+' of '+this._funTotal()+']'; }
  _funList(){ return [
    { id:'gravity',    did:'jumped on a platter spinning at 3,600 rpm',                  hint:'something about gravity, somewhere fast' },
    { id:'arts',       did:'gave the bus arbitration unit a performance',                hint:'the machine accepts performances, reluctantly' },
    { id:'nose',       did:'smelled the machine',                                        hint:'the machine has a smell' },
    { id:'shell',      did:'typed a DOS command at a process prompt',                    hint:'old habits from the outer shell' },
    { id:'erase',      did:'reached for the one label that asks something of you',       hint:'a label in the ROM asks one thing of you' },
    { id:'xyzzy',      did:'teleported like it was 1977',                                hint:'an old word, from a cave in Kentucky' },
    { id:'timelord',   did:'waited around while personally holding the machine\'s time', hint:'try waiting while time is your fault' },
    { id:'brute',      did:'tried to brute-force a DES volume, briefly',                 hint:'ask the cipher to just give up' },
    { id:'audiophile', did:'heard every room in the machine',                            hint:'every room has a sound; all of them' },
  ]; }
  _funTotal(){ return this._funList().length; }
  _amusing(){
    if(!this.flags.won) return ['That list unlocks after the disk is open. Priorities.'];
    const out=['AMUSING  (the machine kept its own list)'];
    this._funList().forEach(a=> out.push(this.fun[a.id] ? ('  [x] '+a.did) : ('  [ ] ....  ('+a.hint+')')));
    const n=Object.keys(this.fun).length;
    out.push(n>=this._funTotal() ? 'All of them. The machine is genuinely impressed, and slightly concerned.' : (n+' of '+this._funTotal()+'. The blanks are still in there.'));
    return out;
  }
  _checklist(){
    const F=this.flags, bx=(v)=>v?'[x]':'[ ]';
    const l=[ 'ACT 1  -  BRING THE MACHINE UP',
      '  '+bx(F.headFlying)+' disk head flying',
      '  '+bx(F.cpuAwake)+' 6502 woken ($55 recovered)',
      '  '+bx(F.modemHooked)+' modem hooked ($AA received)',
      '  '+bx(F.jumperWrite)+' track 0 write enabled',
      '  '+bx(F.posted)+' boot signature written (POST)' ];
    if(this.act>=2) l.push('ACT 2  -  UNSEAL THE DISK',
      '  '+bx(F.escrowRead)+' key-shares located (Keysafe)',
      '  '+bx(F.sigFound)+' original drive signature found',
      '  '+bx(F.unsealed)+' volume unsealed');
    return l;
  }
  _hint(){
    const F=this.flags, loc=this.itemLoc, say=(...s)=>['HINT.SYS consults its notes:'].concat(s.map(x=>'  '+x));
    if(F.won) return say('nothing left to fix. Some people examine things just to hear the descriptions.');
    if(this.act<2){
      if(!F.cpuAwake){
        if(!this._has('crystal') && loc.crystal==='cmos') return say('a frozen CPU wants one clock edge. Something west of it still keeps perfect time.');
        return say('you are carrying a tick. The 6502, north then... no - it is the CPU that is starving for exactly one.');
      }
      if(this.itemLoc.b55==='cpu' && !this._has('b55')) return say('the accumulator is holding $55 for you. Registers are public property.');
      if(!F.modemHooked){
        if(!this._has('vector') && loc.vector==='irq') return say('the modem cannot deliver to an empty room. Down in the vector table, one signpost is bare and its pointer is on the ground.');
        return say('you are carrying a pointer tagged COM1. The modem, south of the bus, knows what to do with it.');
      }
      if(loc.baa==='modem' && !this._has('baa')) return say('a byte is blinking in the modem\'s receive buffer. Take it.');
      if(!F.headFlying){
        if(!this._has('unpark') && loc.unpark==='memory') return say('the parked head will not move for pedestrians, but a resident in conventional memory was written for exactly this.');
        return say('you are carrying a utility with one job. The parked head, east of the bus, is its job.');
      }
      if(!F.jumperWrite) return say('the controller obeys a two-millimeter jumper up in the BIOS. Walk JP1 from SAFE to WRITE TRK0.');
      return say('you have both signature bytes and the write is enabled. Track 0, east of the platters. Write the signature.');
    }
    // Act 2
    if(!F.volumeSeen) return say('the machine POSTs, but drive C is sealed by DISKREET. East of the boot sector, the volume waits.');
    if(!F.escrowRead) return say('DISKREET wants a passphrase nobody wrote down. Its escrowed key-shares are in the Keysafe, north of the volume. Examine the panel there.');
    if(!F.sigFound) return say('each share is one passphrase byte XOR the drive\'s signature. The Keysafe shows the fingerprint AFTER the reseat, which is wrong. The ORIGINAL signature is stamped on the drive - examine the platter\'s hub label.');
    // has sig: teach the xor
    return say('unmask each share with the original signature: e.g.  xor '+hx(SHARES[0])+' '+hx(K_ORIG)+' . Read each result as an ASCII letter, in order S0 S1 S2 S3. Then  unseal  with the word they spell. (Blank floppy in drive A confirms: the word was never saved; you are rebuilding it.)');
  }

  _lookLines(){ const R=this.rooms()[this.room]; this.seen[this.room]=1;
    const out=['', R.name.toUpperCase(), ...R.desc]; const IT=this.items();
    Object.keys(this.itemLoc).forEach(id=>{ if(this.itemLoc[id]===this.room) out.push(IT[id].here); });
    return out;
  }

  // ----- entry points ---------------------------------------------------
  start(){
    const resumed = this.moves>0 || this.act>1 || this.inv.length>0 || this.room!=='memory';
    const head=['', 'BOOT SECTOR', 'A text adventure in two acts, and 512 bytes of trouble.', ''];
    const best=this._best(); const bestLine = best ? ['(best run: '+best.pct+'% in '+best.moves+' moves.)'] : [];
    const intro = resumed
      ? ['(resuming: Act '+this.act+', '+this._completion()+'% complete, '+this.moves+' moves. type  restart  to start over.)'].concat(bestLine)
      : [ 'You wake as GUEST, an unprivileged process, in the dark of',
          'conventional memory. This machine has been in one pair of hands',
          'since high school, and lately the disk had been failing - so it got',
          'pulled and reseated to save it. It powered back up hesitating, and',
          'worse: the reseat changed the machine just enough that DISKREET, the',
          'cipher guarding drive C, no longer recognises it. The disk is',
          'sealed. The songs, the little games, the projects, the old photos -',
          'locked, behind a passphrase nobody ever wrote down.',
          '',
          'First get the machine to POST. Then take the passphrase back out of',
          'the hardware that still remembers it.',
          '',
          'Type  help  for commands,  map  to get your bearings,  hint  if you',
          'stall. Examine everything. This machine has lived.' ];
    return head.concat(intro, this._lookLines());
  }

  _help(){ return [
    'Commands:',
    '  look (l) . map (m) . listen         get your bearings',
    '  n s e w u d                         move (or  go north , etc.)',
    '  examine <thing> (x)                 look closely - the good stuff is here',
    '  take / drop / inventory (i)',
    '  use <thing> on <thing>              apply one thing to another',
    '  xor <hex> <hex>                     the Keysafe/volume cipher tool (Act 2)',
    '  unseal <passphrase>                 open the disk once you have rebuilt it',
    '  score . hint . restart . quit',
    'Everything else you will have to discover. This machine keeps secrets.',
  ]; }

  _matchItem(noun, ids){ const IT=this.items(); noun=noun.toLowerCase();
    return ids.find(id=> IT[id].names.some(n=> n===noun || noun.indexOf(n)>=0 || n.indexOf(noun)>=0 )); }

  input(raw){
    const out=[]; let quit=false;
    let s=(raw||'').trim().toLowerCase().replace(/\s+/g,' ');
    if(!s) return { lines:['Say again?'], quit:false };
    // keep hex tokens intact; strip filler words
    s=s.replace(/\b(the|a|an|at|to)\b/g,' ').replace(/\s+/g,' ').trim();
    this.moves++;
    const F=this.flags, IT=this.items();
    const words=s.split(' '); let verb=words[0]; let rest=words.slice(1).join(' ');
    if(verb==='go'||verb==='walk'||verb==='climb'||verb==='move'){ if(words[1] && /^(n|s|e|w|u|d|north|south|east|west|up|down)$/.test(words[1])){ verb=words[1]; rest=''; } }
    const DIR={ n:'n',north:'n',s:'s',south:'s',e:'e',east:'e',w:'w',west:'w',u:'u',up:'u',d:'d',down:'d' };

    if(DIR[verb]!==undefined && !rest){
      const R=this.rooms()[this.room]; const to=R.exits[DIR[verb]];
      if(!to){
        if(this.room==='platters' && DIR[verb]==='e' && !F.headFlying) out.push('The parked head blocks the way onto track 0. It will not move for pedestrians.');
        else if(this.room==='boot' && DIR[verb]==='e' && this.act<2) out.push('The DISKREET door is unpowered until the machine POSTs. First get it to boot.');
        else out.push('You can\'t go that way.');
      } else { this.room=to; if(to==='volume') F.volumeSeen=1; out.push(...this._lookLines()); }
      this.save(); return { lines:out, quit };
    }

    switch(verb){
      case 'look': case 'l': out.push(...this._lookLines()); break;
      case 'map': case 'm': out.push(...this._mapLines()); break;
      case 'help': case '?': out.push(...this._help()); break;
      case 'hint': case 'hints': out.push(...this._hint()); break;
      case 'amusing': out.push(...this._amusing()); break;

      case 'listen': { const R=this.rooms()[this.room];
        out.push(R.listen||'The usual electrical weather.');
        if(!this.heard[this.room]){ this.heard[this.room]=1; if(Object.keys(this.heard).length>=Object.keys(this.rooms()).length){ const fn=this._funNote('audiophile'); if(fn) out.push('You have now heard every room in the machine.  '+fn); } }
        break; }

      case 'smell': case 'sniff': { out.push('Ozone, warm dust, a hint of flux. And, impossibly, from somewhere above the case fan, something ambitious happening in a kitchen.');
        const fn=this._funNote('nose'); if(fn) out.push(fn); break; }

      case 'inventory': case 'i': case 'inv':
        if(!this.inv.length){ out.push('You are carrying nothing. Typical for a guest account.'); break; }
        out.push('You are carrying:'); this.inv.forEach(id=> out.push('  '+IT[id].short)); break;

      case 'examine': case 'x': case 'inspect': case 'read': case 'r': {
        if(!rest){ out.push(verb==='read'?'Read what?':'Examine what?'); break; }
        const near=this.inv.concat(Object.keys(this.itemLoc).filter(id=>this.itemLoc[id]===this.room));
        const it=this._matchItem(rest, near); if(it){ out.push(IT[it].desc); break; }
        const R=this.rooms()[this.room]; let hit=null;
        Object.keys(R.x||{}).forEach(k=>{ if(!hit && k.split('|').some(n=> rest===n || rest.indexOf(n)>=0 )) hit=R.x[k]; });
        if(hit){ out.push(...this._resolveExamine(hit)); }
        else if(rest==='me'||rest==='self'||rest==='guest') out.push('GUEST. Priority 0, privileges none, determination unbounded.');
        else out.push('You see nothing special about that.');
        break; }

      case 'take': case 'get': case 'grab': case 'pick': {
        if(rest.indexOf('up ')===0) rest=rest.slice(3);
        if(!rest){ out.push('Take what?'); break; }
        const here=Object.keys(this.itemLoc).filter(id=>this.itemLoc[id]===this.room);
        const it=this._matchItem(rest, here);
        if(!it){ out.push(this._matchItem(rest,this.inv)?'You already have that.':'You can\'t take that.'); break; }
        delete this.itemLoc[it]; this.inv.push(it);
        const pts=IT[it].points && !F['scored_'+it] ? IT[it].points : 0; if(pts) F['scored_'+it]=1;
        out.push((IT[it].takeMsg||('You take '+IT[it].short+'.')) + (pts?('  '+this._award(pts)):'')); break; }

      case 'drop': case 'leave': {
        if(!rest){ out.push('Drop what?'); break; }
        const it=this._matchItem(rest, this.inv); if(!it){ out.push('You aren\'t carrying that.'); break; }
        this.inv=this.inv.filter(x=>x!==it); this.itemLoc[it]=this.room; out.push('Dropped.'); break; }

      case 'use': case 'apply': case 'put': case 'splice': case 'hook': case 'connect': case 'attach': case 'hold':
        out.push(...this._use(verb, rest)); break;

      case 'run': case 'exec': case 'execute': case 'load':
        if(rest.indexOf('unpark')<0){ out.push('Run what?'); break; }
        out.push(...this._use('use','unpark on head')); break;

      case 'move': case 'flip': case 'switch': case 'set':
        if(rest.indexOf('jumper')>=0 || rest.indexOf('jp1')>=0) out.push(...this._moveJumper());
        else out.push('You can\'t do that here.'); break;

      case 'write': case 'fix': case 'repair':
        out.push(...this._writeSig()); break;
      case 'restore':
        if(!rest){ out.push('Progress is saved automatically. There is nothing older to restore.'); break; }
        out.push(...this._writeSig()); break;

      case 'xor': case 'unmask': case 'decrypt': out.push(...this._xor(rest)); break;
      case 'unseal': case 'unlock': case 'decode': out.push(...this._unseal(rest, verb)); break;

      case 'scan': case 'chkdsk':
        if(this.room==='volume'){ out.push(...this._resolveExamine(this.rooms().volume.x['floor|bad sectors|badsectors|graveyard|cracks'])); }
        else out.push('Nothing here needs a surface scan.'); break;

      case 'score': case 'status': case 'progress': case 'stats':
        out.push(...this._checklist(),
          'Completion: '+this._completion()+'%   (side notes '+this._noteCount()+'/'+this._noteTotal()+' - amusements '+Object.keys(this.fun).length+'/'+this._funTotal()+')',
          'Moves: '+this.moves+'.   Standing: '+this._rank()+'.'); break;

      case 'save': this.save(); out.push('Saved. It saves on every move anyway, but the gesture is appreciated.'); break;

      case 'restart': this.reset(); Adventure.wipe(); this.save();
        out.push('', 'The machine forgets you ever existed. Fresh page tables all around.', ...this._lookLines()); break;

      case 'quit': case 'q': case 'exit': case 'bye': this.save(); quit=true;
        out.push('', 'Progress saved: Act '+this.act+', '+this._completion()+'% in '+this.moves+' moves. Type  adventure  to return.'); break;

      case 'xyzzy': case 'plugh':
        if(this.room==='memory') out.push('A hollow voice says, "This is not Colossal Cave." Nothing happens.');
        else { this.room='memory'; out.push('The word echoes down the address lines and, improbably, works.'); const fn=this._funNote('xyzzy'); if(fn) out.push(fn); out.push(...this._lookLines()); }
        break;

      case 'jump':
        if(this.room==='platters'){ out.push('3,600 rpm. No.'); const fn=this._funNote('gravity'); if(fn) out.push(fn); }
        else out.push('You jump. The stack pointer flinches.'); break;

      case 'wait': case 'z':
        if(this._crystalGone()){ out.push('Time passes. Well. For the rest of the machine it doesn\'t, technically. That one is on you.'); const fn=this._funNote('timelord'); if(fn) out.push(fn); }
        else out.push('Time passes.'); break;

      case 'dance': case 'sing': case 'perform': out.push('The bus arbitration unit files a complaint, then quietly asks for an encore.'); { const fn=this._funNote('arts'); if(fn) out.push(fn); } break;

      case 'dir': case 'ls': case 'cd': case 'pwd': case 'cls': out.push('Wrong shell. Out there you are a user. In here you are a process.'); { const fn=this._funNote('shell'); if(fn) out.push(fn); } break;

      case 'erase': case 'del': case 'delete': case 'wipe':
        if(this.room==='bios'){ out.push('You reach toward the pencil line, DO NOT ERASE AGAIN. Somewhere a POST beep clears its throat, once. You put your hand down.'); const fn=this._funNote('erase'); if(fn) out.push(fn); }
        else out.push('There is nothing here you could erase, which is for the best.'); break;

      case 'brute': case 'bruteforce': case 'crack': case 'force': case 'hack':
        out.push('You ask DISKREET to just try every key. It computes, briefly, the year it would finish, declines to share the number, and goes back to sleep. DES was chosen for exactly this reason.'); { const fn=this._funNote('brute'); if(fn) out.push(fn); } break;

      case 'format':
        out.push('format C:  -  the fastest way to make sure nobody ever recovers anything. Absolutely not. That is the opposite of tonight.'); break;

      case 'boot': case 'reboot':
        if(F.won){ this.save(); quit=true; out.push(...this._codaLines()); }
        else if(F.posted) out.push('The machine already POSTed; rebooting now would only re-lock what you have opened. Finish first.');
        else out.push('You call INT 19. The BIOS reads track 0, finds 00 00 where 55 AA should be, and gives up quietly. That is the whole problem.');
        break;

      case 'yell': case 'shout': case 'hello': case 'hi': out.push('Your voice does not carry in unshielded memory.'); break;

      default: out.push('That verb is not in this machine\'s vocabulary. Try  help .');
    }
    this.save();
    return { lines:out, quit };
  }

  _resolveExamine(hit){
    if(typeof hit==='string') return [hit];
    const out=[];
    if(hit.reveal==='lostfound' && !this.flags.lostOpen){ this.flags.lostOpen=1; out.push(hit.t); out.push('A way down opens.  '+this._award(5)); return out; }
    if(hit.note){ const isNew=!this.notes[hit.note]; if(isNew) this.notes[hit.note]=1; out.push(...String(hit.t).split('\n')); if(isNew) out.push('[side note '+this._noteCount()+' of '+this._noteTotal()+' noticed]'); return out; }
    out.push(...String(hit.t).split('\n')); return out;
  }

  _mapLines(){
    const nm=(id,l)=>{ const s=this.seen[id]?l:'?'.repeat(l.length); return this.room===id?'['+s+']':' '+s+' '; };
    const a2=this.act>=2;
    const lines=['MAP OF THE MACHINE   ( [ ] you  -  ???? unexplored )','',
      '   '+nm('cmos','CMOS')+'--'+nm('cpu','6502')+'        '+nm('bios','BIOS'),
      '                |',
      '  '+nm('memory','MEM')+'---'+nm('bus','BUS')+'---'+nm('platters','PLATTERS')+'--'+nm('boot','BOOT'),
      '              /  \\'+(a2?'                 |':''),
      '     '+nm('modem','MODEM')+'   '+nm('irq','VECT')+(a2?'            '+nm('volume','VOLUME'):'') ];
    if(a2){ lines.push(
      '                              /  |  \\',
      '                    '+nm('keysafe','KEYSAFE')+' '+nm('vram','VRAM')+' '+nm('opl','OPL'),
      '                       |'+(this._lostOpen()?'        (down: '+nm('lostfound','LOST+FOUND')+')':''),
      '                    '+nm('floppy','DRIVE A') );
    }
    return lines;
  }

  // ----- Act 1 puzzle verbs --------------------------------------------
  _use(verb, rest){
    const F=this.flags;
    if(!rest) return [ (verb==='hook'||verb==='splice'||verb==='connect'||verb==='attach')?'Hook what to what?':'Use what on what?' ];
    const m=rest.match(/^(.*?)\s+(?:on|onto|with|into|in|against)\s+(.*)$/);
    let a=m?m[1].trim():rest, b=m?m[2].trim():'';
    if(!b){
      if(this.room==='modem' && this._matchItem(a,['vector'])) b='modem';
      else if(this.room==='cpu' && this._matchItem(a,['crystal'])) b='cpu';
      else if(this.room==='platters' && this._matchItem(a,['unpark'])) b='head';
      else return ['Use '+a+' on what?'];
    }
    if(this._matchItem(a,['crystal']) && /cpu|6502|processor|clock|coprocessor|pin/.test(b)){
      if(this.room!=='cpu') return ['The coprocessor is not here.'];
      if(!this._has('crystal')) return ['You don\'t have the crystal.'];
      if(F.cpuAwake) return ['The 6502 has already had its clock edge. It is not greedy.'];
      F.cpuAwake=1; this.itemLoc.b55='cpu';
      return ['You hold the crystal against the bare clock pin.','','tick.','',
        'The 6502 wakes, executes LDA #$55 in two cycles exactly, and halts,',
        'satisfied. After years of waiting, the whole thing took 559',
        'nanoseconds. The accumulator now reads $55.  '+this._award(5)];
    }
    if(this._matchItem(a,['vector']) && /modem|irq|serial|com1|port|line/.test(b)){
      if(this.room!=='modem') return ['The modem is not here.'];
      if(!this._has('vector')) return ['You don\'t have a vector to hook.'];
      if(F.modemHooked) return ['IRQ 4 is already hooked, and holding.'];
      F.modemHooked=1; this.inv=this.inv.filter(x=>x!=='vector'); this.itemLoc.baa='modem';
      return ['You splice the vector onto IRQ 4. The modem\'s lights blink once,','all together, like a creature waking up. It clears its speaker and dials.','',
        '   ATDT . . . RING . . . RING','   CONNECT 33600','',
        'One byte arrives, the far end hangs up, and the byte sits blinking in',
        'the receive buffer: $AA.  '+this._award(5)];
    }
    if((this._matchItem(a,['unpark'])||/unpark/.test(a)) && /head|drive|platter|disk|actuator/.test(b)){
      if(this.room!=='platters') return ['There is no disk head here.'];
      if(!this._has('unpark')) return ['You don\'t have UNPARK.COM.'];
      if(F.headFlying) return ['The head is already flying. UNPARK.COM refuses to run twice; it has standards.'];
      F.headFlying=1;
      return ['UNPARK.COM loads, prints its one message,','','   HEAD RELEASED','',
        'and exits without taking questions. The actuator swings the head off',
        'its ramp; it settles into a graceful float, eight microns up. The way',
        'east is open.  '+this._award(5)];
    }
    if((this._matchItem(a,['b55','baa'])||/byte|bytes|signature|55|aa/.test(a)) && /sector|boot|signature|510|offset|disk/.test(b)) return this._writeSig();
    return ['That does nothing. The machine remains unimpressed.'];
  }

  _moveJumper(){ const F=this.flags;
    if(this.room!=='bios') return ['There is no jumper here.'];
    if(F.jumperWrite) return ['JP1 is already on WRITE TRK0. Leave it. It is nervous enough.'];
    F.jumperWrite=1;
    return ['You walk the jumper cap from SAFE to WRITE TRK0. Somewhere below, a',
      'warranty quietly voids. The controller will now accept writes to track',
      '0.  '+this._award(5)];
  }

  _writeSig(){ const F=this.flags;
    if(F.posted) return ['The signature is already written; the machine POSTs. The lock is past the door, east.'];
    if(this.room!=='boot') return ['There is nothing here that takes a signature.'];
    const has55=this._has('b55'), hasAA=this._has('baa');
    if(!has55 && !hasAA) return ['You have nothing to write. The sector waits.'];
    if(!has55) return ['You have $AA, but a signature is two bytes. $55 is still out there,','somewhere a program counter got stuck.'];
    if(!hasAA) return ['You have $55, but a signature is two bytes. $AA is still out there,','somewhere at the end of a phone line.'];
    if(!F.jumperWrite) return ['The controller declines, politely but in capitals:','','   TRACK 0 WRITE PROTECTED','','Somewhere, a jumper is still set to SAFE.'];
    F.posted=1; this.act=2; this.inv=this.inv.filter(x=>x!=='b55'&&x!=='baa');
    const bonus=this._award(5); this.save();
    return ['You press $55 and $AA into the last two bytes of the sector. The head',
      'lifts. The write completes. For a moment, nothing happens.','',
      'Then, above you, a POST card flickers. The machine inhales.','',
      '   ROHAN-DOS BIOS v2.11','   MEM 640K OK','   DRIVE C: SIGNATURE 55 AA .... VALID','   BOOTING . . .','',
      'And catches. One line, where the file system should mount:','',
      '   DRIVE C: DISKREET VOLUME .... SEALED','   HARDWARE FINGERPRINT CHANGED  -  RECOVERY PASSPHRASE REQUIRED','',
      '*** ACT ONE COMPLETE - the machine is alive, but the disk is locked ***','',
      'The reseat that saved the drive is the same reseat that sealed it. A',
      'door you have not seen before now stands east of here, stencilled',
      'DISKREET. Everything that matters is behind it.  '+bonus,
      '', '(go  east  into the volume. type  hint  any time.)'];
  }

  // ----- Act 2 cipher ---------------------------------------------------
  _parseHex(t){ if(t==null) return NaN; t=String(t).replace(/^0x|^\$/,''); return /^[0-9a-f]{1,2}$/i.test(t)?parseInt(t,16):NaN; }
  _xor(rest){
    if(this.act<2) return ['There is no cipher tool here yet. First get the machine to POST.'];
    if(this.room!=='keysafe' && this.room!=='volume') return ['The  xor  tool is built into the Keysafe (and reaches the lock in the volume). Not here.'];
    const parts=(rest||'').split(/\s+/).filter(Boolean);
    if(parts.length<2) return ['Usage:  xor <hex> <hex>    e.g.  xor '+hx(SHARES[0])+' '+hx(K_ORIG)+
      (this.flags.sigFound?'':'   (find the original signature first - hint  if stuck)')];
    const a=this._parseHex(parts[0]), b=this._parseHex(parts[1]);
    if(isNaN(a)||isNaN(b)) return ['Those are not both hex bytes. Try two values like  62  and  '+hx(K_ORIG)+' .'];
    const r=(a^b)&0xff; const ch=r>=32&&r<127?String.fromCharCode(r):'.';
    const note = (b===K_NOW || a===K_NOW) ? '   (that is the post-reseat fingerprint; it will not unmask cleanly)' : '';
    return ['   '+hx(a)+' XOR '+hx(b)+' = '+hx(r)+'   (\''+ch+'\')'+note];
  }
  _unseal(rest, verb){
    const F=this.flags;
    if(this.act<2) return ['Nothing is sealed yet. First get the machine to POST.'];
    if(F.unsealed) return ['The volume is already open. It keeps its secrets for other people now.'];
    if(this.room!=='volume') return ['The DISKREET lock is in the volume, east of the boot sector. Bring the passphrase there.'];
    let g=(rest||'').trim();
    if(!g) return ['Usage:  unseal <passphrase>  . Rebuild it from the escrowed shares first (Keysafe, north).'];
    // accept the word, or the four hex bytes, or the four decimal codes
    let word=null;
    if(/^[0-9a-f ]+$/i.test(g) && /[0-9a-f]{2}/i.test(g.replace(/\s/g,''))){
      const toks=g.split(/\s+/).map(t=>this._parseHex(t));
      if(toks.every(t=>!isNaN(t))) word=toks.map(t=>String.fromCharCode(t)).join('');
    }
    if(word==null) word=g;
    const norm=word.toUpperCase().replace(/[^A-Z]/g,'');
    if(norm===PASS){
      F.unsealed=1; F.won=1; const bonus=this._award(20); const newBest=this._saveBest(); this.save();
      return this._winLines(bonus, newBest);
    }
    // wrong: tailored nudges
    const shareWords = SHARES.map(x=>String.fromCharCode(x^K_NOW)).join('');
    if(norm===shareWords.toUpperCase().replace(/[^A-Z]/g,'')) return ['DISKREET: KEY REJECTED.','You unmasked the shares with the CURRENT fingerprint. That is the machine','after the reseat - the wrong key. Use the ORIGINAL drive signature.'];
    if(norm===SHARES.map(x=>hx(x)).join('') || /62.?65.?67.?6f/i.test(g)) return ['DISKREET: KEY REJECTED. Those are the masked shares, not the passphrase.','Unmask each one first:  xor <share> <original signature> .'];
    return ['DISKREET: KEY REJECTED.  ('+verb+' '+g+')','The DES rounds fold back up. Rebuild the passphrase from the four shares,','unmasked with the drive\'s original signature, and try the word they spell.'];
  }

  _winLines(bonus, newBest){
    const notes=this._noteCount(), full=notes>=this._noteTotal() && Object.keys(this.fun).length>=this._funTotal();
    const out=['You type the passphrase into the DISKREET keypad. The lock takes it',
      'the way a lock takes the right key: without ceremony. The DES rounds',
      'unwind, sixteen of them, and the grey haze thins, and clears.','',
      '   DRIVE C: DISKREET VOLUME .... OPEN','',
      'And it all comes back at once. Video memory resolves into faces and a',
      'shoreline and a stage under bad lighting. The sound chip, three rooms',
      'away, starts a song somebody wrote here late one night. The little',
      'games have their title screens back. The folders open. Everything that',
      'was sealed is just files again, ordinary and readable and yours.  '+bonus,'',
      'Here is the true part, and the machine will not pretend otherwise:',
      'out in the world with weather in it, the passphrase was never found.',
      'That disk is still dark; those songs and photos are still gone, and no',
      'command in any real shell brings them back. But this machine kept the',
      'one thing the real world lost - the hardware the key was bound to - and',
      'tonight, in here, that was enough. Tonight it all comes home.','',
      '*** You have unsealed the volume ***','',
      'Completion: '+this._completion()+'%'+(newBest?'   (a new best run)':'')+'.  Standing: '+(full?'Ring 0, Archivist':this._rank())+'.'];
    if(full) out.push('You read every story this machine had and found every last thing it hid.','It will not forget that.');
    else out.push('Side notes '+notes+'/'+this._noteTotal()+', amusements '+Object.keys(this.fun).length+'/'+this._funTotal()+'. There is more in here, behind an  examine .');
    out.push('', '(type  boot  to watch it come up clean,  amusing  for what you did along','the way,  restart  to run it again, or  quit .)');
    return out;
  }
  _codaLines(){
    return ['You climb back to the boot sector and pull INT 19 one last time.','',
      'The BIOS reads track 0, finds 55 AA, trusts it. DISKREET measures the',
      'machine, finds it forgiven, and stands aside. Drive C mounts. The whole',
      'machine comes up around you like a house with the lights coming on room',
      'by room: drivers waking, the clock agreeing with itself, a song already',
      'playing somewhere down the bus.','',
      'Somewhere in conventional memory there is now one more resident than the',
      'map admits to. Nobody minds.','','   C:\\> _','','*** THE END ***','',
      'Final: '+this._completion()+'% in '+this.moves+' moves. (type  adventure  any time; the machine remembers.)'];
  }

  // ----- structured state for the GUI button bar -----------------------
  uiHints(){
    const R=this.rooms()[this.room]; const F=this.flags;
    const exits={}; ['n','s','e','w','u','d'].forEach(d=>{ exits[d]=!!R.exits[d]; });
    // takeable items present
    const takes=Object.keys(this.itemLoc).filter(id=>this.itemLoc[id]===this.room)
      .map(id=>({ cmd:'take '+this.items()[id].names[0], label:'Take '+this.items()[id].short }));
    // notable examinables: first noun of each x-entry key
    const exams=Object.keys(R.x||{}).map(k=>k.split('|')[0]).filter(n=>n && n.length<=14)
      .slice(0,6).map(n=>({ cmd:'examine '+n, label:n }));
    // context actions
    const acts=[{cmd:'look',label:'Look'},{cmd:'map',label:'Map'},{cmd:'listen',label:'Listen'},{cmd:'inventory',label:'Items'},{cmd:'hint',label:'Hint'},{cmd:'score',label:'Score'}];
    const cipher = (this.act>=2 && (this.room==='keysafe'||this.room==='volume') && !F.unsealed);
    return { act:this.act, room:this.room, exits, takes, exams, acts, cipher, won:!!F.won };
  }
}

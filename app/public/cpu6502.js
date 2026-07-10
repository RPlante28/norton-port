/* ============================================================================
 * cpu6502.js  —  faithful browser port of tsiraM-6502 (scalar-pipeline branch)
 * Source: github.com/RPlante28/422-tsiraM @ scalar-pipeline  (Rohan Plante)
 *
 * Re-implements the true scalar pipeline:
 *   stages  F (fetch) -> D (decode) -> E (execute) -> W (writeback) -> I (intr)
 *   pipeline slots carry an in-flight instruction through the stages
 *   hazards: fetch stall (LDX in flight before a SYS), INC 2-cycle exec stall,
 *            branch flush (BNE taken), BRK flush
 *   stats:   cycles, instructions retired, IPC, stalls, flushes, bubbles
 *
 * Opcodes implemented (same set as the repo):
 *   A9 LDA #   AD LDA mem   A2 LDX #   AE LDX mem   A0 LDY #   AC LDY mem
 *   8D STA mem 6D ADC mem   EC CPX mem EE INC mem   D0 BNE      18 CLC
 *   EA NOP     00 BRK       FF SYS (x=1 print int Y, x=2 string@Y, x=3 string@op)
 * ==========================================================================*/
(function () {
  "use strict";

  // ---- a single in-flight instruction (PipelineSlot.ts) ----
  function Slot() {
    this.valid = false;       // false = bubble / no-op
    this.opcode = 0x00;
    this.bytesNeeded = 0;     // 1, 2 or 3
    this.bytesRead = 0;
    this.operand1 = 0x00;     // low order
    this.operand2 = 0x00;     // high order
    this.pcState = 0x0000;    // PC when this fetch started
    this.targetAddr = 0x0000;
    this.writeVal = 0x00;
    this.elapsed = 0;         // exec cycle tracker (INC uses 2)
  }
  Slot.prototype.isSkip = function () { return !this.valid; };
  function skip() { return new Slot(); }

  // ---- ASCII table (Ascii.ts) ----
  var ASCII = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
  function decodeByte(b) {
    if (b === 0x00) return "";
    if (b === 0x0A) return "\n";
    if (b === 0x0D) return "\r";
    if (b === 0x09) return "\t";
    if (b >= 0x20 && b <= 0x7E) return ASCII.charAt(b - 0x20);
    return "<?>";
  }
  function hx(n, w) { return (n >>> 0).toString(16).toUpperCase().padStart(w || 2, "0"); }

  function CPU6502() { this.reset(); }

  CPU6502.prototype.reset = function () {
    this.mem = new Uint8Array(0x10000);
    this.mar = 0x0000; this.mdr = 0x00;

    // registers
    this.acc = 0x00; this.xReg = 0x00; this.yReg = 0x00; this.pCount = 0x0000;
    this.z = 0; this.carry = 0;

    // pipeline slots
    this.slotF = skip(); this.slotD = skip(); this.slotE = skip();
    this.slotW = skip(); this.slotI = skip();
    this.stallExec = false; this.stallFetch = false;

    this.halted = false;
    this.out = "";
    this.touched = {};        // addr -> true, for memory highlight

    // stats
    this.cyclesTotal = 0; this.instrsRetired = 0;
    this.stallsFetchHazard = 0; this.stallsExecInc = 0;
    this.flushesBranch = 0; this.flushesBrk = 0; this.bubblesIntoDecode = 0;

    this.loadEnd = 0; this.loadedName = "";
  };

  // ---- memory bus (Memory.ts / Mmu.ts) ----
  CPU6502.prototype._setMAR = function (a) { this.mar = a & 0xFFFF; };
  CPU6502.prototype._read = function () { this.mdr = this.mem[this.mar]; };
  CPU6502.prototype._write = function () { this.mem[this.mar] = this.mdr & 0xFF; this.touched[this.mar] = true; };
  CPU6502.prototype._getMDR = function () { return this.mdr; };
  CPU6502.prototype._setMDR = function (d) { this.mdr = d & 0xFF; };
  CPU6502.prototype.writeImmediate = function (addr, data) { this._setMAR(addr); this._setMDR(data); this._write(); };

  // read byte at PC and advance PC
  CPU6502.prototype._readFromPC = function () {
    this._setMAR(this.pCount); this._read(); this.pCount = (this.pCount + 1) & 0xFFFF;
    return this._getMDR();
  };
  // peek byte at PC, no advance
  CPU6502.prototype._checkPC = function () { this._setMAR(this.pCount); this._read(); return this._getMDR(); };
  CPU6502.prototype._toSigned = function (b) { return (b > 0x7F) ? b - 0x100 : b; };

  CPU6502.prototype._opcodeBytes = function (op) {
    switch (op) {
      case 0xEA: case 0x00: case 0x18: return 1;
      case 0xA9: case 0xA2: case 0xA0: case 0xD0: return 2;
      case 0xAD: case 0xAE: case 0xAC: case 0x8D: case 0x6D: case 0xEC: case 0xEE: return 3;
      case 0xFF: return (this.xReg === 0x03) ? 3 : 1;   // SYS byte count depends on X
      default: return 1;
    }
  };

  // ====================  the clock pulse (Cpu.ts pulse())  ====================
  CPU6502.prototype.pulse = function () {
    if (this.halted) return;
    this.cyclesTotal++;

    // INC stalls exec for a 2nd cycle
    var stall = !this.slotE.isSkip() && this.slotE.opcode === 0xEE && this.slotE.elapsed === 0;

    // run stages BACKWARDS so each can read the slot before it
    this._interruptCheck(this.slotI);
    this.slotI = this._writeBack(this.slotW);

    if (stall) { this.slotW = this._exec(this.slotE); return; }

    this.slotW = this._exec(this.slotE);
    this.slotE = this._decode(this.slotD);
    this.slotD = this._fetch(this.slotF);
    this.slotF = this._startContFetch(this.slotF);
  };

  CPU6502.prototype._fetch = function (slot) {
    if (slot.isSkip()) return skip();
    if (slot.bytesRead < slot.bytesNeeded) { this.bubblesIntoDecode++; return skip(); }
    if (slot.bytesNeeded === 3) slot.targetAddr = (slot.operand2 << 8) + slot.operand1;
    return slot;
  };

  CPU6502.prototype._startContFetch = function (slot) {
    if (slot.isSkip() || slot.bytesRead >= slot.bytesNeeded) {
      // hazard: a SYS (FF) is next but an LDX is in flight that sets X
      var pcVal = this._checkPC();
      if (pcVal === 0xFF && this._ldxRun()) {
        this.stallFetch = true; this.stallsFetchHazard++;
        return skip();
      }
      var fresh = new Slot();
      fresh.valid = true;
      fresh.pcState = this.pCount;
      fresh.opcode = this._readFromPC();
      fresh.bytesRead = 1;
      fresh.bytesNeeded = this._opcodeBytes(fresh.opcode);
      return fresh;
    }
    this.stallFetch = false;
    if (slot.bytesRead === 1) { slot.operand1 = this._readFromPC(); slot.bytesRead = 2; }
    else if (slot.bytesRead === 2) { slot.operand2 = this._readFromPC(); slot.bytesRead = 3; }
    return slot;
  };

  CPU6502.prototype._decode = function (slot) {
    if (slot.isSkip()) return skip();
    if (slot.bytesNeeded === 3) this._setMAR(slot.targetAddr);
    return slot;
  };

  CPU6502.prototype._exec = function (slot) {
    if (slot.isSkip()) { this.stallExec = false; return skip(); }

    if (slot.opcode === 0xEE) {          // INC: 2-cycle exec
      if (slot.elapsed === 0) {
        this._setMAR(slot.targetAddr); this._read();
        slot.writeVal = this._getMDR();
        slot.elapsed = 1; this.stallExec = true; this.stallsExecInc++;
        return skip();                   // feed W a bubble so it stalls
      } else {
        slot.writeVal = (slot.writeVal + 1) & 0xFF;
        this.acc = slot.writeVal;
        slot.elapsed = 2; this.stallExec = false; this.instrsRetired++;
        return slot;
      }
    }

    this.stallExec = false; this.instrsRetired++;
    this._doExec(slot);
    return slot;
  };

  CPU6502.prototype._writeBack = function (slot) {
    if (slot.isSkip()) return skip();
    switch (slot.opcode) {
      case 0x8D: // STA
      case 0xEE: // INC
        this._setMAR(slot.targetAddr); this._setMDR(slot.writeVal); this._write();
        break;
    }
    return slot;
  };

  CPU6502.prototype._interruptCheck = function (slot) {
    if (slot.isSkip()) return;
    // no live interrupt devices in the web build
  };

  CPU6502.prototype._doExec = function (slot) {
    switch (slot.opcode) {
      case 0xA9: this.acc = slot.operand1; break;                                   // LDA #
      case 0xAD: this._setMAR(slot.targetAddr); this._read(); this.acc = this._getMDR(); break; // LDA mem
      case 0xA2: this.xReg = slot.operand1; break;                                  // LDX #
      case 0xAE: this._setMAR(slot.targetAddr); this._read(); this.xReg = this._getMDR(); break; // LDX mem
      case 0xA0: this.yReg = slot.operand1; break;                                  // LDY #
      case 0xAC: this._setMAR(slot.targetAddr); this._read(); this.yReg = this._getMDR(); break; // LDY mem
      case 0x8D: slot.writeVal = this.acc; break;                                   // STA mem (write in W)
      case 0x6D: {                                                                  // ADC
        this._setMAR(slot.targetAddr); this._read();
        var sum = this.acc + this._getMDR() + this.carry;
        this.carry = (sum > 0xFF) ? 1 : 0;
        this.acc = sum & 0xFF;
        break;
      }
      case 0x18: this.carry = 0; break;                                             // CLC
      case 0xEA: break;                                                             // NOP
      case 0x00:                                                                    // BRK
        this.halted = true; this._flush(); this.flushesBrk++;
        break;
      case 0xEC:                                                                    // CPX
        this._setMAR(slot.targetAddr); this._read();
        this.z = (this._getMDR() === this.xReg) ? 1 : 0;
        break;
      case 0xD0: {                                                                  // BNE
        var jump = this._toSigned(slot.operand1);
        if (this.z === 0) {
          this.pCount = (slot.pcState + 2 + jump) & 0xFFFF;
          this._flush(); this.flushesBranch++;
        }
        break;
      }
      case 0xFF:                                                                    // SYS
        if (this.xReg === 0x01) this._sysOut(this.yReg.toString(16).toUpperCase());
        else if (this.xReg === 0x02) this._outString(this.yReg);
        else if (this.xReg === 0x03) this._outString(slot.targetAddr);
        break;
    }
  };

  CPU6502.prototype._ldxRun = function () {
    var ldx = function (op) { return op === 0xA2 || op === 0xAE; };
    if (!this.slotF.isSkip() && ldx(this.slotF.opcode)) return true;
    if (!this.slotD.isSkip() && ldx(this.slotD.opcode)) return true;
    if (!this.slotE.isSkip() && ldx(this.slotE.opcode)) return true;
    if (!this.slotW.isSkip() && ldx(this.slotW.opcode)) return true;
    return false;
  };

  CPU6502.prototype._flush = function () { this.slotF = skip(); this.slotD = skip(); };

  CPU6502.prototype._sysOut = function (t) { this.out += t; };
  CPU6502.prototype._outString = function (startAddr) {
    var s = "", a = startAddr;
    while (true) {
      this._setMAR(a); this._read();
      var b = this._getMDR();
      if (b === 0x00) break;
      s += decodeByte(b); a++;
      if (a > 0xFFFF) break;
    }
    this._sysOut(s);
  };

  // ====================  program loading  ====================
  // Run a list of [addr, byte] writes (mirrors System.ts writeImmediate calls)
  CPU6502.prototype.loadWrites = function (writes, name) {
    this.reset();
    var maxA = 0;
    for (var i = 0; i < writes.length; i++) {
      this.writeImmediate(writes[i][0], writes[i][1]);
      if (writes[i][0] > maxA) maxA = writes[i][0];
    }
    this.touched = {};        // clear load highlights
    this.loadEnd = maxA; this.loadedName = name || "";
    this.pCount = 0x0000;
    return { ok: true };
  };

  // Parse a hex listing. Supports:
  //   ; comment   // comment       (to end of line)
  //   AABB:        origin marker (cursor jumps here)
  //   AA           a byte (loaded at cursor, cursor++)
  CPU6502.prototype.loadHexText = function (text, name) {
    var writes = [], cursor = 0x0000, errs = [];
    var lines = String(text).split(/\r?\n/);
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li].replace(/;.*$/, "").replace(/\/\/.*$/, "");
      var toks = line.split(/[\s,]+/).filter(Boolean);
      for (var t = 0; t < toks.length; t++) {
        var tok = toks[t];
        var mOrg = /^\$?([0-9A-Fa-f]{1,4}):$/.exec(tok);
        if (mOrg) { cursor = parseInt(mOrg[1], 16) & 0xFFFF; continue; }
        var mByte = /^\$?([0-9A-Fa-f]{2})$/.exec(tok);
        if (mByte) { writes.push([cursor, parseInt(mByte[1], 16)]); cursor = (cursor + 1) & 0xFFFF; continue; }
        errs.push("line " + (li + 1) + ": ?\u201C" + tok + "\u201D");
      }
    }
    if (writes.length === 0 && errs.length === 0) errs.push("no bytes found");
    if (errs.length) return { ok: false, errors: errs };
    this.loadWrites(writes, name);
    return { ok: true, bytes: writes.length };
  };

  // ====================  tiny assembler  ====================
  // mnemonic -> mode -> opcode
  var OPC = {
    LDA: { imm: 0xA9, abs: 0xAD }, LDX: { imm: 0xA2, abs: 0xAE }, LDY: { imm: 0xA0, abs: 0xAC },
    STA: { abs: 0x8D }, ADC: { abs: 0x6D }, CPX: { abs: 0xEC }, INC: { abs: 0xEE },
    BNE: { rel: 0xD0 }, CLC: { imp: 0x18 }, NOP: { imp: 0xEA }, BRK: { imp: 0x00 },
    SYS: { imp: 0xFF, abs: 0xFF }   // SYS or SYS $addr (3 bytes)
  };
  function isHex(s) { return /^[0-9A-Fa-f]+$/.test(s); }

  CPU6502.prototype.assemble = function (text, name) {
    var lines = String(text).split(/\r?\n/);
    var labels = {}, errs = [];
    // ---- pass 1: addresses + labels ----
    var loc = 0x0000, parsed = [];
    for (var li = 0; li < lines.length; li++) {
      var raw = lines[li].replace(/;.*$/, "").replace(/\/\/.*$/, "").trim();
      if (!raw) continue;
      var lbl = /^([A-Za-z_][A-Za-z0-9_]*):/.exec(raw);
      if (lbl) { labels[lbl[1].toUpperCase()] = loc; raw = raw.slice(lbl[0].length).trim(); if (!raw) continue; }
      var parts = raw.split(/\s+/);
      var head = parts[0].toUpperCase();

      if (head === ".ORG") { var a = parseNum(parts[1]); if (a == null) errs.push("line " + (li + 1) + ": bad .org"); else loc = a & 0xFFFF; continue; }
      if (head === ".BYTE" || head === ".DB") {
        var rest = raw.slice(parts[0].length).trim();
        var bytes = parseDataBytes(rest);
        if (bytes == null) { errs.push("line " + (li + 1) + ": bad .byte"); continue; }
        parsed.push({ li: li, kind: "data", addr: loc, bytes: bytes }); loc += bytes.length; continue;
      }
      if (!OPC[head]) { errs.push("line " + (li + 1) + ": unknown \u201C" + head + "\u201D"); continue; }
      var operand = parts.slice(1).join(" ").trim();
      var size = instrSize(head, operand);
      parsed.push({ li: li, kind: "insn", addr: loc, mnem: head, operand: operand });
      loc += size;
    }
    // ---- pass 2: emit ----
    var writes = [];
    for (var p = 0; p < parsed.length; p++) {
      var it = parsed[p];
      if (it.kind === "data") { for (var b = 0; b < it.bytes.length; b++) writes.push([it.addr + b, it.bytes[b]]); continue; }
      var spec = OPC[it.mnem], op = it.operand;
      // implied
      if (op === "") {
        if (spec.imp == null) { errs.push("line " + (it.li + 1) + ": " + it.mnem + " needs an operand"); continue; }
        writes.push([it.addr, spec.imp]); continue;
      }
      // immediate  #$xx / #dd
      if (op[0] === "#") {
        if (spec.imm == null) { errs.push("line " + (it.li + 1) + ": " + it.mnem + " has no immediate form"); continue; }
        var iv = parseNum(op.slice(1));
        if (iv == null) { errs.push("line " + (it.li + 1) + ": bad immediate"); continue; }
        writes.push([it.addr, spec.imm], [it.addr + 1, iv & 0xFF]); continue;
      }
      // relative (BNE label / BNE $addr)
      if (spec.rel != null) {
        var tgt = resolve(op, labels);
        if (tgt == null) { errs.push("line " + (it.li + 1) + ": bad branch target"); continue; }
        var off = (tgt - (it.addr + 2));
        if (off < -128 || off > 127) { errs.push("line " + (it.li + 1) + ": branch out of range"); continue; }
        writes.push([it.addr, spec.rel], [it.addr + 1, off & 0xFF]); continue;
      }
      // absolute (or SYS $addr)
      if (spec.abs == null) { errs.push("line " + (it.li + 1) + ": " + it.mnem + " has no absolute form"); continue; }
      var av = resolve(op, labels);
      if (av == null) { errs.push("line " + (it.li + 1) + ": bad address"); continue; }
      writes.push([it.addr, spec.abs], [it.addr + 1, av & 0xFF], [it.addr + 2, (av >> 8) & 0xFF]);
    }
    if (errs.length) return { ok: false, errors: errs };
    this.loadWrites(writes, name);
    return { ok: true, bytes: writes.length, labels: labels };

    function instrSize(mnem, operand) {
      var s = OPC[mnem];
      if (operand === "") return 1;            // implied (incl. bare SYS)
      if (operand[0] === "#") return 2;
      if (s.rel != null) return 2;
      return 3;                                // absolute / SYS $addr
    }
  };

  function parseNum(s) {
    if (s == null) return null; s = s.trim();
    if (s[0] === "$") { var h = s.slice(1); return isHex(h) ? parseInt(h, 16) : null; }
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    return null;
  }
  function resolve(s, labels) {
    s = s.trim();
    var n = parseNum(s); if (n != null) return n & 0xFFFF;
    var key = s.toUpperCase();
    if (labels.hasOwnProperty(key)) return labels[key];
    return null;
  }
  function parseDataBytes(rest) {
    var out = [];
    // supports  "string"  and  $xx / dd  separated by , or space
    var re = /"([^"]*)"|\$([0-9A-Fa-f]{1,2})|(\d{1,3})/g, m;
    var any = false;
    while ((m = re.exec(rest))) {
      any = true;
      if (m[1] != null) { for (var i = 0; i < m[1].length; i++) out.push(m[1].charCodeAt(i) & 0xFF); }
      else if (m[2] != null) out.push(parseInt(m[2], 16) & 0xFF);
      else if (m[3] != null) out.push(parseInt(m[3], 10) & 0xFF);
    }
    return any ? out : null;
  }

  // ====================  run / state  ====================
  CPU6502.prototype.step = function () { this.pulse(); };
  CPU6502.prototype.runBurst = function (n) {
    var i = 0;
    for (; i < n && !this.halted; i++) this.pulse();
    return i;
  };

  CPU6502.prototype.ipc = function () { return this.cyclesTotal === 0 ? 0 : this.instrsRetired / this.cyclesTotal; };

  function slotView(s) {
    if (s.isSkip()) return { op: "--", mnem: "bubble", empty: true };
    return { op: hx(s.opcode), mnem: MNEM[s.opcode] || ".byte", empty: false };
  }
  var MNEM = {
    0xA9: "LDA #", 0xAD: "LDA a", 0xA2: "LDX #", 0xAE: "LDX a", 0xA0: "LDY #", 0xAC: "LDY a",
    0x8D: "STA a", 0x6D: "ADC a", 0xEC: "CPX a", 0xEE: "INC a", 0xD0: "BNE", 0x18: "CLC",
    0xEA: "NOP", 0x00: "BRK", 0xFF: "SYS"
  };
  CPU6502.MNEM = MNEM;
  CPU6502.prototype.hx = hx;

  CPU6502.prototype.state = function () {
    return {
      acc: hx(this.acc), x: hx(this.xReg), y: hx(this.yReg), pc: hx(this.pCount, 4),
      z: this.z, carry: this.carry,
      halted: this.halted,
      out: this.out,
      stages: {
        F: slotView(this.slotF), D: slotView(this.slotD), E: slotView(this.slotE),
        W: slotView(this.slotW), I: slotView(this.slotI)
      },
      stallFetch: this.stallFetch, stallExec: this.stallExec,
      stats: {
        cycles: this.cyclesTotal, retired: this.instrsRetired, ipc: this.ipc(),
        fetchStalls: this.stallsFetchHazard, incStalls: this.stallsExecInc,
        branchFlushes: this.flushesBranch, brkFlushes: this.flushesBrk, bubbles: this.bubblesIntoDecode
      },
      loadedName: this.loadedName
    };
  };

  // zero-page (or any page) hex dump for the UI
  CPU6502.prototype.dumpPage = function (page) {
    page = (page || 0) & 0xFF;
    var base = page << 8, rows = [];
    for (var r = 0; r < 16; r++) {
      var cells = [];
      for (var c = 0; c < 16; c++) {
        var a = base + r * 16 + c, v = this.mem[a];
        cells.push({ v: hx(v), zero: v === 0, pc: a === this.pCount, touched: !!this.touched[a] });
      }
      rows.push({ addr: hx(base + r * 16, 4), cells: cells });
    }
    return rows;
  };

  // ====================  sample programs (from System.ts appendix)  ====================
  // expressed as the exact writeImmediate sequences so output is identical
  function block(start, arr) { var w = []; for (var i = 0; i < arr.length; i++) w.push([start + i, arr[i]]); return w; }

  var SAMPLES = {};

  // Hello World — loadSystemCallProgram()
  SAMPLES.HELLO = {
    file: "HELLO.6502", title: "Hello World",
    desc: "Prints \u201CHello World!\u201D via SYS string calls.",
    writes: block(0x0000, [0xA9,0x0A,0x8D,0x40,0x00,0xAC,0x40,0x00,0xA2,0x01,0xFF,0xA2,0x03,0xFF,0x50,0x00])
      .concat(block(0x0050, [0x0A,0x48,0x65,0x6C,0x6C,0x6F,0x20,0x57,0x6F,0x72,0x6C,0x64,0x21,0x0A,0x00]))
  };

  // Powers of two — loadPowersProgram()
  SAMPLES.POWERS = {
    file: "POWERS.6502", title: "Powers / counter",
    desc: "Accumulates with ADC and prints each value, looping with BNE.",
    writes: block(0x0000, [0xA9,0x00,0x8D,0x40,0x00,0xA9,0x01,0x6D,0x40,0x00,0x8D,0x40,0x00,0xAC,0x40,0x00,0xA2,0x01,0xFF,0xA2,0x03,0xFF,0x50,0x00,0xD0,0xED])
      .concat([[0x0050, 0x2C], [0x0052, 0x00]])
  };

  // INC pipeline test — loadIncTest()
  SAMPLES.INCTEST = {
    file: "INCTEST.6502", title: "INC pipeline test",
    desc: "Two back-to-back INC $0040 — exercises the 2-cycle execute stall.",
    writes: block(0x0000, [0xEE,0x40,0x00,0xEE,0x40,0x00,0x00]).concat([[0x0040, 0x05]])
  };

  // Carry test — loadCarryTest()
  SAMPLES.CARRY = {
    file: "CARRY.6502", title: "Carry-flag test",
    desc: "0x60 + 0x60 with ADC, then prints — checks the carry flag.",
    writes: block(0x0000, [0xA9,0x60,0x8D,0x10,0x00,0xA9,0x60,0x6D,0x10,0x00,0xA8,0xA2,0x01,0xFF,0x00,0x00])
  };

  // Fibonacci (24-bit) — loadFibonacciProgram()
  var FIB = [
    0xA9,0x00,0x8D,0x80,0x00,0x8D,0x81,0x00,0x8D,0x82,
    0x00,0x8D,0x84,0x00,0x8D,0x85,0x00,0xA9,0x01,0x8D,
    0x83,0x00,0xAC,0x82,0x00,0xA2,0x01,0xFF,0xA2,0x03,
    0xFF,0x90,0x00,0xAC,0x81,0x00,0xA2,0x01,0xFF,0xA2,
    0x03,0xFF,0x90,0x00,0xAC,0x80,0x00,0xA2,0x01,0xFF,
    0xA2,0x03,0xFF,0x93,0x00,0x18,0xAD,0x80,0x00,0x6D,
    0x83,0x00,0x8D,0x86,0x00,0xAD,0x81,0x00,0x6D,0x84,
    0x00,0x8D,0x87,0x00,0xAD,0x82,0x00,0x6D,0x85,0x00,
    0x8D,0x88,0x00,0xAD,0x83,0x00,0x8D,0x80,0x00,0xAD,
    0x84,0x00,0x8D,0x81,0x00,0xAD,0x85,0x00,0x8D,0x82,
    0x00,0xAD,0x86,0x00,0x8D,0x83,0x00,0xAD,0x87,0x00,
    0x8D,0x84,0x00,0xAD,0x88,0x00,0x8D,0x85,0x00,0xD0,
    0x9D
  ];
  SAMPLES.FIB = {
    file: "FIB.6502", title: "Fibonacci (24-bit)",
    desc: "24-bit Fibonacci sequence; prints High-Mid-Low bytes separated by '-'.",
    writes: block(0x0000, FIB).concat([[0x0090, 0x2D], [0x0091, 0x00], [0x0093, 0x20], [0x0094, 0x00]])
  };

  // turn a writes[] into a readable hex listing (grouped, with org markers)
  function writesToText(s) {
    var map = {}, addrs = [];
    s.writes.forEach(function (w) { if (!(w[0] in map)) addrs.push(w[0]); map[w[0]] = w[1]; });
    addrs.sort(function (a, b) { return a - b; });
    var out = ["; " + s.title, "; " + s.desc, ";", "; edit the bytes and press Reload to run your changes", ""];
    var i = 0;
    while (i < addrs.length) {
      var start = addrs[i], row = [], a = start;
      while (i < addrs.length && addrs[i] === a && row.length < 8) { row.push(hx(map[addrs[i]])); a++; i++; }
      out.push(hx(start, 4) + ": " + row.join(" "));
    }
    return out.join("\n") + "\n";
  }
  SAMPLES.HELLO.text = writesToText(SAMPLES.HELLO);
  SAMPLES.POWERS.text = writesToText(SAMPLES.POWERS);
  SAMPLES.INCTEST.text = writesToText(SAMPLES.INCTEST);
  SAMPLES.CARRY.text = writesToText(SAMPLES.CARRY);
  SAMPLES.FIB.text = writesToText(SAMPLES.FIB);

  // a starter assembly file users can copy
  SAMPLES.STARTER_ASM =
    "; MYPROG.ASM  —  write your own 6502 program!\n" +
    "; assembled by the built-in mini-assembler.\n" +
    "; opcodes: LDA LDX LDY STA ADC CPX INC BNE CLC NOP SYS BRK\n" +
    ";\n" +
    "        LDA #$0A      ; A = newline\n" +
    "        STA $0040     ; store it\n" +
    "        LDY $0040     ; Y = char to print\n" +
    "        LDX #$01      ; SYS mode 1 = print Y as hex int\n" +
    "        SYS\n" +
    "        LDX #$03      ; SYS mode 3 = print string at addr\n" +
    "        SYS MSG\n" +
    "        BRK\n" +
    "MSG:    .byte \"hi rohan\", $00\n";

  CPU6502.SAMPLES = SAMPLES;
  CPU6502.decodeByte = decodeByte;

  window.CPU6502 = CPU6502;
})();

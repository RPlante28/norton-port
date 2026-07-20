// Packs the built site into site.zip for a two-click cPanel deploy.
// The zip contains the CONTENTS of dist/ at its root, so extracting it inside
// public_html/ drops index.html + assets straight where they belong.
//
// Zero external dependencies: a small built-in ZIP writer (Node's zlib), so
// `npm run deploy` works on any clone without needing adm-zip installed.
import { existsSync, statSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, 'site.zip');

if (!existsSync(dist)) {
  console.error('No dist/ folder - run `npm run build` first (or just use `npm run deploy`).');
  process.exit(1);
}

// Collect every file under dist/, keyed by its forward-slash relative path.
function walk(dir, base, acc) {
  for (const name of readdirSync(dir)) {
    // Never ship counter.dat: it's the live visitor count, written server-side.
    // Bundling it would overwrite the real total on the next deploy.
    if (name === 'counter.dat') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, base, acc);
    else acc.push({ name: relative(base, full).split(sep).join('/'), data: readFileSync(full) });
  }
  return acc;
}
const files = walk(dist, dist, []);

// CRC-32 (the checksum ZIP entries require).
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const locals = [];
const central = [];
let offset = 0;

for (const f of files) {
  const nameBuf = Buffer.from(f.name, 'utf8');
  const crc = crc32(f.data);
  const deflated = deflateRawSync(f.data);
  const store = deflated.length >= f.data.length; // don't grow tiny/incompressible files
  const method = store ? 0 : 8;
  const body = store ? f.data : deflated;

  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); // local file header signature
  lh.writeUInt16LE(20, 4); // version needed
  lh.writeUInt16LE(0, 6); // flags
  lh.writeUInt16LE(method, 8);
  lh.writeUInt16LE(0, 10); // mod time
  lh.writeUInt16LE(0x21, 12); // mod date (1980-01-01)
  lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(body.length, 18); // compressed size
  lh.writeUInt32LE(f.data.length, 22); // uncompressed size
  lh.writeUInt16LE(nameBuf.length, 26);
  lh.writeUInt16LE(0, 28); // extra length
  locals.push(lh, nameBuf, body);

  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); // central directory header signature
  ch.writeUInt16LE(20, 4); // version made by
  ch.writeUInt16LE(20, 6); // version needed
  ch.writeUInt16LE(0, 8); // flags
  ch.writeUInt16LE(method, 10);
  ch.writeUInt16LE(0, 12); // mod time
  ch.writeUInt16LE(0x21, 14); // mod date
  ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(body.length, 20);
  ch.writeUInt32LE(f.data.length, 24);
  ch.writeUInt16LE(nameBuf.length, 28);
  ch.writeUInt16LE(0, 30); // extra
  ch.writeUInt16LE(0, 32); // comment
  ch.writeUInt16LE(0, 34); // disk number start
  ch.writeUInt16LE(0, 36); // internal attrs
  ch.writeUInt32LE(0, 38); // external attrs
  ch.writeUInt32LE(offset, 42); // local header offset
  central.push(ch, nameBuf);

  offset += lh.length + nameBuf.length + body.length;
}

const localBuf = Buffer.concat(locals);
const centralBuf = Buffer.concat(central);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
eocd.writeUInt16LE(0, 4); // disk number
eocd.writeUInt16LE(0, 6); // disk with central dir
eocd.writeUInt16LE(files.length, 8); // entries on this disk
eocd.writeUInt16LE(files.length, 10); // total entries
eocd.writeUInt32LE(centralBuf.length, 12); // central dir size
eocd.writeUInt32LE(localBuf.length, 16); // central dir offset
eocd.writeUInt16LE(0, 20); // comment length

writeFileSync(out, Buffer.concat([localBuf, centralBuf, eocd]));

const kb = (statSync(out).size / 1024).toFixed(0);
console.log(`\n  ✓ site.zip ready (${kb} KB, ${files.length} files)`);
console.log('  → cPanel → File Manager → public_html/ → Upload site.zip → Extract → delete the zip.\n');

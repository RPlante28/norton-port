// Deploy the built site to cPanel over FTP/FTPS - no SSH shell access needed
// (GoDaddy shared hosting has shell off by default, but FTP is always available).
// Uploads file-by-file with a live progress bar (files, %, and bytes).
//
// Config: an "ftp" block in app/deploy.json (git-ignored), or env vars.
//   "ftp": {
//     "host": "rohanplante.com",
//     "user": "deploy@rohanplante.com",   // a cPanel FTP account (or the cPanel user)
//     "password": "…",                    // that account's password
//     "path": "public_html",              // target dir (use "/" if the FTP account is rooted at public_html)
//     "secure": true                      // FTPS (explicit TLS); set false for plain FTP
//   }
// Env overrides: FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_PATH, FTP_SECURE(=0 for plain).
import { Client } from 'basic-ftp';
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep, posix } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const cfgPath = join(root, 'deploy.json');

let cfg = {};
if (existsSync(cfgPath)) {
  try { cfg = JSON.parse(readFileSync(cfgPath, 'utf8')); }
  catch { console.error('deploy.json is not valid JSON.'); process.exit(1); }
}
const f = cfg.ftp || {};
const host = process.env.FTP_HOST || f.host;
const user = process.env.FTP_USER || f.user;
const password = process.env.FTP_PASSWORD || f.password;
const path = process.env.FTP_PATH || f.path || 'public_html';
const secure = process.env.FTP_SECURE ? process.env.FTP_SECURE !== '0' : (f.secure !== false); // default FTPS

if (!existsSync(dist)) { console.error('No dist/ - run `npm run build` first (or use `npm run deploy`).'); process.exit(1); }
if (!host || !user || !password) {
  console.error('Missing FTP config. Add an "ftp" block to app/deploy.json (see deploy.example.json)\nor set FTP_HOST / FTP_USER / FTP_PASSWORD.');
  process.exit(1);
}

// ---- collect the files to upload, grouped by remote sub-directory ----
function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, acc);
    else acc.push({ abs, rel: relative(dist, abs).split(sep).join('/'), size: statSync(abs).size });
  }
  return acc;
}
const files = walk(dist, []);
const dirs = new Set(files.map((x) => (x.rel.includes('/') ? posix.dirname(x.rel) : '.')));
const totalFiles = files.length;
const totalBytes = files.reduce((n, x) => n + x.size, 0);

// group files by their directory so we only ensureDir once per folder
const byDir = new Map();
for (const file of files) {
  const d = file.rel.includes('/') ? posix.dirname(file.rel) : '.';
  if (!byDir.has(d)) byDir.set(d, []);
  byDir.get(d).push(file);
}

// ---- progress bar ----
const human = (b) => (b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
function bar(done, bytesDone, label) {
  const pct = totalFiles ? done / totalFiles : 1;
  const width = 26, filled = Math.round(width * pct);
  const gauge = '█'.repeat(filled) + '░'.repeat(width - filled);
  const head = `  [${gauge}] ${String(Math.round(pct * 100)).padStart(3)}%  ${done}/${totalFiles} files  ${human(bytesDone)}/${human(totalBytes)}  `;
  const cols = process.stdout.columns || 100;
  let line = head + (label || '');
  if (line.length > cols - 1) line = line.slice(0, cols - 1);
  process.stdout.write('\r' + line + ' '.repeat(Math.max(0, cols - 1 - line.length)));
}

// ---- upload ----
const client = new Client(30000);
try {
  await client.access({ host, user, password, secure, secureOptions: { rejectUnauthorized: false } });
  console.log(`\n  connected to ${host} as ${user}`);
  console.log(`  uploading ${totalFiles} files in ${dirs.size} folder(s) (${human(totalBytes)}) -> ${path}\n`);

  await client.ensureDir(path);
  const base = await client.pwd();

  let done = 0, bytesDone = 0;
  bar(0, 0, '');
  for (const [d, group] of byDir) {
    await client.cd(base);
    if (d !== '.') await client.ensureDir(d);   // relative to base; creates intermediate dirs + cds in
    for (const file of group) {
      bar(done, bytesDone, file.rel);
      await client.uploadFrom(file.abs, posix.basename(file.rel));
      done++; bytesDone += file.size;
      bar(done, bytesDone, file.rel);
    }
  }
  process.stdout.write('\n');
  console.log('\n  ✓ deployed over FTP - your site is live.\n');
} catch (e) {
  console.error('\n\n  FTP deploy failed: ' + e.message);
  console.error('  Check host/user/password, and if it is a TLS error, try "secure": false in deploy.json.\n');
  process.exitCode = 1;
} finally {
  client.close();
}

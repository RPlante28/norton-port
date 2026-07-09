// Deploy the built site to cPanel over FTP/FTPS - no SSH shell access needed
// (GoDaddy shared hosting has shell off by default, but FTP is always available).
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
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

const client = new Client(30000);
try {
  await client.access({ host, user, password, secure, secureOptions: { rejectUnauthorized: false } });
  console.log(`\n  connected to ${host} as ${user}`);
  console.log(`  uploading dist/ -> ${path}\n`);
  client.trackProgress((info) => { if (info.name) process.stdout.write('  ' + info.type + ' ' + info.name + '                    \r'); });
  await client.uploadFromDir(dist, path);
  client.trackProgress();
  console.log('\n\n  ✓ deployed over FTP - your site is live.\n');
} catch (e) {
  console.error('\n  FTP deploy failed: ' + e.message);
  console.error('  Check host/user/password, and if TLS errors, try "secure": false in deploy.json.\n');
  process.exitCode = 1;
} finally {
  client.close();
}

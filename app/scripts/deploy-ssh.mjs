// Deploy the built site straight to cPanel over SSH with rsync.
//
// Config comes from app/deploy.json (git-ignored) or env vars:
//   {
//     "host": "server.yourhost.com",   // SSH host (or your domain)
//     "user": "api8x0g7vhe7",          // cPanel username
//     "path": "public_html",           // target dir (relative to home, or absolute)
//     "port": 22,                      // SSH port (check cPanel > SSH Access)
//     "key":  "~/.ssh/rohanplante_deploy", // private key (optional if using ssh-agent)
//     "delete": false                  // true = remove remote files not in dist (careful!)
//   }
// Env overrides: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH, DEPLOY_PORT, DEPLOY_KEY, DEPLOY_DELETE=1
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const cfgPath = join(root, 'deploy.json');

let cfg = {};
if (existsSync(cfgPath)) {
  try { cfg = JSON.parse(readFileSync(cfgPath, 'utf8')); }
  catch { console.error('deploy.json is not valid JSON.'); process.exit(1); }
}
const expand = (p) => (p && p.startsWith('~') ? join(homedir(), p.slice(1)) : p);
const host = process.env.DEPLOY_HOST || cfg.host;
const user = process.env.DEPLOY_USER || cfg.user;
const path = process.env.DEPLOY_PATH || cfg.path;
const port = process.env.DEPLOY_PORT || cfg.port || 22;
const key = expand(process.env.DEPLOY_KEY || cfg.key);
const del = process.env.DEPLOY_DELETE === '1' || cfg.delete === true;

if (!existsSync(dist)) { console.error('No dist/ - run `npm run build` first (or use `npm run deploy`).'); process.exit(1); }
if (!host || !user || !path) {
  console.error('Missing deploy config. Copy deploy.example.json to deploy.json and fill it in\n(or set DEPLOY_HOST / DEPLOY_USER / DEPLOY_PATH).');
  process.exit(1);
}

const remote = `${user}@${host}:${path.replace(/\/?$/, '/')}`;
const sshCmd = `ssh -p ${port}` + (key ? ` -i "${key}"` : '') + ' -o StrictHostKeyChecking=accept-new';
// trailing slash on dist/ copies its CONTENTS into the remote folder.
// never wipe server-side bits that don't live in the build.
const args = [
  '-az', '--human-readable',
  '-e', sshCmd,
  '--exclude', '.htaccess', '--exclude', 'cgi-bin', '--exclude', '.well-known',
];
if (del) args.push('--delete');
args.push(dist.replace(/\/?$/, '/'), remote);

console.log(`\n  deploying dist/ -> ${remote}${del ? '  (with --delete)' : ''}\n`);
try {
  execFileSync('rsync', args, { stdio: 'inherit' });
  console.log(`\n  ✓ live at your site. (${del ? 'mirrored' : 'uploaded/overwritten'})\n`);
} catch (e) {
  if (e.code === 'ENOENT') console.error('\n  rsync is not installed on this machine.\n  macOS/Linux: it is usually preinstalled. Windows: use WSL or Git Bash,\n  or fall back to  npm run deploy:zip  and upload site.zip in cPanel.\n');
  else console.error('\n  Deploy failed. Check SSH access:  ssh -p ' + port + (key ? ' -i "' + key + '"' : '') + ' ' + user + '@' + host + '\n');
  process.exit(1);
}

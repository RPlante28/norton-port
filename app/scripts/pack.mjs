// Packs the built site into site.zip for a two-click cPanel deploy.
// The zip contains the CONTENTS of dist/ at its root, so extracting it inside
// public_html/ drops index.html + assets straight where they belong.
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const AdmZip = createRequire(import.meta.url)('adm-zip'); // adm-zip is CommonJS

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, 'site.zip');

if (!existsSync(dist)) {
  console.error('No dist/ folder — run `npm run build` first (or just use `npm run deploy`).');
  process.exit(1);
}

const zip = new AdmZip();
zip.addLocalFolder(dist); // adds dist's CONTENTS at the zip root
zip.writeZip(out);

const kb = (statSync(out).size / 1024).toFixed(0);
console.log(`\n  ✓ site.zip ready (${kb} KB)`);
console.log('  → cPanel → File Manager → public_html/ → Upload site.zip → Extract → delete the zip.\n');

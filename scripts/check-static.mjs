// check-static.mjs — gate anti-slop P0 + penjaga restructure, dipakai
// `npm run validate` dan job `static-checks` di CI:
//   1. Tanpa gradient ungu/biru, tanpa headline gradient, tanpa font Inter /
//      Roboto, tanpa rounded-2xl/3xl + shadow-lg di UI, tanpa emoji mentah
//      sebagai ikon fungsi, tanpa copy generik / iklan palsu.
//   2. Tanpa sisa restructure: folder novel-main/ di tree.
//   3. Tanpa file .env yang ter-commit; tanpa secret kasar.
// Keluar 1 bila ada satu saja temuan.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);

const SRC_FILES = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git', '.next', '.open-next', 'test-results', 'playwright-report', 'docs'].includes(e.name)) walk(p);
    } else if (/\.(tsx?|css|mjs|js|json)$/.test(e.name) && !e.name.endsWith('.lock')) {
      SRC_FILES.push(p);
    }
  }
};
walk(join(ROOT, 'app'));
walk(join(ROOT, 'lib'));
walk(join(ROOT, 'public'));
SRC_FILES.push(join(ROOT, 'package.json'));

const P0_CHECKS = [
  [/linear-gradient\([^)]*(violet|purple|indigo|blue|#6366f1|#818cf8|#7d2ae8|#00c4cc)/i, 'gradient ungu/biru'],
  [/bg-clip-text/, 'headline gradient (bg-clip-text)'],
  [/\bfont-family:[^;]*\bInter\b/, 'font Inter'],
  [/\bfont-family:[^;]*\bRoboto\b/, 'font Roboto'],
  [/rounded-2xl|rounded-3xl/, 'rounded-2xl/3xl (radius template)'],
  [/shadow-lg|shadow-2xl/, 'shadow-lg/2xl di permukaan'],
  [/from-(violet|purple|indigo|blue|fuchsia)-\d+/, 'gradient Tailwind ungu/biru'],
  [/SPONSORED_SLOT|BACA KOMIK TANPA BATAS|BELI COIN SEKARANG/, 'iklan palsu (sudah dihapus dari desain)'],
  [/DECRYPTING_COMIC_DATA/, 'copy palsu DECRYPTING_COMIC_DATA'],
  [/maximumScale:\s*1/, 'viewport maximumScale: 1 (melarang zoom)'],
];

for (const f of SRC_FILES) {
  const src = readFileSync(f, 'utf-8');
  for (const [re, label] of P0_CHECKS) {
    if (re.test(src)) fail(`${f.replace(ROOT + '/', '')}: ${label}`);
  }
  // Emoji mentah sebagai ikon fungsi (bukan di komentar/dok).
  const code = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(code)) {
    fail(`${f.replace(ROOT + '/', '')}: emoji mentah di kode UI`);
  }
}

// Sisa restructure: subfolder lama tidak boleh ada di tree.
if (existsSync(join(ROOT, 'novel-main'))) fail('novel-main/ masih ada — restructure belum bersih');
// Secret kasar di file yang ter-commit.
for (const f of SRC_FILES) {
  const src = readFileSync(f, 'utf-8');
  if (/(api[_-]?key|secret|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i.test(src)) {
    fail(`${f.replace(ROOT + '/', '')}: kemungkinan secret ter-commit`);
  }
}
if (existsSync(join(ROOT, '.env'))) fail('.env ter-commit');

if (failures.length > 0) {
  console.error('check-static GAGAL:');
  for (const m of failures) console.error(` - ${m}`);
  process.exit(1);
}
console.log('check-static OK');

// smoke.mjs — verifikasi build produksi (persis yang di-deploy):
// `next start` di port acak, lalu cek / (200 + judul + kolom cari),
// /api/status (200 ok:true), /api/trending (pola #35: terima 200 dengan
// items ATAU 500/502 ok:false — upstream pihak ketiga bisa beda hasil di
// VM vs CI), /api/search tanpa q (400), /api/image-proxy host liar (400),
// /manifest.json (200), /icon.png (200).
// Hanya GET lokal. Pola #29: curl -o file lalu grep file (tanpa pipefail).
// Prasyarat: `npm run build` sudah jalan (.next/BUILD_ID ada).
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

if (!existsSync(join(ROOT, '.next', 'BUILD_ID'))) {
  console.error('smoke: .next/BUILD_ID tidak ada — jalankan `npm run build` dulu.');
  process.exit(1);
}

const PORT = 8393;
const srv = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  cwd: ROOT,
  stdio: 'ignore',
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tmp = mkdtempSync(join(tmpdir(), 'novelfliy-smoke-'));

async function get(path, label) {
  const out = join(tmp, label.replace(/\W+/g, '_'));
  const code = execFileSync('curl', ['-sS', '-o', out, '-w', '%{http_code}', '--max-time', '60', `http://127.0.0.1:${PORT}${path}`], { stdio: 'pipe' }).toString().trim();
  return { code, body: readFileSync(out, 'utf-8') };
}

const check = (cond, msg) => { if (!cond) failures.push(msg); };

try {
  await wait(4000);
  const home = await get('/', 'home');
  check(home.code === '200', `/ -> HTTP ${home.code}`);
  check(home.body.includes('NovelFliy'), '/ tidak mengandung NovelFliy');
  check(home.body.includes('CARI WEBTOON'), '/ tidak mengandung kolom cari');

  const status = await get('/api/status', 'status');
  check(status.code === '200', `/api/status -> HTTP ${status.code}`);
  try {
    check(JSON.parse(status.body).ok === true, '/api/status ok != true');
  } catch { failures.push('/api/status bukan JSON'); }

  // Pola #35: upstream webtoons.com/proxy bisa gagal di satu lingkungan.
  const trending = await get('/api/trending?day=daily', 'trending');
  if (trending.code === '200') {
    try {
      const d = JSON.parse(trending.body);
      check(Array.isArray(d.items), '/api/trending 200 tapi tanpa items[]');
      check(d.items.length > 0, '/api/trending 200 tapi items kosong');
      check(d.items.every((i) => (i.title || '').trim().length > 0), '/api/trending ada judul kosong');
    } catch { failures.push('/api/trending 200 tapi bukan JSON'); }
  } else {
    check(['500', '502'].includes(trending.code), `/api/trending -> HTTP ${trending.code} (bukan 200/500/502)`);
    try {
      check(JSON.parse(trending.body).error, '/api/trending gagal tanpa field error');
    } catch { failures.push('/api/trending gagal dan bukan JSON'); }
  }

  const noQ = await get('/api/search', 'search-noq');
  check(noQ.code === '400', `/api/search tanpa q -> HTTP ${noQ.code} (harap 400)`);

  const badDay = await get('/api/trending?day=../../etc', 'trending-badday');
  check(badDay.code === '400', `/api/trending day liar -> HTTP ${badDay.code} (harap 400)`);

  const badProxy = await get('/api/image-proxy?url=https%3A%2F%2Fevil.example%2Fx.jpg', 'proxy-bad');
  check(badProxy.code === '400', `/api/image-proxy host liar -> HTTP ${badProxy.code} (harap 400)`);

  const badDetail = await get('/api/detail?url=https%3A%2F%2Fevil.example%2Flist%3Ftitle_no%3D1', 'detail-bad');
  check(badDetail.code === '400', `/api/detail URL liar -> HTTP ${badDetail.code} (harap 400)`);

  const manifest = await get('/manifest.json', 'manifest');
  check(manifest.code === '200', `/manifest.json -> HTTP ${manifest.code}`);
  const icon = await get('/icon.png', 'icon');
  check(icon.code === '200', `/icon.png -> HTTP ${icon.code}`);
} finally {
  srv.kill();
}

if (failures.length > 0) {
  console.error('smoke GAGAL:');
  for (const m of failures) console.error(` - ${m}`);
  process.exit(1);
}
console.log('smoke OK');

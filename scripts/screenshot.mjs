// Screenshot dokumentasi: beranda, pencarian, detail, pembaca — desktop +
// mobile ke docs/screenshots/*.png. Dipakai README + video demo.
// Prasyarat: puppeteer-core, Chromium di cache
// (~/.cache/ms-playwright/chromium-1234), dan server produksi di PORT
// (default 8331, `npm run build && npx next start -p 8331`).
// JANGAN `npx playwright install chromium` di VM ini (menghapus cache
// browser tooling video-demo).
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import net from 'node:net';

// Forwarder egress (127.0.0.1:18081) WAJIB untuk media eksternal dari
// headless Chrome di VM ini (Google Fonts + gambar webtoon): koneksi
// langsung browser -> egress proxy ditolak 403, dan tanpa proxy font
// display tidak termuat. Probe TCP dulu; kalau forwarder mati, lanjut
// tanpa proxy (font fallback).
const FORWARDER = 'http://127.0.0.1:18081';
const forwarderAlive = await new Promise((resolve) => {
  const s = net.connect(18081, '127.0.0.1');
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('error', () => resolve(false));
  setTimeout(() => { s.destroy(); resolve(false); }, 2000);
});
if (!forwarderAlive) console.warn('PERINGATAN: forwarder 127.0.0.1:18081 mati — font Google mungkin fallback.');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots');
const PORT = process.env.PORT || '8331';
const BASE = `http://127.0.0.1:${PORT}`;

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  try {
    puppeteer = require('/home/hatch/workspace/absensirapat-audit/diag/node_modules/puppeteer-core');
  } catch {
    console.error('puppeteer-core tidak ditemukan. Pasang dulu: npm i -D puppeteer-core.');
    process.exit(1);
  }
}

mkdirSync(OUT, { recursive: true });

const exe =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  join(process.env.HOME, '.cache/ms-playwright/chromium-1234/chrome-linux/chrome');
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage',
    ...(forwarderAlive ? [`--proxy-server=${FORWARDER}`] : [])],
});

async function shot(name, path, width, height, waitForText, scrollY = 0) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 90000 });
  if (waitForText) {
    try {
      // innerText mengikuti text-transform CSS (judul tampil UPPERCASE),
      // jadi bandingkan tanpa memperhatikan kapitalisasi.
      await page.waitForFunction(
        (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
        { timeout: 60000 }, waitForText,
      );
    } catch {
      console.warn(`PERINGATAN: teks "${waitForText}" tidak muncul di ${path} — screenshot tetap diambil.`);
    }
  }
  await new Promise((r) => setTimeout(r, 2500));
  if (scrollY > 0) {
    // Pembaca: gambar pertama episode adalah kartu peringatan WEBTOON —
    // gulir dulu supaya screenshot menampilkan panel komik yang sebenarnya.
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
    await new Promise((r) => setTimeout(r, 1500));
  }
  await page.screenshot({ path: join(OUT, name), fullPage: false });
  await page.close();
  console.log(`shot ${name}`);
}

// Data live untuk deep-link detail & pembaca (judul trending pertama).
const trending = await (await fetch(`${BASE}/api/trending?day=daily`)).json();
const first = (trending.items || []).find((i) => (i.title || '').trim());
if (!first) {
  console.error('trending kosong — screenshot dibatalkan (upstream tidak menjawab).');
  await browser.close();
  process.exit(1);
}
const detailUrl = `/detail?url=${encodeURIComponent(first.url)}`;
const eps = await (await fetch(`${BASE}/api/episodes?url=${encodeURIComponent(first.url)}&page=1`)).json();
const firstEp = (eps.episodesList || [])[0];
const readUrl = firstEp ? `/read?url=${encodeURIComponent(firstEp.url)}` : null;
console.log(`judul contoh: ${first.title} — ${eps.episodesList?.length ?? 0} episode di halaman 1`);

await shot('home-desktop.png', '/', 1440, 900, first.title);
await shot('home-mobile.png', '/', 390, 844, first.title);
await shot('search-desktop.png', '/search?q=tower', 1440, 900, 'Tower of God');
await shot('detail-desktop.png', detailUrl, 1440, 900, 'Episode');
await shot('detail-mobile.png', detailUrl, 390, 844, 'Episode');
if (readUrl) {
  await shot('read-desktop.png', readUrl, 1440, 900, null, 1400);
}

await browser.close();
console.log('screenshots OK');

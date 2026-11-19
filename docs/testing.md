# Testing — NovelFliy

## Ringkasan

| Lapisan | Perintah | Hasil saat PR #1 |
|---|---|---|
| Typecheck | `npm run typecheck` | bersih |
| Lint | `npm run lint` | bersih (0 error) |
| Gate P0 + secret | `npm run validate` | OK |
| Sweep OSV | `npm run sweep` | 0 HIGH/CRITICAL (produksi) |
| E2E Playwright | `npm test` | 16/16 (desktop + mobile) |
| Smoke produksi | `npm run smoke` | OK |
| Play-test manual | curl + browser | cari → detail → episode → baca |

## Play-test end-to-end (19 Nov 2026, server lokal `:8331`)

1. `GET /` → 200, judul + kolom cari tampil, tanpa iklan palsu.
2. `GET /api/trending?day=daily` → 200, **101 judul, 0 judul kosong**
   (sebelum perbaikan selector: 101 judul kosong).
   Contoh: "Stigma of Patronage" | Romantis | 24.773.
3. `GET /api/search?q=tower` → 200, 9 hasil — "Tower of God: Urek
   Mazino" (SIU, originals) di urutan pertama.
4. `GET /api/episodes?url=<urek-mazino>` → 200, judul + penulis "SIU"
   + genre "Fantasi" + subscriber "54.509", 10 episode halaman 1 dari
   7 halaman; ep 70 "EP. 70 - REMBULAN TERBIT (TAMAT)", likes 1.428.
5. `GET /api/read?url=<ep-70>` → 200, **251 gambar** episode.
6. Validasi: `day` liar → 400; URL luar webtoons.com → 400;
   image-proxy host liar → 400; search tanpa `q` → 400.

## E2E (Playwright)

`e2e/app.spec.ts` — 8 tes × 2 proyek (desktop 1440×900, mobile
390×844) = 16. Tes yang menyentuh upstream memakai pola #35:
hasil ATAU pesan gagal yang jujur, bukan isi spesifik webtoons.com.

Jalankan lokal (JANGAN `npx playwright install` di VM — pakai cache):

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$HOME/.cache/ms-playwright/chromium-1234/chrome-linux/chrome \
PLAYWRIGHT_PROXY=http://127.0.0.1:18081 npx playwright test
```

Di CI, workflow menginstal Chromium sendiri (`npx playwright install
--with-deps chromium`) dan webServer membangun + menjalankan server
produksi otomatis.

## Smoke

`scripts/smoke.mjs` menjalankan `next start` di port 8393 lalu mengecek
`/`, `/api/status`, `/api/trending` (pola #35), validasi 400-an,
`/manifest.json`, `/icon.png`. Prasyarat: `npm run build`.

## Screenshot & video

```bash
npm run build && npx next start -p 8331   # terminal 1
npm run screenshots                             # docs/screenshots/*.png
npm run make-video                              # docs/demo/demo.mp4
```

Screenshot memakai puppeteer-core + Chromium cache + forwarder
egress (font Google + gambar webtoon). Screenshot adalah satu-satunya
bukti visual — e2e hijau bukan bukti render tampil (pelajaran #33).

## Catatan keterbatasan

- POST dari VM menggantung di egress (pola #29/#35) — tidak relevan
  di sini (semua endpoint GET), tapi sweep OSV (POST) kadang gagal
  `RemoteDisconnected` dari VM; CI adalah gate yang menentukan.
- Play-test live dari VM tidak bisa headless penuh untuk interaksi —
  verifikasi live memakai curl + screenshot; cek browser Nabil sekali
  untuk memastikan gambar episode berputar di perangkat nyata.

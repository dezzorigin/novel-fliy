# CHANGELOG — NovelFliy

## [1.0.0] — 2026-11-19 (PR #1: proper)

### Restructure

- App dipindah dari subfolder `novel-main/` ke root repo (restructure
  kelima program P1). Subfolder lama dihapus dari tree.
- Keputusan konflik: tidak ada konflik isi — root sudah punya
  `.gitignore` (lebih lengkap dari `.gitignore` kosong di subfolder),
  `LICENSE`/`README.md`/`PRD.md` hanya ada di root. File `.gitignore`
  kosong di subfolder dibuang; `.gitignore` root diperkaya
  (`.open-next/`, `.vercel/`, `test-results/`, `playwright-report/`).

### Perbaikan produk (bug nyata, diverifikasi live)

- `next.config.ts`: `output: 'export'` dihapus — static export tidak
  mendukung Route Handler (`/api/*`) sehingga app tidak bisa jalan.
  Deploy dialihkan ke `@opennextjs/cloudflare` (Worker + aset statis).
- Selector scraper diperbaiki mengikuti markup webtoons.com saat ini
  (19 Nov 2026): trending mengembalikan 101 judul kosong → 101 judul
  asli (`strong.title`, genre `.info_text .genre`, likes `.view_count`).
- Detail: penulis ketarik teks "Informasi Kreator" → dibersihkan ke
  baris pertama; subscriber salah ambil view count ("1JT") → kini
  angka subscribe ("54.509"); genre fallback ke slug URL; `day_info`
  "UPUpdate KAMIS" → "Update KAMIS".
- Episode: likes "like406" → angka "406".
- `lib/webtoons-api.ts`: axios → fetch bawaan (jalan di Node dan di
  Workers); tambah tipe (`WebtoonItem`, `EpisodeItem`, `WebtoonDetail`,
  `SearchResult`, `TrendingResult`, `EpisodesResult`); tambah
  `isWebtoonsUrl` + `TRENDING_DAYS`.
- API hardening: `url` harus dari webtoons.com (400 bila bukan);
  `day` allowlist; `page` di-clamp 1–1000; `image-proxy` allowlist host
  (`webtoons.com`, `*.pstatic.net`) anti-SSRF.
- Route baru: `GET /api/status` untuk smoke test.
- PWA: `manifest.json` + `sw.js` merujuk `/icon.png` yang tidak ada
  (404) → `/icon.png` (route `app/icon.tsx`); cache name
  `toonread-cache-v1` → `novelfliy-cache-v1`.
- `lang="en"` → `lang="id"`; `maximumScale: 1` dihapus (a11y).

### UI/UX (retrofit anti-slop)

- Referensi pemenang: **Now Serving** (Framer, neo-brutalist, motif
  tiket) — lihat `docs/DESIGN.md`.
- Dihapus: iklan palsu (`SPONSORED_SLOT`, `BACA KOMIK TANPA BATAS`,
  `BELI COIN SEKARANG`), tombol lonceng notifikasi mati (dot ping palsu),
  copy `DECRYPTING_COMIC_DATA...`.
- Beranda baru: header loket (logo + nav + tautan GitHub), hero mesin
  cari (2 kolom, bukan hero tengah), pratinjau "Tiket teratas" 3 judul
  live, tab hari (Harian/Senin–Minggu/Tamat), strip "Cara baca" 3 langkah
  (bukan 3 kartu identik), footer sumber data + GitHub + lisensi.
- Detail: label jumlah episode jujur ("X dimuat — halaman Y dari Z"),
  tautan sumber asli, status berbahasa Indonesia.
- Dependensi dibersihkan: axios, framer-motion, motion,
  @hookform/resolvers, date-fns, class-variance-authority, clsx,
  tailwind-merge, @tailwindcss/typography, tw-animate-css, autoprefixer,
  postcss (langsung) — tidak ada yang mengimpornya.
- Next 15.4.9 → 15.5.29; postcss di-override ke ^8.5.18 (pola #19–#23).

### CI / pengujian / docs

- CI 4 job: build (typecheck + lint + gate P0 + next build),
  advisory-sweep (OSV batch), playwright-e2e (16 tes, desktop + mobile),
  smoke.
- `scripts/`: `advisory-sweep.py`, `check-static.mjs`, `smoke.mjs`,
  `screenshot.mjs`, `make-video.mjs`.
- Docs: `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/API.md`,
  `docs/deploy.md`, `docs/testing.md`, `docs/diagrams.html`,
  `docs/screenshots/*`, `docs/demo/demo.mp4`.

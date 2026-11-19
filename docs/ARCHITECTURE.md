# Arsitektur — NovelFliy

## Gambaran

```
Browser ──► Cloudflare Pages (novelfliy.pages.dev)
              ├── Aset statis (JS/CSS/ikon, dari .open-next/assets)
              └── Worker OpenNext (@opennextjs/cloudflare, nodejs_compat)
                    ├── Halaman App Router (/, /search, /detail, /read)
                    └── Route Handler /api/*
                          ├── /api/trending, /api/search, /api/detail,
                          │    /api/episodes, /api/read
                          │      → lib/webtoons-api.ts (fetch + cheerio)
                          │      → CORS proxy cors.siputzx.my.id
                          │      → www.webtoons.com (HTML, read-only)
                          ├── /api/image-proxy
                          │      → fetch langsung ke CDN webtoons.com /
                          │        *.pstatic.net (Referer: webtoons.com)
                          └── /api/status (tanpa upstream)
```

Diagram visual (HTML+SVG): `docs/diagrams.html`.

## Alur data

1. **Trending** — `GET /api/trending?day=daily` mengambil
   `/id/dailySchedule` (atau `/id/originals/<hari>` /
   `/id/originals/completed`), parse anchor `a[href*='/list?title_no=']`,
   kembalikan `{ day, count, items[] }`.
2. **Pencarian** — `GET /api/search?q=` mengambil `/id/search?keyword=`,
   pisah `originals` vs `canvas`.
3. **Detail + episode** — `GET /api/episodes?url=&page=` mengambil halaman
   daftar judul webtoons.com, parse meta (`parseDetail`) + `#_listUl > li`
   + paginasi (`.paginate a`).
4. **Baca** — `GET /api/read?url=` mengambil halaman viewer episode,
   parse `#_imageList img` (`data-url` atau `src`).
5. **Gambar** — semua `<img>` sampul/halaman lewat `/api/image-proxy`
   (CDN webtoon menolak hotlink tanpa `Referer` yang benar).

## Kenapa CORS proxy

webtoons.com tidak mengizinkan fetch lintas-origin dari browser dan
halamannya butuh `User-Agent` browser. Karena itu scraping dilakukan
server-side (Route Handler), dan request HTML-nya dilewatkan CORS proxy
publik `https://cors.siputzx.my.id/` — proxy ini hanya meneruskan,
tidak menyimpan kredensial (tidak ada kredensial sama sekali di repo).

## Kenapa OpenNext, bukan static export

App ini butuh Route Handler dinamis (`/api/*`). `output: 'export'`
di `next.config.ts` lama membuat build kehilangan API routes — itu
bug struktural yang diperbaiki di PR #1. `@opennextjs/cloudflare`
mengubah build Next menjadi Worker + aset statis yang bisa di-deploy
ke Cloudflare Pages (lihat `docs/deploy.md`).

## Batasan yang disengaja

- **Tanpa cache server**: tiap request API mengambil ulang dari sumber.
  Konsekuensinya latensi mengikuti upstream (±2–8 dtk saat diuji) dan
  halaman menampilkan skeleton selagi memuat.
- **Tanpa auth / tanpa penyimpanan**: tidak ada akun, bookmark, atau
  riwayat baca. Itu di luar ruang lingkup PRD v2.0.
- **Tanpa login WEBTOON**: episode premium / butuh login menampilkan
  pesan jujur + tautan ke sumber asli.

## Struktur kode

| Path | Isi |
|---|---|
| `app/page.tsx` | Beranda (hero, tiket teratas, trending, cara baca) |
| `app/search/page.tsx` | Halaman pencarian |
| `app/detail/page.tsx` | Detail judul + daftar episode |
| `app/read/page.tsx` | Pembaca episode |
| `app/api/*/route.ts` | 7 Route Handler (lihat `docs/API.md`) |
| `app/layout.tsx` | Font (Space Grotesk + JetBrains Mono), metadata, SW |
| `app/icon.tsx` | Ikon NF 512px (route `/icon`) |
| `lib/webtoons-api.ts` | Scraper + tipe |
| `public/manifest.json`, `public/sw.js` | PWA |
| `scripts/` | sweep, check-static, smoke, screenshot, make-video |
| `e2e/app.spec.ts` | Playwright e2e |
| `wrangler.jsonc` | compatibility_date + `nodejs_compat` untuk build OpenNext |

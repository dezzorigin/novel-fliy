# PRD — NovelFliy

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama Proyek | NovelFliy |
| Deskripsi | Pembaca webtoon brutalist — baca webtoon trending dari sumber aslinya |
| Tech Stack | Next.js 15.5 (App Router), React 19, Tailwind 4, cheerio |
| Status | Proper (PR #1) — live di Cloudflare Pages |
| Penanggung Jawab | Nabil Aulia Dika (dezzorigin) |
| Live Demo | https://novelfliy.pages.dev |
| Repo | https://github.com/dezzorigin/novel-fliy |
| Versi Dokumen | 2.0 (proper) |
| Tanggal | 19 November 2026 |

## 2. Latar Belakang

Pembaca webtoon yang ringan dan jujur: tanpa akun, tanpa iklan, tanpa
paywall. Pengguna membuka situs, melihat apa yang trending hari ini,
mencari judul yang ia suka, lalu membaca episodenya sampai habis.
Semua konten milik webtoons.com — NovelFliy hanya menyajikan ulang
dengan tampilan brutalist dan navigasi yang cepat.

## 3. Tujuan

1. Satu tempat untuk menemukan webtoon trending (harian + per hari tayang).
2. Pencarian judul yang langsung mengarah ke detail dan episode.
3. Pembaca episode vertikal yang nyaman di desktop maupun ponsel.
4. Nol data palsu: kalau sumber tidak menjawab, tampilkan pesan gagal —
   jangan karang judul, rating, atau angka.

## 4. Pengguna

Pembaca webtoon Indonesia yang memakai browser (desktop/ponsel), tanpa
mau instal aplikasi atau membuat akun.

## 5. Fitur & Persyaratan Fungsional

### 5.1 Trending (beranda)

- Grid sampul trending harian dari `/id/dailySchedule` (101 judul saat diuji).
- Tab hari: Harian, Senin–Minggu, Tamat (jadwal `/id/originals/<hari>` dan
  `/id/originals/completed`).
- Kartu: sampul, nomor peringkat tiket (`#1`…), judul, genre, likes.
- Pratinjau "Tiket teratas" di hero: 3 judul teratas hari yang dipilih.
- Gagal upstream → pesan jujur + ajakan memakai pencarian.

### 5.2 Pencarian (`/search`)

- Cari lewat `/id/search?keyword=`; hasil dipisah Originals vs Canvas.
- Kartu hasil: sampul, judul, penulis, seksi, genre.
- Query kosong → petunjuk, bukan hasil kosong yang membingungkan.

### 5.3 Detail judul (`/detail`)

- Sinopsis, penulis, genre, hari update, status (Ongoing/Tamat/tidak
  diketahui), rating (bila tersedia di sumber), subscriber.
- Tautan "Buka judul ini di webtoons.com" (sumber asli).
- Daftar episode: nomor, judul, tanggal, likes; pagination
  "Muat episode berikutnya" (halaman 1…N dari sumber).
- Label jumlah jujur: "X dimuat — halaman Y dari Z".

### 5.4 Pembaca episode (`/read`)

- Daftar gambar episode (`#_imageList`) disusun vertikal, lazy-load.
- Tombol kembali ke atas; penghitung halaman di `alt` tiap gambar.
- Episode premium / butuh login → pesan jujur + tautan ke sumber asli
  (bukan halaman kosong).

### 5.5 Proxy gambar (`/api/image-proxy`)

- Meneruskan gambar dari `webtoons.com` / `*.pstatic.net` dengan header
  `Referer: webtoons.com` (CDN menolak hotlink tanpa itu).
- Host lain ditolak 400 (anti-SSRF). Cache publik 1 tahun.

### 5.6 Status (`/api/status`)

- `GET /api/status` → `{ ok, service, mode, upstream, time }` untuk
  smoke test dan pemantauan.

### 5.7 PWA

- `manifest.json` + service worker (cache halaman + ikon, API tidak
  di-cache). Ikon dihasilkan `app/icon.tsx` (`/icon`).

## 6. Persyaratan Non-Fungsional

- **Performa:** First Load JS ~103–116 kB; gambar lazy; API timeout 25 dtk.
- **Keamanan:** tanpa secret di repo; validasi `url` (hanya webtoons.com),
  `day` (allowlist), host image-proxy (allowlist); sweep OSV bersih
  HIGH/CRITICAL.
- **Aksesibilitas:** label form, `aria-selected` tab, `aria-label` tombol
  ikon, focus ring limau, kontras AA, tanpa `maximumScale: 1`,
  `prefers-reduced-motion` dihormati, target sentuh ≥44px di mobile.
- **Responsif:** mobile 390px tanpa overflow horizontal; nav bawah mobile.
- **Desain:** kontrak di `docs/DESIGN.md` (anti-slop P1, referensi
  Now Serving Framer); gate 7 sumbu ≥4/5 sebelum merge.

## 7. Arsitektur & Tech Stack

Lihat `docs/ARCHITECTURE.md` + `docs/diagrams.html`.

- Next.js App Router; halaman client-side fetch ke Route Handler sendiri.
- Route Handler memanggil webtoons.com lewat CORS proxy publik, parsing
  dengan cheerio, mengembalikan JSON.
- Deploy: Cloudflare Pages via `@opennextjs/cloudflare` (Worker +
  aset statis, `nodejs_compat`). Lihat `docs/deploy.md`.

## 8. Milestone

| Fase | Status |
|---|---|
| Inisialisasi & scaffolding | ✅ (awal) |
| Restructure `novel-main/` → root | ✅ PR #1 |
| Perbaikan selector scraper (markup live) | ✅ PR #1 |
| Retrofit UI anti-slop + landing | ✅ PR #1 |
| Testing & QA (typecheck, lint, e2e 16, smoke) | ✅ PR #1 |
| Deployment (Cloudflare Pages) | ✅ PR #1 |
| Dokumentasi (PRD, arsitektur, desain, API, deploy, testing) | ✅ PR #1 |

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Markup webtoons.com berubah (selector usang) | Selector diperbaiki per markup live 19 Nov 2026; e2e + smoke menegakkan "judul tidak boleh kosong"; pola #35 (terima 200 berisi data ATAU 500/502 berisi error) |
| CORS proxy publik mati | Pesan gagal jujur di UI; `/api/status` tetap 200 |
| Episode premium / butuh login | Pesan jujur + tautan sumber asli |
| Image-proxy disalahgunakan (SSRF) | Allowlist host + https saja |
| Nama Pages sudah dipakai orang | Fallback `novelfliy` → `baca-novel` |

## 10. Kriteria Keberhasilan

- Aplikasi berjalan tanpa error di lingkungan dev dan produksi.
- Trending mengembalikan judul asli (0 judul kosong).
- Semua fitur inti lolos play-test end-to-end (cari → detail → episode → baca).
- CI hijau (build, sweep, e2e, smoke); live terverifikasi HTTP 200.
- README + PRD lengkap dan up-to-date; screenshot asli di README.

## 11. Lisensi

MIT (LICENSE)

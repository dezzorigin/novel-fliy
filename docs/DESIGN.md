# DESIGN.md — Kontrak Arah Desain NovelFliy

> Ditulis SEBELUM coding (standar anti-slop P1). Referensi dulu, baru bangun.

## Referensi

**Pemenang: Now Serving — template Framer neo-brutalist (gratis)**
https://www.framer.com/marketplace/templates/now-serving/

Kenapa menang: struktur kios loket — header ber-border tebal, hero tipografi
raksasa + mesin tiket (take-a-number), daftar antrean sebagai papan order,
kartu berbentuk tiket dengan tepi perforasi. Semua itu memetakan langsung ke
NovelFliy: mesin tiket → kolom pencarian hero; papan order → grid trending;
kartu tiket → kartu sampul bernomor + baris episode berbentuk struk.

Kandidat yang kalah:

- **Flamingo — Framer, neo-brutalist portfolio**
  https://www.framer.com/marketplace/templates/flamingo/
  Kalah: strukturnya portofolio kreator (galeri karya + bio), bukan kios
  layanan; motif tiket Now Serving lebih dekat ke alur baca webtoon.
- **Effort — Rocket.new, brutalist CES landing**
  https://www.rocket.new/templates/effort-brutalist-ces-landing-page-template
  Kalah: paletnya nyaris identik dengan app ini (void black + lime #CCFF00 +
  magenta) dan strukturnya kalkulator skor — tidak ada motif antrean/tiket
  yang bisa dipinjam; dipakai hanya sebagai pembanding palet.

## Palet (6 warna bernama, tiap warna punya tugas)

| Nama | Hex | Peran |
|---|---|---|
| Hitam Void | `#0A0A0A` | Latar utama semua halaman |
| Kertas | `#FFFFFF` | Teks utama, border, permukaan kontras |
| Limau Listrik | `#CCFF00` | Aksi utama (tombol cari, fokus), peringkat #1, status ONGOING |
| Magenta Mesin | `#FF2D6B` | Likes/hati, aksen sekunder, hati di kartu |
| Sian Layar | `#00E5FF` | Info, genre, tautan sekunder |
| Jingga Antre | `#FF5C00` | Rating bintang, hari update, peringatan |

Bukan satu hue: hitam-putih netral + tiga aksen (limau, magenta, sian) +
jingga hangat. Tanpa gradient apa pun; tanpa ungu/biru gradient.

## Tipografi (maks 2 keluarga)

- **Space Grotesk** — display/headline, uppercase, tracking ketat.
- **JetBrains Mono** — label, data, angka, tombol kecil (tabular).

## Layout (satu kalimat)

Kios tiket webtoon: header loket → hero mesin cari → rak sampul bernomor
tiket → struk episode → pembaca gulir panjang.

## Detail khas

- **Nomor tiket perforasi**: peringkat `#1`, `#2`, … menempel di sudut
  sampul seperti nomor antrean yang disobek — bukan badge bulat generik.
- **Baris episode berbentuk struk**: border putus-putus (dashed) di tepi,
  nomor episode + tanggal + likes seperti baris struk kasir.
- **Stempel status**: ONGOING / COMPLETED sebagai cap kotak tebal,
  bukan pill rounded.

## Radius & spacing

Radius 0 di semua permukaan (brutalist keras). Border 2px (kartu) / 4px
(header, hero, pemisah section). Grid 4/8pt; padding kartu ≥16px.

## Beda dari repo sebelumnya (#36 magernulis)

| Sumbu | #36 magernulis | #37 novel-fliy |
|---|---|---|
| Palet | Kertas/Tinta/Pulpen Biru | Hitam Void/Limau/Magenta |
| Tipografi | Newsreader + IBM Plex Sans | Space Grotesk + JetBrains Mono |
| Layout | Kertas Cornell, margin kiri | Kios tiket, rak sampul |
| Radius/spacing | Kertas lembut, garis margin | 0px, border 2/4px keras |
| Detail khas | Garis margin merah + lubang binder | Tiket perforasi + struk episode |

Beda 5/5 sumbu (minimal yang disyaratkan: 3/5).

## Larangan P0 yang dibersihkan dari app lama

- Iklan palsu dihapus: banner `SPONSORED_SLOT` / `BACA KOMIK TANPA BATAS`
  dan `SUPPORT NOVELFLIY, BELI COIN` — bukan fitur, bukan data.
- Tombol lonceng notifikasi mati (dengan dot ping palsu) dihapus — tidak
  ada sistem notifikasi di repo ini.
- Copy `DECRYPTING_COMIC_DATA...` diganti kalimat jujur
  ("Memuat halaman episode…").
- Label jumlah episode yang salah (`{count} Total` padahal itu jumlah
  halaman yang dimuat) diganti label jujur per halaman.
- `maximumScale: 1` di viewport dihapus (melarang zoom = gagal a11y).
- `lang="en"` diganti `lang="id"` (konten berbahasa Indonesia).
- Manifest + service worker merujuk `/icon.png` yang tidak ada (404) —
  diganti `/icon.png` (file statis `public/icon.png` — route `app/icon.tsx`
  dihapus karena `next/og` butuh modul WASM yang tidak bisa di-bundle
  ke satu file `_worker.js`).

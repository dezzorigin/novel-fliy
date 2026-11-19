# API — NovelFliy

Semua endpoint adalah `GET` dan mengembalikan JSON, kecuali
`/api/image-proxy` (biner gambar) dan `/api/status` (JSON ringan).
Base URL lokal: `http://127.0.0.1:8331`; live: `https://novelfliy.pages.dev`.

## GET /api/status

Status ringan tanpa memanggil upstream (untuk smoke test).

```json
{ "ok": true, "service": "novel-fliy", "mode": "live",
  "upstream": "webtoons.com", "time": "2026-11-19T02:42:21.987Z" }
```

## GET /api/trending?day=

| day | Sumber |
|---|---|
| `daily` (default), `trending` (alias) | `/id/dailySchedule` |
| `monday` … `sunday` | `/id/originals/<hari>` |
| `completed` | `/id/originals/completed` |

Nilai di luar daftar → **400** `{ error: "Parameter day tidak valid" }`.

Respons:

```json
{ "day": "daily", "sourceUrl": "https://www.webtoons.com/id/dailySchedule",
  "count": 101,
  "items": [
    { "titleNo": 11413, "title": "Stigma of Patronage",
      "thumbnail": "https://webtoon-phinf.pstatic.net/...",
      "genre": "Romantis", "likes": "24.773",
      "url": "https://www.webtoons.com/id/romance/.../list?title_no=11413" }
  ] }
```

Upstream gagal → **500** `{ error: "Failed to fetch trending" }`.

## GET /api/search?q=

Tanpa `q` → **400**. Respons:

```json
{ "query": "tower", "count": 9,
  "originals": [ ... ], "canvas": [ ... ],
  "items": [
    { "titleNo": 8004, "title": "Tower of God: Urek Mazino",
      "author": "SIU",
      "thumbnail": "https://webtoon-phinf.pstatic.net/...",
      "genre": "fantasy", "section": "originals",
      "url": "https://www.webtoons.com/id/fantasy/.../list?title_no=8004" }
  ] }
```

## GET /api/detail?url=

`url` harus dari `webtoons.com` (selain itu **400**).

```json
{ "titleNo": 8004, "title": "Tower of God: Urek Mazino",
  "author": "SIU",
  "synopsis": "Ini cerita tentang Urek Mazino ...",
  "genre": "Fantasi", "day": "Baca Tiap Hari", "status": null,
  "rating": null, "subscribers": "54.509",
  "thumbnail": "https://webtoon-phinf.pstatic.net/...",
  "url": "https://www.webtoons.com/id/fantasy/.../list?title_no=8004" }
```

`status`: `"ONGOING"` / `"COMPLETED"` / `null` (tidak diketahui dari
sumber). `rating`: `null` bila markup sumber tidak memuat rating
(markup webtoons.com saat ini tidak menampilkan angka rating di
halaman detail — bukan data yang dihilangkan).

## GET /api/episodes?url=&page=

`url` harus dari `webtoons.com`; `page` di-clamp 1–1000.

```json
{ "titleNo": 8004, "title": "Tower of God: Urek Mazino", "...": "…",
  "page": 1, "totalPages": 7, "hasNext": true, "count": 10,
  "episodesList": [
    { "episodeNo": 70, "title": "EP. 70 - REMBULAN TERBIT (TAMAT)",
      "thumbnail": "https://webtoon-phinf.pstatic.net/...",
      "date": "13 Sep 2026", "likes": "1.428",
      "url": "https://www.webtoons.com/id/fantasy/.../episode-70/viewer?title_no=8004&episode_no=70" }
  ] }
```

`count` = jumlah episode di halaman yang dimuat (bukan total semua
episode — total halaman ada di `totalPages`).

## GET /api/read?url=

`url` harus dari `webtoons.com` (URL viewer episode).

```json
{ "images": [
    "https://webtoon-phinf.pstatic.net/.../6id_warning.png?type=opti",
    "https://webtoon-phinf.pstatic.net/.../178610982768216_Tower_of_God__Urek_Mazin..." ] }
```

Episode premium / butuh login → `images: []` (UI menampilkan pesan
jujur + tautan ke sumber asli).

## GET /api/image-proxy?url=

Meneruskan gambar (biner) dengan `Referer: webtoons.com` dan
`Cache-Control: public, max-age=31536000`.

- Tanpa `url` → 400. Host di luar allowlist → 400.
- Allowlist: `webtoons.com`, `*.webtoons.com`, `*.pstatic.net`
  (hanya `https:`).
- Upstream gagal → 500.

## Perilaku gagal (pola #35)

Endpoint yang memanggil upstream pihak ketiga (`trending`, `search`,
`detail`, `episodes`, `read`, `image-proxy`) bisa mengembalikan
**500/502** bila webtoons.com atau CORS proxy tidak menjawab di
lingkungan itu. Smoke test dan e2e menerima **200 berisi data** ATAU
**500/502 berisi `{ error }`** — keduanya perilaku yang benar, bukan
cacat.

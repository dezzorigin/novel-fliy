# Deploy — NovelFliy

## Target

Cloudflare Pages, proyek **`novelfliy`** → `https://novelfliy.pages.dev`.

Nama adalah namespace global: `GET` project yang 404 hanya berarti
bukan milik akun kita — ketersediaan baru ketahuan saat create.
Fallback berurutan bila `novel-fliy` tidak dapat bersih:

1. `novel-fliy` (utama) — **HTTP 409 saat create 19 Nov 2026: dipakai akun
   Cloudflare lain**
2. `novelfliy` — **dipakai (final, create 19 Nov 2026 04:28 WIB)**
3. `baca-novel`

Kalau nama final bersufiks dan jelek, jangan dipakai — lanjut ke
fallback berikutnya. Nama final dicatat di README + PR.

## Cara deploy

Build OpenNext (menghasilkan `.open-next/` — Worker + aset statis):

```bash
npm run build:worker   # opennextjs-cloudflare build (menjalankan `npm run build` di dalamnya)
```

`.open-next/worker.js` adalah entry multi-file (import relatif ke
`.open-next/server-functions/` dkk) — TIDAK bisa di-deploy apa adanya
sebagai satu file. Bundle dulu dengan esbuild ke satu file `_worker.js`
(6,1 MB). Perintah yang terverifikasi 19 Nov 2026:

```bash
# daftar --external node builtin (node:* + nama telanjang) — simpan sekali:
node -e "const m=require('module').builtinModules.filter(x=>!x.startsWith('node:')&&!x.includes('/'));
require('fs').writeFileSync(process.env.HOME+'/workspace/esbuild-flags.txt',
['--external:cloudflare:workers','--external:node:*',...m.map(x=>'--external:'+x)].join('\n'))"

npx esbuild .open-next/worker.js --bundle --format=esm --platform=browser \
  --conditions=workerd,worker,browser $(cat ~/workspace/esbuild-flags.txt) \
  --banner:js='import { createRequire } from "node:module"; globalThis.require = createRequire("file:///worker.js");' \
  --outfile=<deploy-dir>/_worker.js --log-level=warning
cp -r .open-next/assets/* <deploy-dir>/   # _next/, icon.png, manifest.json, sw.js, _routes.json
```

Kenapa begitu (jebakan yang ditemukan 19 Nov 2026):

- `--platform=node` GAGAL di runtime: esbuild menyimpan
  `__require("node:crypto")` yang melempar `Dynamic require of
  "node:crypto" is not supported` di workerd (global `require` tidak
  ada di modul ESM). `--platform=browser` + `node:*` sebagai external
  + banner `createRequire("file:///worker.js")` sebagai
  `globalThis.require` adalah yang jalan. `createRequire(import.meta.url)`
  TIDAK jalan — `import.meta.url` bernilai `undefined` di worker hasil
  bundle wrangler.
- `_routes.json` WAJIB ada di root deploy-dir (isinya sudah di
  `public/_routes.json`, ikut tersalin dari `.open-next/assets`):
  tanpa itu Pages menjalankan worker untuk SEMUA path dan aset statis
  (`/icon.png`, `/_next/static/*`) 404 — resolver aset OpenNext
  sengaja skip saat `run_worker_first` false. Dengan `_routes.json`
  (exclude aset statis), aset 200 dan rute dinamis tetap ke worker.
  `cf_pages.py` mengirim `_routes.json` sebagai field multipart
  terpisah di deployment-create (paritas wrangler, ditambal 19 Nov 2026
  — sebelumnya helper ini tidak mengirimnya sama sekali).
- Jangan pakai `~` setelah `=` di shell ini (dash tidak meng-expand) —
  pakai `$HOME`.

Lalu deploy direct-upload via helper (replikasi alur `wrangler pages
deploy`, termasuk `_worker.js` sebagai `_worker.bundle`):

```bash
python3 ~/workspace/github-actions/cf_pages.py create-project novelfliy
python3 ~/workspace/github-actions/cf_pages.py set-compat novelfliy 2026-11-01 nodejs_compat
python3 ~/workspace/github-actions/cf_pages.py deploy novelfliy <deploy-dir>
```

Catatan:

- `set-compat` mengeset `compatibility_date` + flag `nodejs_compat`
  (Worker memakai `node:*` — tanpa ini deploy gagal di runtime).
- `deploy` bisa 404 sesaat setelah create-project — retry setelah
  ~20 dtk, bukan error nama (pelajaran #33).
- Setelah live, pasang link live di About repo via `PATCH /repos/dezzorigin/novel-fliy`
  (`homepage: https://novelfliy.pages.dev`) dan verifikasi terpasang.

## Verifikasi live

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://novelfliy.pages.dev/
curl -s https://novelfliy.pages.dev/api/status
curl -s --max-time 60 "https://novelfliy.pages.dev/api/trending?day=daily" | head -c 300
```

Lalu play-test lewat browser: beranda → klik kartu trending → detail
→ buka episode → gambar tampil. (Play-test headless dari VM tidak
bisa diandalkan penuh untuk render — screenshot adalah bukti visual;
lihat `docs/testing.md`.)

## Kenapa bukan `wrangler pages deploy` langsung

VM ini tidak memakai wrangler CLI untuk deploy; `cf_pages.py`
memakai API token Cloudflare yang sama (via surrogate
`custom.cloudflare`) dan sudah terverifikasi untuk Pages direct-upload
di repo P1 sebelumnya. `wrangler` tetap terinstal sebagai devDependency
(karena peer `@opennextjs/cloudflare`) untuk build/preview lokal.

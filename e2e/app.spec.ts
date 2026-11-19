import { test, expect } from '@playwright/test';

// E2E NovelFliy terhadap server produksi lokal (lihat playwright.config.ts).
// Tes yang menyentuh upstream webtoons.com dibuat toleran (pola #35):
// upstream bisa gagal di satu lingkungan — yang diuji adalah kontrak UI/API
// (hasil ATAU pesan gagal yang jujur), bukan isi spesifik webtoons.com.

test.describe('beranda', () => {
  test('hero + pencarian + tautan GitHub tampil', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Baca webtoon trending/i })).toBeVisible();
    await expect(page.getByLabel('Cari webtoon')).toBeVisible();
    const gh = page.getByRole('link', { name: /Kode sumber NovelFliy di GitHub/i });
    await expect(gh).toBeVisible();
    await expect(gh).toHaveAttribute('href', 'https://github.com/dezzorigin/novel-fliy');
    await expect(page.getByRole('link', { name: /Lihat yang trending/i })).toBeVisible();
  });

  test('mobile 390px: tanpa overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(8000);
    const overflow = await page.evaluate(() => ({
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.vw + 1);
  });

  test('trending tampil ATAU pesan gagal yang jujur', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('#trending');
    await expect(grid).toBeVisible();
    const ok = page.locator('#trending a[href^="/detail?url="]').first();
    const fail = page.getByText(/Trending gagal dimuat/);
    await expect(ok.or(fail)).toBeVisible({ timeout: 60_000 });
  });

  test('tab hari mengubah daftar (Senin)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Senin' }).click();
    await expect(page.getByRole('tab', { name: 'Senin' })).toHaveAttribute('aria-selected', 'true');
    const ok = page.locator('#trending a[href^="/detail?url="]').first();
    const fail = page.getByText(/Trending gagal dimuat|Tidak ada judul/);
    await expect(ok.or(fail)).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('pencarian', () => {
  test('cari "tower" dari hero menampilkan hasil ATAU pesan gagal', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Cari webtoon').fill('tower');
    await page.getByRole('button', { name: 'Cari', exact: true }).click();
    await expect(page).toHaveURL(/\/search\?q=tower/);
    const hasil = page.getByText(/Hasil untuk/);
    const fail = page.getByText(/Pencarian gagal dimuat/);
    await expect(hasil.or(fail)).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('api', () => {
  test('/api/status 200 ok:true', async ({ request }) => {
    const res = await request.get('/api/status');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('novel-fliy');
  });

  test('/api/trending: 200 berisi judul ATAU 500/502 berisi error', async ({ request }) => {
    const res = await request.get('/api/trending?day=daily', { timeout: 60_000 });
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items.length).toBeGreaterThan(0);
      for (const item of body.items) expect((item.title || '').trim().length).toBeGreaterThan(0);
    } else {
      expect([500, 502]).toContain(res.status());
      expect((await res.json()).error).toBeTruthy();
    }
  });

  test('validasi: day liar -> 400, URL luar -> 400, tanpa q -> 400', async ({ request }) => {
    expect((await request.get('/api/trending?day=nope')).status()).toBe(400);
    expect((await request.get('/api/detail?url=https%3A%2F%2Fevil.example%2Fx')).status()).toBe(400);
    expect((await request.get('/api/image-proxy?url=https%3A%2F%2Fevil.example%2Fx.jpg')).status()).toBe(400);
    expect((await request.get('/api/search')).status()).toBe(400);
  });

  test('alur detail: trending pertama -> detail memuat episode', async ({ page, request }) => {
    const res = await request.get('/api/trending?day=daily', { timeout: 60_000 });
    test.skip(res.status() !== 200, 'upstream trending tidak menjawab — alur detail di-skip');
    const body = await res.json();
    const first = (body.items || [])[0];
    test.skip(!first, 'trending kosong');
    await page.goto(`/detail?url=${encodeURIComponent(first.url)}`);
    await expect(page.getByRole('heading', { name: 'Episode', exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/dimuat — halaman 1/)).toBeVisible();
  });
});

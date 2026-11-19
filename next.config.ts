import type { NextConfig } from 'next';

// Deploy: Cloudflare Pages via @opennextjs/cloudflare (Worker + aset statis).
// JANGAN pakai `output: 'export'` — aplikasi ini butuh Route Handler
// (/api/trending, /api/search, /api/episodes, /api/read, /api/image-proxy)
// dan static export tidak mendukungnya (build gagal / rute hilang).
const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;

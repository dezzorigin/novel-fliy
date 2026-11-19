import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Konfigurasi OpenNext default untuk Cloudflare Pages/Workers.
// Cache ISR memakai default adapter (tanpa binding eksternal — app ini
// tidak memakai ISR/revalidasi; semua Route Handler dinamis).
export default defineCloudflareConfig();

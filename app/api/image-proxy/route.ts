import { NextRequest, NextResponse } from "next/server";

// Proxy gambar sampul/halaman episode. Gambar webtoon disajikan dari CDN
// webtoons.com / pstatic.net dan menolak hotlink tanpa Referer yang benar.
// Allowlist host ini mencegah proxy dipakai untuk mengambil URL sembarangan
// (SSRF) — hanya host gambar webtoon yang diteruskan.
const ALLOWED_HOSTS = ["webtoons.com", ".webtoons.com", ".pstatic.net"];

const isAllowedImageUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some((h) =>
      h.startsWith(".") ? u.hostname.endsWith(h) : u.hostname === h
    );
  } catch {
    return false;
  }
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return new NextResponse("URL is required", { status: 400 });
  if (!isAllowedImageUrl(url)) {
    return new NextResponse("Host gambar tidak diizinkan", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        Referer: "https://www.webtoons.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to proxy image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    headers.set("Cache-Control", "public, max-age=31536000");

    return new NextResponse(arrayBuffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}

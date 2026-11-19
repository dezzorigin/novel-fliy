import { NextRequest, NextResponse } from "next/server";
import { getEpisodeImages, isWebtoonsUrl } from "@/lib/webtoons-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  if (!isWebtoonsUrl(url)) {
    return NextResponse.json({ error: "URL harus dari webtoons.com" }, { status: 400 });
  }

  try {
    const data = await getEpisodeImages(url);
    return NextResponse.json({ images: data });
  } catch (error) {
    console.error("read error", error);
    return NextResponse.json({ error: "Failed to fetch episode images" }, { status: 500 });
  }
}

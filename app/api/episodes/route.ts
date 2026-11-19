import { NextRequest, NextResponse } from "next/server";
import { getEpisodes, isWebtoonsUrl } from "@/lib/webtoons-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const page = Math.min(Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1), 1000);

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  if (!isWebtoonsUrl(url)) {
    return NextResponse.json({ error: "URL harus dari webtoons.com" }, { status: 400 });
  }

  try {
    const data = await getEpisodes(url, page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("episodes error", error);
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}

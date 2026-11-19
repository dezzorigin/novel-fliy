import { NextRequest, NextResponse } from "next/server";
import { getDetail, isWebtoonsUrl } from "@/lib/webtoons-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  if (!isWebtoonsUrl(url)) {
    return NextResponse.json({ error: "URL harus dari webtoons.com" }, { status: 400 });
  }

  try {
    const data = await getDetail(url);
    return NextResponse.json(data);
  } catch (error) {
    console.error("detail error", error);
    return NextResponse.json({ error: "Failed to fetch detail" }, { status: 500 });
  }
}

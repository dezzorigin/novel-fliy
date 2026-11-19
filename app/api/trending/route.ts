import { NextRequest, NextResponse } from "next/server";
import { getTrending, TRENDING_DAYS } from "@/lib/webtoons-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const day = (searchParams.get("day") || "daily").toLowerCase();
  // "trending" = alias lama untuk harian.
  const valid = day === "trending" ? "daily" : day;
  if (!(TRENDING_DAYS as readonly string[]).includes(valid)) {
    return NextResponse.json({ error: "Parameter day tidak valid" }, { status: 400 });
  }

  try {
    const data = await getTrending(valid);
    return NextResponse.json(data);
  } catch (error) {
    console.error("trending error", error);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}

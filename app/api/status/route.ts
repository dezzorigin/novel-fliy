import { NextResponse } from "next/server";

// Status ringan untuk smoke test & pemantauan — tanpa memanggil upstream
// (trending/search punya smoke-nya sendiri di scripts/smoke.mjs).
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "novel-fliy",
    mode: "live",
    upstream: "webtoons.com",
    time: new Date().toISOString(),
  });
}

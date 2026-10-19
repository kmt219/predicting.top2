export const dynamic = 'force-dynamic'
import { getLiveTrendingMarkets } from "@/lib/live-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const window = (searchParams.get("window") as "1H" | "6H" | "24H" | "3D" | "1W" | null) ?? "1W";
  const query = searchParams.get("query") ?? undefined;

  try {
    const liveData = await getLiveTrendingMarkets(window, query);
    return NextResponse.json({
      asOf: new Date().toISOString(),
      window,
      source: "pmxt",
      items: liveData
    });
  } catch (error: any) {
    console.error("[Trending Markets API Error]:", error.message);
    return NextResponse.json({ error: "Failed to fetch live trending markets", details: error.message }, { status: 502 });
  }
}

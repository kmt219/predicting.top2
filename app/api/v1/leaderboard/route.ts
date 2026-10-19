export const dynamic = 'force-dynamic'
import { getLiveLeaderboard } from "@/lib/live-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") ?? undefined;
    const platform = (searchParams.get("platform") as "ALL" | "PM" | "KS" | "OL" | null) ?? "ALL";
    const sort = (searchParams.get("sort") as "smart_score" | "sharpe" | "win_rate" | "roi" | "pnl" | null) ?? "smart_score";
    const period = (searchParams.get("period") as "1D" | "1M" | "YTD" | "ALL" | null) ?? "1D";
    const minPnl = Number(searchParams.get("minPnl") ?? "0");
    const xLinkedOnly = searchParams.get("xLinkedOnly") === "true";

    const data = await getLiveLeaderboard({ search, platform, sort, period, minPnl, xLinkedOnly });
    
    return NextResponse.json({
      asOf: new Date().toISOString(),
      source: "sample",
      total: data.length,
      period,
      items: data
    });
  } catch (error: any) {
    console.error("[Leaderboard API Error]:", error.message);
    return NextResponse.json({ error: "Failed to fetch live leaderboard", details: error.message }, { status: 502 });
  }
}

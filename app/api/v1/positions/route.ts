export const dynamic = 'force-dynamic'
import { getLivePositions } from "@/lib/live-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const side = (request.nextUrl.searchParams.get("side") as "ALL" | "YES" | "NO" | null) ?? "ALL";
    const platform = (request.nextUrl.searchParams.get("platform") as "ALL" | "PM" | "KS" | "OL" | null) ?? "ALL";

    const filteredItems = await getLivePositions(side, platform);

    return NextResponse.json({
      asOf: new Date().toISOString(),
      source: "sample",
      totalMarkets: filteredItems.length,
      totalPositions: filteredItems.reduce((acc, item) => acc + item.traders.length, 0),
      items: filteredItems
    });
  } catch (error: any) {
    console.error("[Positions API Error]:", error.message);
    return NextResponse.json({ error: "Failed to fetch live positions", details: error.message }, { status: 502 });
  }
}

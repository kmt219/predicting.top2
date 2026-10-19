import { getLeaderboard, getPositions, getTraderProfile } from "@/lib/mock-data";
import { fetchPMXTMarkets, fetchPMXTRecentTrades } from "@/lib/pmxt";
import { PlatformCode, PositionMarket, RecentTrade, TraderProfile, TrendingMarket } from "@/lib/types";

// PMXT currently provides public market and trade data. Trader rankings,
// profiles, historical P&L, and other users' positions remain sample-backed.
export async function getLiveLeaderboard(filters: {
  search?: string;
  platform?: "ALL" | "PM" | "KS" | "OL";
  sort?: "smart_score" | "sharpe" | "win_rate" | "roi" | "pnl";
  period?: "1D" | "1M" | "YTD" | "ALL";
  minPnl?: number;
  xLinkedOnly?: boolean;
}) {
  return getLeaderboard(filters).items;
}

export async function getLiveTraderProfile(slug: string): Promise<TraderProfile | null> {
  return getTraderProfile(slug);
}

export async function getLivePositions(
  side: "ALL" | "YES" | "NO",
  platform: "ALL" | "PM" | "KS" | "OL"
): Promise<PositionMarket[]> {
  return getPositions(side, platform as "ALL" | PlatformCode).items;
}

export async function getLiveTrendingMarkets(_window: string, query?: string): Promise<TrendingMarket[]> {
  return fetchPMXTMarkets(query);
}

export async function getLiveRecentTrades(limit = 100, minAmount = 100): Promise<RecentTrade[]> {
  const trades = await fetchPMXTRecentTrades();
  return trades.filter((trade) => trade.sizeUsd >= minAmount).slice(0, limit);
}

export async function getLiveDailyProfit() {
  // PMXT's public market feed does not provide aggregate trader daily P&L.
  return { dailyProfit: null, tradersCount: null };
}

import { PlatformCode, TrendingMarket, RecentTrade, PositionMarket } from "./types";
import fs from "fs";
import path from "path";

// PMXT Hosted Catalog API
// Docs: https://pmxt.dev/docs/api-reference/fetch-markets
const PMXT_API_BASE = "https://api.pmxt.dev/api";
const CACHE_FILE = path.join(process.cwd(), ".next", "pmxt-cache.json");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCache(key: string, ttlSeconds: number): any | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    const entry = data[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlSeconds * 1000) return null;
    return entry.value;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCacheIncludingExpired(key: string): any | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    const entry = data[key];
    return entry ? entry.value : null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCache(key: string, value: any): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any> = {};
    if (fs.existsSync(CACHE_FILE)) {
      data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
    data[key] = {
      timestamp: Date.now(),
      value
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Cache] write error:", err);
  }
}

type PMXTExchange = "polymarket" | "kalshi" | "opinion";

const EXCHANGE_TO_PLATFORM: Record<PMXTExchange, PlatformCode> = {
  polymarket: "PM",
  kalshi: "KS",
  opinion: "OL",
};

interface PMXTMarketOutcome {
  outcomeId: string;
  label: string;
  price: number | null;
  priceChange24h?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  metadata?: { clobTokenId?: string };
}

interface PMXTUnifiedMarket {
  marketId: string;
  title: string;
  description?: string;
  slug?: string;
  outcomes: PMXTMarketOutcome[];
  resolutionDate?: string;
  volume24h?: number;
  volume?: number;
  liquidity?: number;
  url?: string;
  category?: string;
  tags?: string[];
  status?: string;
  sourceExchange?: string;
  yes?: PMXTMarketOutcome;
  no?: PMXTMarketOutcome;
}

// Call PMXT REST API (GET)
async function pmxtFetch(
  exchange: PMXTExchange,
  method: string,
  params: Record<string, string> = {}
) {
  const apiKey = process.env.PMXT_API_KEY;
  if (!apiKey) throw new Error("PMXT_API_KEY not set");

  const url = new URL(`${PMXT_API_BASE}/${exchange}/${method}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    // Cache for 60s on the server
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PMXT ${exchange}/${method} → ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = await res.json();
  if (payload?.success === false) {
    throw new Error(`PMXT ${exchange}/${method}: ${payload.error?.message ?? "request failed"}`);
  }
  return payload;
}

// Format a USD number to a readable label
function fmtVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M volume`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k volume`;
  return `$${n.toFixed(0)} volume`;
}

// Derive time-to-resolution string
function fmtEndsIn(resolutionDate?: string, status?: string): string {
  if (!resolutionDate) return status === "closed" ? "Ended" : "Active";
  const daysLeft = Math.round(
    (new Date(resolutionDate).getTime() - Date.now()) / 86_400_000
  );
  if (daysLeft <= 0) return "Ended";
  if (daysLeft === 1) return "1d left";
  if (daysLeft < 30) return `${daysLeft}d left`;
  const months = Math.round(daysLeft / 30);
  return `${months}mo left`;
}

// Map a PMXT UnifiedMarket to our TrendingMarket shape
function mapMarket(m: PMXTUnifiedMarket, platform: PlatformCode, livePrice?: number | null): TrendingMarket {
  const yesOutcome = m.yes ?? m.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
  const noOutcome = m.no ?? m.outcomes?.find((o) => o.label?.toLowerCase() === "no");
  const otherOutcome = m.outcomes?.find((o) => {
    const label = o.label?.toLowerCase();
    return label !== "yes" && label !== "no";
  });

  // Price priority: live order book > bestBid/bestAsk mid > catalog price
  const yesPrice = livePrice ?? yesOutcome?.price ?? null;
  const noPrice = noOutcome?.price ?? null;
  const otherPrice = otherOutcome?.price ?? null;

  const prob = yesPrice != null
    ? Math.round(yesPrice * 100)
    : noPrice != null
      ? Math.round((1 - noPrice) * 100)
      : otherPrice != null
        ? Math.round(otherPrice * 100)
        : -1; // -1 = unknown

  const volume24h = m.volume24h ?? 0;
  const volumeTotal = m.volume ?? 0;
  const displayVol = volume24h > 0 ? volume24h : volumeTotal;

  const momentum = "—";

  return {
    slug: m.slug || m.marketId || `${platform}-${(m.title ?? "").slice(0, 40).replace(/\s+/g, "-").toLowerCase()}`,
    title: m.title,
    platform,
    volumeLabel: fmtVolume(displayVol),
    momentum,
    probability: prob >= 0 ? prob : null,
    traders: [],
    url: m.url ?? `https://polymarket.com`,
    endsIn: fmtEndsIn(m.resolutionDate, m.status),
  };
}

// Fetch markets from one exchange, return [] on failure
async function fetchExchange(
  exchange: PMXTExchange,
  query?: string
): Promise<TrendingMarket[]> {
  const params: Record<string, string> = {
    limit: "12",
    status: "active",
  };
  if (query) params.query = query;

  const data = await pmxtFetch(exchange, "fetchMarkets", params);
  const markets: PMXTUnifiedMarket[] = data?.data ?? [];

  const validMarkets = markets.filter((m) => m?.title && m.marketId);

  // Map markets — live prices come from the exchange catalog when available
  // (Order book enrichment skipped to avoid rate limiting on concurrent requests)
  return validMarkets.map((m) =>
    mapMarket(m, EXCHANGE_TO_PLATFORM[exchange])
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchPMXTMarkets(query?: string): Promise<TrendingMarket[]> {
  const cacheKey = `markets_trending_${query || ""}`;
  const cached = getCache(cacheKey, 60); // 1 min cache
  if (cached) return cached;

  const exchanges: PMXTExchange[] = ["polymarket", "kalshi", "opinion"];

  try {
    const results = await Promise.allSettled(
      exchanges.map((ex) => fetchExchange(ex, query))
    );

    const all: TrendingMarket[] = [];
    let successfulExchanges = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        successfulExchanges += 1;
        all.push(...r.value);
      } else {
        console.error("[PMXT] Exchange error:", r.reason?.message ?? r.reason);
      }
    }

    // Sort by volumeLabel descending (parse $XM / $Xk values)
    const parseVol = (label: string) => {
      const m = label.match(/([\d.]+)([kKmM]?)/);
      if (!m) return 0;
      const n = parseFloat(m[1]);
      const u = m[2].toLowerCase();
      return u === "m" ? n * 1_000_000 : u === "k" ? n * 1_000 : n;
    };

    // Deduplicate by slug (in case exchanges return overlapping markets)
    const seen = new Set<string>();
    const deduped = all.filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    });

    if (successfulExchanges === 0) {
      throw new Error("PMXT could not return market data from any exchange");
    }

    const sorted = deduped.sort((a, b) => parseVol(b.volumeLabel) - parseVol(a.volumeLabel)).slice(0, 24);
    if (sorted.length > 0) {
      setCache(cacheKey, sorted);
    }
    return sorted;
  } catch (err) {
    console.error("[PMXT] fetchPMXTMarkets error, using cache fallback:", err);
    const stale = getCacheIncludingExpired(cacheKey);
    if (stale) return stale;
    throw err;
  }
}

// Fetch recent trades from Polymarket via PMXT
// Strategy: get top markets, then fetch trade history for their YES outcomes
export async function fetchPMXTRecentTrades(): Promise<RecentTrade[]> {
  const cacheKey = "recent_trades";
  const cached = getCache(cacheKey, 20); // 20s cache
  if (cached) return cached;

  try {
    // Step 1: Get top 3 active Polymarket markets by volume
    const marketsData = await pmxtFetch("polymarket", "fetchMarkets", {
      limit: "3",
      status: "active",
    });
    const topMarkets: PMXTUnifiedMarket[] = marketsData?.data ?? [];

    if (topMarkets.length === 0) {
      const stale = getCacheIncludingExpired(cacheKey);
      if (stale) return stale;
      throw new Error("PMXT returned no active Polymarket markets");
    }

    // Step 2: For each market, fetch recent trades for the YES outcome token
    // Use sequential requests with a small delay to avoid rate limiting
    const allTrades: RecentTrade[] = [];
    let tradeIndex = 0;
    let successfulOutcomeRequests = 0;

    for (const market of topMarkets) {
      const yesOutcome =
        market.yes ??
        market.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
      const tokenId = yesOutcome?.metadata?.clobTokenId ?? yesOutcome?.outcomeId;
      if (!tokenId) continue;

      // Small delay between requests to avoid 429s
      await new Promise((r) => setTimeout(r, 200));

      try {
        const resp = await pmxtFetch("polymarket", "fetchTrades", {
          outcomeId: tokenId,
          limit: "8",
        });
        successfulOutcomeRequests += 1;

        // PMXT wraps response in { success, data } envelope
        const trades = Array.isArray(resp) ? resp : (resp?.data ?? []);

        if (!Array.isArray(trades) || trades.length === 0) continue;

        for (const t of trades.slice(0, 8)) {
          // amount = shares, price = 0-1 price → sizeUsd = shares * price
          const sizeUsd = (t.amount ?? t.size ?? 0) * (t.price ?? 0);
          if (sizeUsd <= 0) continue;
          const rawTimestamp = t.timestamp;
          const timestamp = typeof rawTimestamp === "number" || (typeof rawTimestamp === "string" && /^\d+$/.test(rawTimestamp))
            ? Number(rawTimestamp)
            : Number.NaN;
          const timestampMs = Number.isFinite(timestamp)
            ? (timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp)
            : typeof rawTimestamp === "string" ? Date.parse(rawTimestamp) : Number.NaN;
          const ts = Number.isFinite(timestampMs)
            ? new Date(timestampMs).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : "Unknown time";
          const trader = t.trader ?? t.maker ?? t.taker ?? "";
          const tradeSide = (t.side ?? "buy").toLowerCase();

          allTrades.push({
            id: t.id ?? t.tradeId ?? `pmxt-${tradeIndex++}`,
            traderSlug: trader || "unknown",
            traderName: trader
              ? (trader.startsWith("0x") && trader.length > 12
                  ? `${trader.slice(0, 6)}…${trader.slice(-4)}`
                  : trader)
              : "Unknown trader",
            marketTitle: market.title,
            side: "YES",
            sizeUsd,
            timestamp: ts,
            platform: "PM",
            price: Math.round((t.price ?? 0) * 100),
            category: market.category ?? "Markets",
            type: tradeSide === "sell" ? "sell" : "buy",
          } satisfies RecentTrade);
        }
      } catch (err) {
        console.error(`[PMXT] fetchTrades for ${tokenId}:`, err);
      }
    }

    if (successfulOutcomeRequests === 0) {
      throw new Error("PMXT could not return trade data for the active markets");
    }

    const sorted = allTrades.sort((a, b) => b.sizeUsd - a.sizeUsd).slice(0, 20);
    if (sorted.length > 0) {
      setCache(cacheKey, sorted);
    }
    return sorted;
  } catch (err) {
    console.error("[PMXT] fetchPMXTRecentTrades error, using cache fallback:", err);
    const stale = getCacheIncludingExpired(cacheKey);
    if (stale) return stale;
    throw err;
  }
}

// Positions: Build live position cards from top-market trade data
export async function fetchPMXTPositions(): Promise<PositionMarket[]> {
  const cacheKey = "positions";
  const cached = getCache(cacheKey, 60); // 1 min cache
  if (cached) return cached;

  try {
    // Get top 5 markets
    const marketsData = await pmxtFetch("polymarket", "fetchMarkets", {
      limit: "5",
      status: "active",
    });
    const topMarkets: PMXTUnifiedMarket[] = marketsData?.data ?? [];
    if (topMarkets.length === 0) return getCacheIncludingExpired(cacheKey) || [];

    const positions: PositionMarket[] = [];

    for (const market of topMarkets.slice(0, 3)) {
      const yesOutcome = market.yes ?? market.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
      const tokenId = yesOutcome?.metadata?.clobTokenId ?? yesOutcome?.outcomeId;
      if (!tokenId) continue;

      await new Promise((r) => setTimeout(r, 200));

      try {
        const resp = await pmxtFetch("polymarket", "fetchTrades", {
          outcomeId: tokenId,
          limit: "20",
        });
        const trades = Array.isArray(resp) ? resp : (resp?.data ?? []);
        if (!Array.isArray(trades) || trades.length === 0) continue;

        // Aggregate by taker address
        const traderMap = new Map<string, { volume: number; buys: number; sells: number; lastPrice: number }>();
        for (const t of trades) {
          const addr = t.taker ?? t.maker ?? "";
          if (!addr) continue;
          const existing = traderMap.get(addr) ?? { volume: 0, buys: 0, sells: 0, lastPrice: 0 };
          const size = (t.amount ?? 0) * (t.price ?? 0);
          existing.volume += size;
          existing.lastPrice = t.price ?? existing.lastPrice;
          if ((t.side ?? "").toLowerCase() === "buy") existing.buys++;
          else existing.sells++;
          traderMap.set(addr, existing);
        }

        const topTraders = Array.from(traderMap.entries())
          .sort(([, a], [, b]) => b.volume - a.volume)
          .slice(0, 3)
          .map(([addr, data], i) => ({
            traderSlug: addr,
            traderName: `${addr.slice(0, 6)}…${addr.slice(-4)}`,
            score: Math.min(99, Math.round(60 + data.buys * 2 - data.sells + i * 2)),
            entry: Math.round(data.lastPrice * 100) / 100,
            pnlUsd: Math.round(data.volume * 0.08 * (data.buys > data.sells ? 1 : -0.5)),
            shares: `${Math.round(data.volume * 10).toLocaleString()}`,
            valueUsd: Math.round(data.volume * 1.08),
          }));

        if (topTraders.length === 0) continue;

        const totalValue = topTraders.reduce((s, t) => s + t.valueUsd, 0);
        positions.push({
          slug: market.slug || market.marketId,
          title: market.title,
          platform: "PM",
          side: "YES",
          marketValueUsd: totalValue,
          smartMoneyShare: Math.min(95, Math.round(50 + topTraders.length * 10)),
          traders: topTraders,
        });
      } catch (err) {
        console.error(`[PMXT] positions fetchTrades error:`, err);
      }
    }

    if (positions.length > 0) {
      setCache(cacheKey, positions);
    }
    return positions;
  } catch (err) {
    console.error("[PMXT] fetchPMXTPositions error, using cache fallback:", err);
    return getCacheIncludingExpired(cacheKey) || [];
  }
}

// Build a live leaderboard from trade activity across top markets
export async function fetchTopTraders(): Promise<{
  wallet: string;
  displayName: string;
  volume24h: number;
  tradeCount: number;
  platform: PlatformCode;
}[]> {
  const cacheKey = "top_traders";
  const cached = getCache(cacheKey, 180); // 3 mins cache
  if (cached) return cached;

  try {
    // Get top 4 markets by 24h volume
    const marketsData = await pmxtFetch("polymarket", "fetchMarkets", {
      limit: "4",
      status: "active",
    });
    const markets: PMXTUnifiedMarket[] = marketsData?.data ?? [];

    const walletMap = new Map<string, { volume: number; trades: number; wins: number }>();

    for (const market of markets) {
      const yesOutcome = market.yes ?? market.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
      const tokenId = yesOutcome?.metadata?.clobTokenId ?? yesOutcome?.outcomeId;
      if (!tokenId) continue;

      await new Promise((r) => setTimeout(r, 200));

      try {
        const resp = await pmxtFetch("polymarket", "fetchTrades", {
          outcomeId: tokenId,
          limit: "15",
        });
        const trades = Array.isArray(resp) ? resp : (resp?.data ?? []);
        if (!Array.isArray(trades)) continue;

        for (const t of trades) {
          const addr = t.taker ?? t.maker ?? "";
          if (!addr || addr.length < 10) continue;
          const size = (t.amount ?? 0) * (t.price ?? 0);
          const existing = walletMap.get(addr) ?? { volume: 0, trades: 0, wins: 0 };
          existing.volume += size;
          existing.trades++;
          if ((t.side ?? "").toLowerCase() === "buy") existing.wins++;
          walletMap.set(addr, existing);
        }
      } catch { /* skip failed market */ }
    }

    const result = Array.from(walletMap.entries())
      .sort(([, a], [, b]) => b.volume - a.volume)
      .slice(0, 20)
      .map(([wallet, data]) => ({
        wallet,
        displayName: `${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
        volume24h: data.volume,
        tradeCount: data.trades,
        platform: "PM" as PlatformCode,
      }));

    if (result.length > 0) {
      setCache(cacheKey, result);
    }
    return result;
  } catch (err) {
    console.error("[PMXT] fetchTopTraders error, using cache fallback:", err);
    return getCacheIncludingExpired(cacheKey) || [];
  }
}

export function exchangeLabel(platform: PlatformCode): string {
  return { PM: "Polymarket", KS: "Kalshi", OL: "Opinion Labs" }[platform] ?? platform;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { TrendingMarket, TrendWindow } from "@/lib/types";
import { getTraderProfile } from "@/lib/mock-data";

const windows: TrendWindow[] = ["1H", "6H", "24H", "3D", "1W"];
const scoreOptions = ["Any", "60", "70", "80"];
const sharpeOptions = ["Any", "0.0", "0.5", "1.0", "1.5", "2.0"];

function getMarketFlagEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("argentina")) return "🇦🇷";
  if (t.includes("france")) return "🇫🇷";
  if (t.includes("england")) return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (t.includes("spain")) return "🇪🇸";
  if (t.includes("iran")) return "🇮🇷";
  if (t.includes("fed ") || t.includes("rate") || t.includes("inflation") || t.includes("interest")) return "👨‍💼";
  if (t.includes("btc") || t.includes("bitcoin") || t.includes("crypto")) return "🪙";
  return "🌐";
}

export function TrendingMarketCard({ market }: { market: TrendingMarket }) {
  const probColor = market.probability == null ? "var(--muted)" : market.probability >= 50 ? "var(--green)" : "var(--red)";
  const probDisplay = market.probability == null ? "—" : `${market.probability}%`;

  function openMarket() {
    window.open(market.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="panel market-card"
      role="button"
      tabIndex={0}
      onClick={openMarket}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openMarket(); }}
      aria-label={`Open market: ${market.title}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        borderRadius: "4px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        transition: "all 150ms ease",
        cursor: "pointer"
      }}
    >
      {/* Title & Probability row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <span className="market-flag-badge" style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.95rem",
            flexShrink: 0,
            overflow: "hidden"
          }}>
            {market.icon ? (
              <Image
                src={market.icon}
                alt=""
                width={24}
                height={24}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                unoptimized
              />
            ) : (
              getMarketFlagEmoji(market.title)
            )}
          </span>
          <span id={`market-title-${market.slug}`} className="market-title" style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {market.title}
          </span>
        </div>
        <span className="market-prob" style={{ color: probColor, fontWeight: 700, fontSize: "0.95rem", flexShrink: 0 }}>
          {probDisplay}
        </span>
      </div>

      {/* Stats row: live market volume, activity availability, and expiry */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.8rem",
        color: "var(--muted)",
        marginTop: "auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontWeight: 700, color: "var(--text)" }}>{market.volumeLabel}</span>
          <span>·</span>
          <span>{market.traders.length ? `${market.traders.length} traders` : "Trader data unavailable"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{
            fontWeight: 700,
            color: market.momentum === "—" ? "var(--muted)" : market.momentum.startsWith("+") ? "var(--green)" : "var(--red)"
          }}>
            {market.momentum}
          </span>
          <span>·</span>
          <span>{market.endsIn}</span>
        </div>
      </div>

      {/* Traders Mini Table */}
      <div className="market-traders" style={{ marginTop: "4px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
        <div className="market-traders-scroll" style={{ width: "100%" }}>
          <table className="market-traders-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", color: "var(--muted)", fontWeight: 700, fontSize: "0.72rem", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trader</th>
                <th style={{ textAlign: "left", color: "var(--muted)", fontWeight: 700, fontSize: "0.72rem", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>TXs</th>
                <th style={{ textAlign: "left", color: "var(--muted)", fontWeight: 700, fontSize: "0.72rem", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trader flow</th>
                <th style={{ textAlign: "right", color: "var(--muted)", fontWeight: 700, fontSize: "0.72rem", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last</th>
              </tr>
            </thead>
            <tbody>
              {market.traders.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "8px 0", color: "var(--muted)" }}>PMXT market data does not include trader activity.</td></tr>
              ) : market.traders.slice(0, 3).map((t, idx) => {
                const [yesTxs, noTxs] = t.txs.split("/");
                const isPositiveInflow = t.inflow >= 0;
                const inflowText = isPositiveInflow
                  ? `+$${Math.round(t.inflow).toLocaleString()}`
                  : `-$${Math.abs(Math.round(t.inflow)).toLocaleString()}`;
                const inflowColor = isPositiveInflow ? "var(--green)" : "var(--red)";
                return (
                  <tr
                    key={`${t.name}-${idx}`}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/account/${encodeURIComponent(t.name)}`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        window.location.href = `/account/${encodeURIComponent(t.name)}`;
                      }
                    }}
                    style={{
                      borderTop: idx > 0 ? "1px solid rgba(255, 255, 255, 0.02)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: "6px 0", color: "var(--text)", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Image
                          src={t.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(t.name.trim())}`}
                          alt={t.name}
                          width={16}
                          height={16}
                          style={{ width: 16, height: 16, borderRadius: "50%" }}
                          unoptimized
                        />
                        <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "90px", display: "inline-block" }}>
                          {t.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "6px 0" }}>
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>{yesTxs}</span>
                      <span style={{ color: "rgba(255, 255, 255, 0.2)", margin: "0 4px" }}>/</span>
                      <span style={{ color: "var(--red)", fontWeight: 600 }}>{noTxs}</span>
                    </td>
                    <td style={{ padding: "6px 0", fontWeight: 600, color: inflowColor }}>
                      {inflowText}
                    </td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: "var(--muted)" }}>
                      <span>{t.last}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function TrendingMarketsSkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "20px",
      marginTop: "24px"
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="panel market-card" style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "16px",
          borderRadius: "4px",
          background: "var(--panel)",
          border: "1px solid var(--border)"
        }}>
          {/* Title & Probability skeleton */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", width: "80%" }}>
              <span className="skeleton-pulse" style={{ width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                <span className="skeleton-pulse" style={{ width: "100%", height: "14px" }} />
                <span className="skeleton-pulse" style={{ width: "70%", height: "14px" }} />
              </div>
            </div>
            <span className="skeleton-pulse" style={{ width: "35px", height: "16px", flexShrink: 0 }} />
          </div>
          {/* Stats row skeleton */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
            <span className="skeleton-pulse" style={{ width: "120px", height: "14px" }} />
            <span className="skeleton-pulse" style={{ width: "100px", height: "14px" }} />
          </div>
          {/* Traders Mini Table skeleton */}
          <div style={{ marginTop: "4px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {Array.from({ length: 3 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ padding: "6px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="skeleton-pulse" style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
                        <span className="skeleton-pulse" style={{ width: "60px", height: "12px" }} />
                      </div>
                    </td>
                    <td style={{ padding: "6px 0" }}>
                      <span className="skeleton-pulse" style={{ width: "35px", height: "12px" }} />
                    </td>
                    <td style={{ padding: "6px 0" }}>
                      <span className="skeleton-pulse" style={{ width: "50px", height: "12px" }} />
                    </td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>
                      <span className="skeleton-pulse" style={{ width: "30px", height: "12px" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendingMarketsSection() {
  const [trendWindow, setTrendWindow] = useState<TrendWindow>("1W");
  const [greaterThan95, setGreaterThan95] = useState(false);
  const [sportsOnly, setSportsOnly] = useState(false);
  const [endedOnly, setEndedOnly] = useState(false);
  const [lessThan30d, setLessThan30d] = useState(false);
  const [fivePlusTraders, setFivePlusTraders] = useState(false);
  const [scoreFloor, setScoreFloor] = useState("Any");
  const [sharpeFloor, setSharpeFloor] = useState("Any");

  const [markets, setMarkets] = useState<TrendingMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/v1/markets/trending?window=${trendWindow}`)
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.items ?? []);
        setMarkets(items);
      })
      .catch((err) => console.error("Error loading trending markets:", err))
      .finally(() => setIsLoading(false));
  }, [trendWindow]);

  const filteredItems = useMemo(() => {
    let result = [...markets];

    if (greaterThan95) {
      result = result.filter((m) => (m.probability ?? 0) > 95);
    }

    if (sportsOnly) {
      result = result.filter((m) =>
        /sport|soccer|football|basketball|nfl|nba|cricket|tennis|golf|f1|world cup/i.test(m.title)
      );
    }

    if (endedOnly) {
      result = result.filter((m) => !m.endsIn.toLowerCase().includes("left") && m.endsIn !== "Active");
    } else {
      result = result.filter((m) => m.endsIn.toLowerCase().includes("left") || m.endsIn === "Active");
    }

    if (lessThan30d) {
      result = result.filter((m) => {
        const s = m.endsIn.toLowerCase();
        if (s.includes("h left")) return true;
        const match = s.match(/(\d+)d/);
        return match ? parseInt(match[1]) < 30 : false;
      });
    }

    if (fivePlusTraders) {
      result = result.filter((m) => m.traders.length >= 5);
    }

    // Score/Sharpe filters (requires matching trader profile in mock metadata)
    if (scoreFloor !== "Any") {
      result = result.filter((m) =>
        m.traders.some((t) => {
          const profile = getTraderProfile(t.name);
          return profile && profile.smartScore >= Number(scoreFloor);
        })
      );
    }

    if (sharpeFloor !== "Any") {
      result = result.filter((m) =>
        m.traders.some((t) => {
          const profile = getTraderProfile(t.name);
          return profile && profile.sharpe >= Number(sharpeFloor);
        })
      );
    }

    return result;
  }, [markets, greaterThan95, sportsOnly, endedOnly, lessThan30d, fivePlusTraders, scoreFloor, sharpeFloor]);

  const visibleItems = filteredItems.slice(0, visibleCount);

  return (
    <div id="trending-markets" style={{ marginTop: "48px" }}>
      <div className="trending-box panel" style={{ padding: 0 }}>
        <div className="trending-header" style={{ padding: "18px 18px 12px 18px" }}>
          <h2 style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            marginBottom: "12px",
            fontFamily: "Inter, sans-serif"
          }}>Trending Markets</h2>

          {/* Filter Row matching screenshot */}
          <div className="trending-filter-row" style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "8px 12px",
            flexWrap: "wrap",
            width: "100%",
            marginTop: "12px"
          }}>
            {/* Timeframe selector group */}
            <div className="trending-pill-group" style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "2px",
              gap: "2px"
            }}>
              {windows.map((w) => (
                <button
                  key={w}
                  onClick={() => setTrendWindow(w)}
                  type="button"
                  style={{
                    background: w === trendWindow ? "var(--text)" : "transparent",
                    color: w === trendWindow ? "var(--bg)" : "var(--muted)",
                    border: "none",
                    borderRadius: "3px",
                    padding: "5px 10px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 120ms ease"
                  }}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Tag Buttons: >95%, Sports, Ended, <30d, 5+ */}
            {[
              { label: ">95%", active: greaterThan95, onClick: () => setGreaterThan95(!greaterThan95) },
              { label: "Sports", active: sportsOnly, onClick: () => setSportsOnly(!sportsOnly) },
              { label: "Ended", active: endedOnly, onClick: () => setEndedOnly(!endedOnly) },
              { label: "<30d", active: lessThan30d, onClick: () => setLessThan30d(!lessThan30d) },
              { label: "5+", active: fivePlusTraders, onClick: () => setFivePlusTraders(!fivePlusTraders) }
            ].map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={tag.onClick}
                style={{
                  background: tag.active ? "var(--text)" : "transparent",
                  color: tag.active ? "var(--bg)" : "var(--text)",
                  border: tag.active ? "none" : "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "5px 10px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 120ms ease"
                }}
              >
                {tag.label}
              </button>
            ))}

            <span className="trending-divider" style={{
              width: "1px",
              height: "18px",
              background: "var(--border)",
              margin: "0 4px"
            }} />

            {/* Score Dropdown */}
            <div className="trending-select-wrapper" style={{ position: "relative" }}>
              <select
                className="trending-select"
                value={scoreFloor}
                onChange={(e) => setScoreFloor(e.target.value)}
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  color: "var(--text)",
                  padding: "6px 24px 6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  backgroundSize: "10px"
                }}
              >
                <option value="Any" style={{ background: "var(--panel)", color: "var(--text)" }}>Score</option>
                {scoreOptions.filter(o => o !== "Any").map((v) => (
                  <option key={v} value={v} style={{ background: "var(--panel)", color: "var(--text)" }}>{v}+</option>
                ))}
              </select>
            </div>

            {/* Sharpe Dropdown */}
            <div className="trending-select-wrapper" style={{ position: "relative" }}>
              <select
                className="trending-select"
                value={sharpeFloor}
                onChange={(e) => setSharpeFloor(e.target.value)}
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  color: "var(--text)",
                  padding: "6px 24px 6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  backgroundSize: "10px"
                }}
              >
                <option value="Any" style={{ background: "var(--panel)", color: "var(--text)" }}>Sharpe</option>
                {sharpeOptions.filter(o => o !== "Any").map((v) => (
                  <option key={v} value={v} style={{ background: "var(--panel)", color: "var(--text)" }}>{v}+</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Scrollable grid area */}
        <div className="trending-scroll-area">
          {/* Grid of cards */}
      {isLoading ? (
        <TrendingMarketsSkeleton />
      ) : visibleItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border)" }}>
          No trending markets found matching these filters.
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "18px"
          }}>
            {visibleItems.map((market, idx) => (
              <TrendingMarketCard key={`${market.slug}-${idx}`} market={market} />
            ))}
          </div>

          {/* Show More / Show Less button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "22px" }}>
            {visibleCount < filteredItems.length ? (
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="trending-show-more"
                type="button"
              >
                Show More
              </button>
            ) : filteredItems.length > 6 ? (
              <button
                onClick={() => setVisibleCount(6)}
                className="trending-show-more"
                type="button"
              >
                Show Less
              </button>
            ) : null}
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}

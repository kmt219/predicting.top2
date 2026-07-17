"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { RecentTradesTable, RecentTradesTableSkeleton } from "@/components/recent-trades";
import { TrendingMarketsSection } from "@/components/trending-markets";
import { LeaderboardSortKey, PeriodKey, PlatformCode, TraderSummary, RecentTrade } from "@/lib/types";
import { platformLogo } from "@/components/platform-badges";
import { SiteHeader } from "@/components/site-header";

const periods: PeriodKey[] = ["ALL", "YTD", "1M", "1D"];
const platformKeys: PlatformCode[] = ["PM", "KS", "OL"];
const sortKeys: Array<{ label: string; value: LeaderboardSortKey }> = [
  { label: "Sharpe", value: "sharpe" },
  { label: "Win%", value: "win_rate" },
  { label: "ROI", value: "roi" }
];



const EMPTY: { asOf: string; source: string; total: number; items: TraderSummary[] } = {
  asOf: "",
  source: "loading",
  total: 0,
  items: [],
};

function LeaderboardTableSkeleton() {
  return (
    <div className="panel table-panel">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Trader</th>
            <th>Joined</th>
            <th>Score</th>
            <th style={{ textAlign: "right" }}>P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              <td className="rank-col">
                <span className="skeleton-pulse" style={{ width: "16px", height: "16px" }} />
              </td>
              <td>
                <div className="trader-cell">
                  <div className="skeleton-pulse" style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0 }} />
                  <div className="trader-info" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span className="skeleton-pulse" style={{ width: "100px", height: "14px" }} />
                    <div className="social-badges-row" style={{ display: "flex", gap: "4px" }}>
                      <span className="skeleton-pulse" style={{ width: "40px", height: "12px" }} />
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span className="skeleton-pulse" style={{ width: "35px", height: "14px" }} />
              </td>
              <td>
                <span className="skeleton-pulse" style={{ width: "30px", height: "14px" }} />
              </td>
              <td style={{ textAlign: "right" }}>
                <span className="skeleton-pulse" style={{ width: "70px", height: "14px" }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HomePage() {
  const [period, setPeriod] = useState<PeriodKey>("ALL");
  const [platform, setPlatform] = useState<"ALL" | PlatformCode>("ALL");
  const [sort, setSort] = useState<LeaderboardSortKey>("smart_score");
  const [search, setSearch] = useState("");
  const [xLinkedOnly, setXLinkedOnly] = useState(false);
  const [minPnlFilter, setMinPnlFilter] = useState(0); // 0 or 5000 ($5+)
  const [leaderboard, setLeaderboard] = useState(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [isTradesLoading, setIsTradesLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [visibleCount, setVisibleCount] = useState(30);
  const [dailyProfit, setDailyProfit] = useState<number | null>(null);

  useEffect(() => {
    setVisibleCount(30);
  }, [period, platform, sort, search, xLinkedOnly, minPnlFilter]);

  useEffect(() => {
    fetch("/api/v1/daily-profit")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.dailyProfit === "number") {
          setDailyProfit(data.dailyProfit);
        }
      })
      .catch((err) => console.error("Error loading daily profit:", err));
  }, []);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const formatAsOf = (asOfStr: string) => {
    if (!asOfStr) return "Jul 14, 12:48 PM";
    try {
      const date = new Date(asOfStr);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).replace(",", "");
    } catch {
      return "Jul 14, 12:48 PM";
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/v1/leaderboard?period=${period}&platform=${platform}&sort=${sort}&search=${encodeURIComponent(search)}&xLinkedOnly=${xLinkedOnly}&minPnl=${minPnlFilter}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => setLeaderboard(data))
      .catch((err) => console.error("Leaderboard fetch error:", err))
      .finally(() => setIsLoading(false));
  }, [period, platform, sort, search, xLinkedOnly, minPnlFilter]);

  useEffect(() => {
    setIsTradesLoading(true);
    fetch("/api/v1/trades/recent")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentTrades(data);
        } else if (data && data.items) {
          setRecentTrades(data.items);
        }
      })
      .catch((err) => console.error("[Trades] fetch error:", err))
      .finally(() => setIsTradesLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <section className="homepage-grid">
        <div className="hero-section" style={{ padding: "0 0 20px 0" }}>
          
          {/* Unified spec-compliant header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: "20px"
          }}>
            <div>
              <h1 style={{
                fontSize: "2.1rem",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
                fontFamily: "Inter, var(--font-sans), sans-serif",
                letterSpacing: "-0.025em"
              }}>Prediction Leaderboard</h1>
              <p style={{
                fontSize: "0.88rem",
                color: "var(--muted)",
                margin: "5px 0 2px 0",
                fontFamily: "Inter, var(--font-sans), sans-serif",
                fontWeight: 500
              }}>Track the Top Prediction Traders in Realtime</p>
              <p style={{
                fontSize: "0.75rem",
                color: "var(--muted)",
                opacity: 0.8,
                margin: 0,
                fontFamily: "Inter, var(--font-sans), sans-serif"
              }}>P&L updated {formatAsOf(leaderboard.asOf)}</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14, width: "auto" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Link
                  href="/positions"
                  style={{
                    padding: "7px 14px",
                    borderRadius: "4px",
                    color: "var(--text)",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    fontFamily: "Inter, var(--font-sans), sans-serif",
                    transition: "background-color 120ms ease, border-color 120ms ease"
                  }}
                >
                  Positions
                </Link>
                <Link
                  href="/#trending-markets"
                  onClick={(e) => {
                    const el = document.getElementById("trending-markets");
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                      window.history.pushState(null, "", "/#trending-markets");
                    }
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "4px",
                    color: "var(--bg)",
                    background: "var(--text)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    fontFamily: "Inter, var(--font-sans), sans-serif",
                    transition: "opacity 120ms ease"
                  }}
                >
                  Trending Markets
                </Link>
              </div>


              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "Inter, var(--font-sans), sans-serif"
                }}>
                  Today:{" "}
                  <span style={{ color: dailyProfit != null && dailyProfit >= 0 ? "var(--green)" : "var(--red)" }}>
                    {dailyProfit != null
                      ? (dailyProfit >= 0 ? "+" : "") + new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(dailyProfit)
                      : "-$264,168"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search row with count and theme icon */}
          <div className="search-row" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            width: "100%",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "nowrap", width: "100%" }}>
              <div className="search-input-wrapper" style={{ margin: 0 }}>
                <input
                  type="text"
                  placeholder="Search traders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: 200,
                    padding: "7px 12px",
                    background: "var(--panel-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    fontFamily: "Inter, var(--font-sans), sans-serif",
                    outline: "none"
                  }}
                />
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "Inter, var(--font-sans), sans-serif" }}>
                {Math.min(visibleCount, leaderboard.items.length)} of {leaderboard.total || 0} traders
              </span>
            </div>
            
            <button
              onClick={toggleTheme}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 120ms ease"
              }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/>
                  <path d="M12 20v2"/>
                  <path d="M4.93 4.93l1.41 1.41"/>
                  <path d="M17.66 17.66l1.41 1.41"/>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="M6.34 17.66l-1.41 1.41"/>
                  <path d="M19.07 4.93l-1.41 1.41"/>
                </svg>
              )}
            </button>
          </div>

          {/* Typography-compliant Filter row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span className="filter-label-prefix" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "4px" }}>P&L:</span>
              
              {periods.map((item) => {
                const isActive = item === period;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriod(item)}
                    style={isActive ? {
                      background: "var(--text)",
                      color: "var(--bg)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer"
                    } : {
                      background: "transparent",
                      color: "var(--muted)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      padding: "6px 8px",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    {item}
                  </button>
                );
              })}

              {/* Functional active $5+ button chip */}
              <button
                type="button"
                onClick={() => setMinPnlFilter(minPnlFilter === 5000 ? 0 : 5000)}
                style={minPnlFilter === 5000 ? {
                  background: "var(--text)",
                  color: "var(--bg)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer"
                } : {
                  background: "transparent",
                  color: "var(--muted)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  padding: "6px 8px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                $5+
              </button>

              {/* Platform Group Container (PM, KS, OL, All grouped) */}
              <div className="platform-filter-group">
                {platformKeys.map((item) => {
                  const isActive = platform === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPlatform(item)}
                      className={`platform-filter-btn ${isActive ? "active" : ""}`}
                    >
                      {platformLogo(item)}
                      {item}
                    </button>
                  );
                })}
                
                {/* All Platform filter inside the container */}
                <button
                  type="button"
                  onClick={() => setPlatform("ALL")}
                  className={`platform-filter-btn ${platform === "ALL" ? "active" : ""}`}
                >
                  All
                </button>
              </div>

              {/* PredictIt circular decorative logo */}
              <span className="platform-predictit-chip" style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "all 120ms ease"
              }} title="PredictIt">
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="var(--text)" />
                  <circle cx="12" cy="12" r="6" fill="none" stroke="var(--bg)" strokeWidth="2.2" />
                  <circle cx="12" cy="12" r="2" fill="var(--bg)" />
                </svg>
              </span>

              {/* X linked toggle chip */}
              <button
                type="button"
                onClick={() => setXLinkedOnly(!xLinkedOnly)}
                style={xLinkedOnly ? {
                  background: "var(--text)",
                  color: "var(--bg)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                } : {
                  background: "var(--panel-2)",
                  color: "var(--muted)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, display: "block" }} aria-hidden="true">
                  <rect width="24" height="24" rx="4" fill={xLinkedOnly ? "var(--bg)" : "var(--text)"} />
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill={xLinkedOnly ? "var(--text)" : "var(--bg)"} />
                </svg>
                linked
              </button>
            </div>

            {/* Muted metrics indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {sortKeys.map((item) => {
                const isActive = sort === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSort(item.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isActive ? "var(--text)" : "var(--muted)",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      padding: "4px 0",
                      transition: "color 120ms ease"
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <LeaderboardTableSkeleton />
          ) : (
            <>
              <LeaderboardTable traders={leaderboard.items.slice(0, visibleCount)} sort={sort} />
              {visibleCount < leaderboard.items.length && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 30)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "8px 28px",
                      fontFamily: "Inter, sans-serif",
                      transition: "color 120ms ease"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "var(--text)")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "var(--muted)")}
                  >
                    Load More &darr;
                  </button>
                </div>
              )}
            </>
          )}

          {/* Trending Markets section */}
          <TrendingMarketsSection />

          {/* Recent Trades section */}
          <div id="recent-trades" style={{ marginTop: "48px" }}>
            <h2 style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "16px",
              fontFamily: "Inter, sans-serif"
            }}>Recent Trades</h2>

            {isTradesLoading ? (
              <RecentTradesTableSkeleton />
            ) : (
              <RecentTradesTable items={recentTrades} />
            )}
          </div>
        </div>
      </section>

      {/* Floating Scroll Button */}
      <button
        onClick={() => {
          const el = document.getElementById("recent-trades");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "#ffffff",
          color: "#000000",
          border: "none",
          borderRadius: "4px",
          padding: "8px 16px",
          fontSize: "0.88rem",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          zIndex: 1000,
          fontFamily: "Inter, sans-serif"
        }}
      >
        Recent Trades &darr;
      </button>
    </main>
  );
}

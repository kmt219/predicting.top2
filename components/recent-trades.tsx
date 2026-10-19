"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { RecentTrade, PlatformCode } from "@/lib/types";
import { getTraderProfile } from "@/lib/mock-data";
import { platformLogo } from "@/components/platform-badges";

function formatAmount(n: number) {
  // Match image: $262.26 style (no k/M abbreviation for small amounts)
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toFixed(2)}`;
}

function PlatformLogoBadge({ platform }: { platform: PlatformCode }) {
  return (
    <span title={platform === "PM" ? "Polymarket" : platform === "KS" ? "Kalshi" : "Opinion Labs"} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, flexShrink: 0
    }}>
      {platformLogo(platform)}
    </span>
  );
}

function MarketEmoji({ title, category }: { title: string; category: string }) {
  const t = title.toLowerCase();
  if (t.includes("bitcoin") || t.includes("btc")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>₿</span>;
  if (t.includes("trump") || t.includes("u.s.") || t.includes("usa") || t.includes("republican") || t.includes("iran") || t.includes("invade")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🇺🇸</span>;
  if (t.includes("google")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🌐</span>;
  if (t.includes("ships") || t.includes("hormuz")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🚢</span>;
  if (t.includes("esp") || t.includes("spain")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🇪🇸</span>;
  if (t.includes("arg") || t.includes("argentina")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🇦🇷</span>;
  if (t.includes("france")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🇫🇷</span>;
  if (t.includes("fifa") || t.includes("world cup") || t.includes("final")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>⚽</span>;
  if (t.includes("fed") || t.includes("rate") || t.includes("inflation")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🏦</span>;
  if (t.includes("ukraine") || t.includes("ceasefire")) return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🕊️</span>;
  if (t.includes("messi") || category === "Sports") return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>⚽</span>;
  if (category === "Politics") return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>🗳️</span>;
  if (category === "Macro") return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>📈</span>;
  return <span style={{ fontSize: "1rem", marginRight: 8, flexShrink: 0 }}>📊</span>;
}

// Simple card variant used on homepage sidebar
export function RecentTrades({ items, detailed = false }: { items: RecentTrade[]; detailed?: boolean }) {
  if (detailed) {
    return (
      <section className="panel side-panel">
        <div className="section-heading"><div><p className="eyebrow">Flow</p><h2>Recent Trades</h2></div></div>
        <div className="table-wrap">
          <table className="leaderboard-table dense-table">
            <thead><tr><th>Trader</th><th>Score</th><th>Sharpe</th><th>Market</th><th>Side</th><th>Price</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              {items.map((trade, idx) => {
                const trader = getTraderProfile(trade.traderSlug);
                return (
                  <tr key={`${trade.id}-${idx}`} className={trade.traderScore == null ? "" : trade.traderScore >= 0 ? "positive" : "negative"}>
                    <td>{trade.traderSlug === "unknown" ? trade.traderName : <Link href={`/account/${trade.traderSlug}`} style={{ color: '#00b7ff', textDecoration: 'underline', cursor: 'pointer' }}>{trade.traderName}</Link>}</td>
                    <td>{trader ? trader.smartScore.toFixed(1) : "-"}</td>
                    <td>{trader ? trader.sharpe.toFixed(2) : "-"}</td>
                    <td>{trade.marketTitle}</td>
                    <td>{trade.side}</td>
                    <td>{trade.price}¢</td>
                    <td>{formatAmount(trade.sizeUsd)}</td>
                    <td className="muted">{trade.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  return (
    <section className="panel side-panel">
      <div className="section-heading"><div><p className="eyebrow">Flow</p><h2>Recent Trades</h2></div></div>
      <div className="stack-list">
        {items.map((trade, idx) => (
          <div className={`trade-card ${trade.traderScore == null ? "" : trade.traderScore >= 0 ? "trade-positive" : "trade-negative"}`} key={`${trade.id}-${idx}`}>
            <div className="trade-card-top">
              {trade.traderSlug === "unknown" ? trade.traderName : <Link href={`/account/${trade.traderSlug}`} style={{ color: '#00b7ff', textDecoration: 'underline', cursor: 'pointer' }}>{trade.traderName}</Link>}
              <span className="pill compact-pill">{trade.side}</span>
            </div>
            <p>{trade.marketTitle}</p>
            <div className="trade-meta muted">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {platformLogo(trade.platform)}
                {trade.platform}
              </span><span>{formatAmount(trade.sizeUsd)}</span>
              {trade.traderScore != null && <span className={trade.traderScore >= 0 ? "positive" : "negative"}>{trade.traderScore >= 0 ? `+${trade.traderScore.toFixed(2)}` : trade.traderScore.toFixed(2)}</span>}
              <span>{trade.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const SIZE_OPTS = [{ label: "$100+", value: "100" }, { label: "$1k+", value: "1000" }, { label: "$10k+", value: "10000" }];
const SCORE_OPTS = ["50", "60", "70", "80"];
const SHARPE_OPTS = ["0.0", "0.5", "1.0", "1.5", "2.0"];

export function RecentTradesTableSkeleton() {
  const th: React.CSSProperties = {
    color: "#ffffff", fontWeight: 700, fontSize: "0.88rem",
    padding: "12px 16px", textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap", background: "transparent", fontFamily: "Inter,sans-serif"
  };
  const td: React.CSSProperties = {
    padding: "11px 16px", verticalAlign: "middle",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontFamily: "Inter,sans-serif", fontSize: "0.88rem"
  };

  return (
    <div style={{ fontFamily: "Inter,sans-serif", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...th, minWidth: 260 }}>Trader</th>
            <th style={{ ...th, minWidth: 240 }}>Market</th>
            <th style={{ ...th, textAlign: "center" }}>Side</th>
            <th style={th}>Price</th>
            <th style={th}>Amount</th>
            <th style={{ ...th, textAlign: "right", paddingRight: 20 }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} style={{ background: "rgba(255,255,255,0.015)" }}>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="skeleton-pulse" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="skeleton-pulse" style={{ width: "80px", height: "14px" }} />
                    <span className="skeleton-pulse" style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                  </div>
                </div>
              </td>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="skeleton-pulse" style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0 }} />
                  <span className="skeleton-pulse" style={{ width: "180px", height: "14px" }} />
                </div>
              </td>
              <td style={{ ...td, textAlign: "center" }}>
                <span className="skeleton-pulse" style={{ width: "20px", height: "14px" }} />
              </td>
              <td style={td}>
                <span className="skeleton-pulse" style={{ width: "35px", height: "14px" }} />
              </td>
              <td style={td}>
                <span className="skeleton-pulse" style={{ width: "50px", height: "14px" }} />
              </td>
              <td style={{ ...td, textAlign: "right", paddingRight: 20 }}>
                <span className="skeleton-pulse" style={{ width: "60px", height: "14px" }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RecentTradesTable({ items, limit = 20 }: { items: RecentTrade[]; limit?: number }) {
  const [minSize, setMinSize] = useState("0");
  const [greaterThan95, setGreaterThan95] = useState(false);
  const [sportsOnly, setSportsOnly] = useState(false);
  const [scoreFloor, setScoreFloor] = useState("Any");
  const [sharpeFloor, setSharpeFloor] = useState("Any");
  const [metric, setMetric] = useState<"score" | "sharpe">("sharpe");
  const [visibleCount, setVisibleCount] = useState(limit);

  const filtered = useMemo(() => items.filter((trade) => {
    if (trade.sizeUsd < Number(minSize)) return false;
    if (greaterThan95 && trade.price < 95) return false;
    if (sportsOnly && trade.category !== "Sports") return false;
    const trader = getTraderProfile(trade.traderSlug);
    if (scoreFloor !== "Any" && trader && trader.smartScore < Number(scoreFloor)) return false;
    if (sharpeFloor !== "Any" && trader && trader.sharpe < Number(sharpeFloor)) return false;
    return true;
  }), [items, minSize, greaterThan95, sportsOnly, scoreFloor, sharpeFloor]);

  const visible = filtered.slice(0, visibleCount);

  // Styles matching the image exactly
  const chipActive: React.CSSProperties = {
    background: "#ffffff", color: "#000000",
    border: "1px solid #ffffff", borderRadius: "4px",
    padding: "4px 12px", fontSize: "0.83rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "Inter,sans-serif"
  };
  const chipIdle: React.CSSProperties = {
    background: "transparent", color: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px",
    padding: "4px 12px", fontSize: "0.83rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "Inter,sans-serif", transition: "all 120ms"
  };
  const dropStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px",
    padding: "4px 28px 4px 10px", fontSize: "0.83rem", fontWeight: 500,
    cursor: "pointer", appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 7px center",
    fontFamily: "Inter,sans-serif"
  };
  const pillActive: React.CSSProperties = {
    background: "#ffffff", color: "#000000", border: "none",
    borderRadius: "4px", padding: "2px 8px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer"
  };
  const pillIdle: React.CSSProperties = {
    background: "transparent", color: "rgba(255,255,255,0.4)", border: "none",
    borderRadius: "4px", padding: "2px 8px", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer"
  };

  const th: React.CSSProperties = {
    color: "#ffffff", fontWeight: 700, fontSize: "0.88rem",
    padding: "12px 16px", textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap", background: "transparent", fontFamily: "Inter,sans-serif"
  };
  const td: React.CSSProperties = {
    padding: "11px 16px", verticalAlign: "middle",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontFamily: "Inter,sans-serif", fontSize: "0.88rem"
  };

  return (
    <div style={{ fontFamily: "Inter,sans-serif" }}>
      {/* Filter bar — flat, matches image */}
      <div style={{
        display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap",
        marginBottom: "20px", padding: "10px 0"
      }}>
        {SIZE_OPTS.map(opt => (
          <button key={opt.value} onClick={() => setMinSize(opt.value)}
            style={minSize === opt.value ? chipActive : chipIdle}>
            {opt.label}
          </button>
        ))}
        {/* Divider */}
        <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.12)", margin: "0 4px", display: "inline-block" }} />
        <button onClick={() => setGreaterThan95(!greaterThan95)} style={greaterThan95 ? chipActive : chipIdle}>&gt;95%</button>
        <button onClick={() => setSportsOnly(!sportsOnly)} style={sportsOnly ? chipActive : chipIdle}>Sports</button>
        {/* Divider */}
        <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.12)", margin: "0 4px", display: "inline-block" }} />
        <select value={scoreFloor} onChange={e => setScoreFloor(e.target.value)} style={dropStyle}>
          <option value="Any" style={{ background: "#111", color: "#fff" }}>Score ▾</option>
          {SCORE_OPTS.map(v => <option key={v} value={v} style={{ background: "#111", color: "#fff" }}>{v}+</option>)}
        </select>
        <select value={sharpeFloor} onChange={e => setSharpeFloor(e.target.value)} style={dropStyle}>
          <option value="Any" style={{ background: "#111", color: "#fff" }}>Sharpe ▾</option>
          {SHARPE_OPTS.map(v => <option key={v} value={v} style={{ background: "#111", color: "#fff" }}>{v}+</option>)}
        </select>
      </div>

      {/* Table — no outer card border, just rows */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {/* Trader header with Score/Sharpe toggle */}
              <th style={{ ...th, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Trader</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>·</span>
                  <div style={{ display: "inline-flex", gap: 2 }}>
                    <button onClick={() => setMetric("score")} style={metric === "score" ? pillActive : pillIdle}>Score</button>
                    <button onClick={() => setMetric("sharpe")} style={metric === "sharpe" ? pillActive : pillIdle}>Sharpe</button>
                  </div>
                </div>
              </th>
              <th style={{ ...th, minWidth: 240 }}>Market</th>
              <th style={{ ...th, textAlign: "center" }}>Side</th>
              <th style={th}>Price</th>
              <th style={th}>Amount</th>
              <th style={{ ...th, textAlign: "right", paddingRight: 20 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((trade, idx) => {
              const trader = getTraderProfile(trade.traderSlug);
              const avatar = trade.avatarUrl || trader?.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(trade.traderSlug.trim())}`;
              const displayVal = metric === "sharpe"
                ? (trader?.sharpe ?? trade.traderSharpe ?? trade.traderScore)
                : (trader?.smartScore ?? (trade.traderScore == null ? undefined : trade.traderScore * 20 + 50));
              const displayFmt = displayVal == null ? "—" : metric === "sharpe" ? displayVal.toFixed(2) : displayVal.toFixed(1);
              const isProfitable = displayVal == null ? null : displayVal >= 0;
              const scoreColor = isProfitable == null ? "var(--muted)" : isProfitable ? "#3ecf73" : "#ff5c5c";
              const rowBg = isProfitable == null ? "transparent" : isProfitable ? "rgba(30,80,50,0.35)" : "rgba(80,25,25,0.3)";
              const rowBgHover = isProfitable == null ? "rgba(255,255,255,0.04)" : isProfitable ? "rgba(30,80,50,0.5)" : "rgba(80,25,25,0.45)";

              return (
                <tr
                  key={`${trade.id}-${idx}`}
                  style={{ background: rowBg, cursor: "default" }}
                  onMouseOver={e => (e.currentTarget.style.background = rowBgHover)}
                  onMouseOut={e => (e.currentTarget.style.background = rowBg)}
                >
                  {/* Trader cell */}
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Avatar */}
                      {trade.traderSlug === "unknown" ? <span style={{ flexShrink: 0 }}>
                        <Image
                          src={avatar} alt={trade.traderName}
                          width={32} height={32} unoptimized
                          style={{ borderRadius: "50%", width: 32, height: 32, display: "block" }}
                        />
                      </span> : <Link href={`/account/${trade.traderSlug}`} style={{ flexShrink: 0 }}>
                        <Image
                          src={avatar} alt={trade.traderName}
                          width={32} height={32} unoptimized
                          style={{ borderRadius: "50%", width: 32, height: 32, display: "block" }}
                        />
                      </Link>}
                      {/* Name + PM badge + score */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
                        {trade.traderSlug === "unknown" ? <span style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap" }}>{trade.traderName}</span> : <Link href={`/account/${trade.traderSlug}`}
                          style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", whiteSpace: "nowrap" }}
                          onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}>
                          {trade.traderName}
                        </Link>}
                        <PlatformLogoBadge platform={trade.platform} />
                        <span style={{ color: scoreColor, fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                          {displayFmt}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Market cell */}
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <MarketEmoji title={trade.marketTitle} category={trade.category} />
                      <span style={{
                        color: "rgba(255,255,255,0.9)", fontWeight: 400, fontSize: "0.88rem",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280
                      }} title={trade.marketTitle}>
                        {trade.marketTitle.length > 36 ? trade.marketTitle.slice(0, 36) + "…" : trade.marketTitle}
                      </span>
                    </div>
                  </td>

                  {/* Side */}
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, fontSize: "0.88rem" }}>
                      {trade.side === "YES" ? "Y" : "N"}
                    </span>
                  </td>

                  {/* Price */}
                  <td style={{ ...td, color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
                    {trade.price % 1 === 0 ? `${trade.price}¢` : `${trade.price.toFixed(1)}¢`}
                  </td>

                  {/* Amount */}
                  <td style={{ ...td, color: "#ffffff", fontWeight: 600 }}>
                    {formatAmount(trade.sizeUsd)}
                  </td>

                  {/* Time */}
                  <td style={{ ...td, textAlign: "right", paddingRight: 20, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                    {trade.timestamp}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                  No trades match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
          <button onClick={() => setVisibleCount(p => p + 10)}
            style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.45)", fontSize: "0.88rem",
              fontWeight: 600, cursor: "pointer", padding: "8px 28px",
              fontFamily: "Inter,sans-serif", transition: "color 120ms"
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#fff")}
            onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
            Load more ↓
          </button>
        </div>
      )}
    </div>
  );
}

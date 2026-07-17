"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { PositionsList } from "@/components/positions-list";
import { PositionMarket } from "@/lib/types";

const scoreOptions = [
  { label: "Any", value: "Any" },
  { label: "60+", value: "60+" },
  { label: "70+", value: "70+" }
];
const sharpeOptions = [
  { label: "Any", value: "Any" },
  { label: "1.0+", value: "1.0+" },
  { label: "1.5+", value: "1.5+" },
  { label: "2.0+", value: "2.0+" }
];
const endsOptions = [
  { label: "Any", value: "Any" },
  { label: "<30d", value: "<30d" },
  { label: "<90d", value: "<90d" }
];
const minOptions = [
  { label: "Any", value: "Any" },
  { label: "$250k+", value: "$250k+" },
  { label: "$400k+", value: "$400k+" }
];

function PositionsListSkeleton() {
  return (
    <div className="positions-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <section key={i} className="panel position-card" style={{
          padding: "16px",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          background: "var(--panel)"
        }}>
          {/* Card Header Info skeleton */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "70%" }}>
              <span className="skeleton-pulse" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                <span className="skeleton-pulse" style={{ width: "100%", height: "14px" }} />
                <span className="skeleton-pulse" style={{ width: "40px", height: "12px" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
              <span className="skeleton-pulse" style={{ width: "70px", height: "14px" }} />
              <span className="skeleton-pulse" style={{ width: "100px", height: "12px" }} />
            </div>
          </div>
          <span className="skeleton-pulse" style={{ width: "60px", height: "12px", marginBottom: "8px" }} />
          {/* Table skeleton */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {Array.from({ length: 3 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ padding: "8px 8px 8px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="skeleton-pulse" style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
                        <span className="skeleton-pulse" style={{ width: "70px", height: "12px" }} />
                      </div>
                    </td>
                    <td style={{ padding: "8px 8px" }}><span className="skeleton-pulse" style={{ width: "15px", height: "12px" }} /></td>
                    <td style={{ padding: "8px 8px" }}><span className="skeleton-pulse" style={{ width: "20px", height: "12px" }} /></td>
                    <td style={{ padding: "8px 8px" }}><span className="skeleton-pulse" style={{ width: "25px", height: "12px" }} /></td>
                    <td style={{ padding: "8px 8px" }}><span className="skeleton-pulse" style={{ width: "50px", height: "12px" }} /></td>
                    <td style={{ padding: "8px 8px" }}><span className="skeleton-pulse" style={{ width: "35px", height: "12px" }} /></td>
                    <td style={{ padding: "8px 8px 4px 0", textAlign: "right" }}><span className="skeleton-pulse" style={{ width: "60px", height: "12px" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

export default function PositionsPage() {
  const [side, setSide] = useState<"ALL" | "YES" | "NO">("ALL");
  const platform = "ALL" as const;
  const [hide95, setHide95] = useState(false);
  const [scoreFloor, setScoreFloor] = useState<string>("Any");
  const [sharpeFloor, setSharpeFloor] = useState<string>("Any");
  const [endsFloor, setEndsFloor] = useState<string>("Any");
  const [minExposure, setMinExposure] = useState<string>("Any");



  const [allPositions, setAllPositions] = useState<PositionMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live positions from API whenever side/platform changes
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/v1/positions?side=${side}&platform=${platform}`)
      .then((r) => r.json())
      .then((data) => {
        const items: PositionMarket[] = data?.items ?? [];
        setAllPositions(items);
      })
      .catch((err) => console.error("[Positions] fetch error:", err))
      .finally(() => setIsLoading(false));
  }, [side, platform]);

  const filtered = useMemo(() => {
    return allPositions.filter((market) => {
      if (hide95 && market.smartMoneyShare >= 95) return false;

      if (scoreFloor !== "Any") {
        const floor = scoreFloor === "60+" ? 60 : 70;
        if (!market.traders.some((trader) => trader.score >= floor)) return false;
      }

      if (minExposure !== "Any") {
        const floor = minExposure === "$250k+" ? 250000 : 400000;
        if (market.marketValueUsd < floor) return false;
      }

      return true;
    });
  }, [allPositions, hide95, scoreFloor, minExposure]);

  const totalMarkets = filtered.length;
  const totalPositions = filtered.reduce((acc, item) => acc + item.traders.length, 0);



  const labelPrefixStyle: React.CSSProperties = {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    fontFamily: "Inter, var(--font-sans), sans-serif"
  };

  return (
    <main className="page-shell">
      <SiteHeader active="positions" />
      <section className="panel page-panel" style={{ marginBottom: "24px" }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Top Positions</h1>
            <p className="muted" style={{ marginTop: 10, maxWidth: 680, fontSize: "0.95rem" }}>$1k+ positions from top prediction traders</p>
          </div>


        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", marginBottom: 18, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={labelPrefixStyle}>Side:</span>
            {[
              { label: "All", value: "ALL", active: side === "ALL", onClick: () => setSide("ALL") },
              { label: "Yes", value: "YES", active: side === "YES", onClick: () => setSide("YES") },
              { label: "No", value: "NO", active: side === "NO", onClick: () => setSide("NO") }
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onClick}
                style={{
                  background: chip.active ? "var(--text)" : "transparent",
                  color: chip.active ? "var(--bg)" : "var(--text)",
                  border: chip.active ? "none" : "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 120ms ease"
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontFamily: "Inter, var(--font-sans), sans-serif", fontWeight: 500 }}>
            {isLoading ? "—" : totalMarkets} markets · {isLoading ? "—" : totalPositions} positions
          </span>
        </div>

        {/* Boxed secondary filter row */}
        <div className="compact-filter-bar" style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "8px 12px",
          flexWrap: "wrap",
          width: "100%"
        }}>
          <button
            type="button"
            onClick={() => setHide95((val) => !val)}
            style={{
              background: hide95 ? "var(--text)" : "transparent",
              color: hide95 ? "var(--bg)" : "var(--text)",
              border: hide95 ? "none" : "1px solid var(--border)",
              borderRadius: "4px",
              padding: "5px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 120ms ease"
            }}
          >
            Hide 95%+
          </button>

          {[
            { label: "Score:", value: scoreFloor, onChange: setScoreFloor, options: scoreOptions },
            { label: "Sharpe:", value: sharpeFloor, onChange: setSharpeFloor, options: sharpeOptions },
            { label: "Ends:", value: endsFloor, onChange: setEndsFloor, options: endsOptions },
            { label: "Min:", value: minExposure, onChange: setMinExposure, options: minOptions }
          ].map((group) => (
            <div key={group.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={labelPrefixStyle}>{group.label}</span>
              <div style={{ position: "relative" }}>
                <select
                  value={group.value}
                  onChange={(e) => group.onChange(e.target.value)}
                  style={{
                    appearance: "none",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    color: "var(--text)",
                    padding: "5px 24px 5px 10px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    backgroundSize: "10px"
                  }}
                >
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "var(--panel)", color: "var(--text)" }}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? (
        <PositionsListSkeleton />
      ) : (
        <PositionsList items={filtered} scoreFloor={scoreFloor} sharpeFloor={sharpeFloor} />
      )}
    </main>
  );
}

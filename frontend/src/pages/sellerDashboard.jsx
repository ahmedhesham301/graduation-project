import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import "./sellerDashboard.css";

const CITY_COLORS = [
  "#1a8cca","#0fc4ff","#0d6090","#22c55e","#f59e0b",
  "#8b5cf6","#ef4444","#ec4899","#14b8a6","#f97316",
];

const TYPE_ICONS = {
  apartment: "🏢", villa: "🏡", duplex: "🏘️", studio: "🛋️",
  office: "🏢", shop: "🏪", "town house": "🏠", chalet: "🏖️",
};

const STATUS_STYLE = {
  listed: { label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  draft:  { label: "Draft",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  sold:   { label: "Sold",   color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
};

export default function SellerDashboard({ onNavigate }) {
  const [analytics,    setAnalytics]    = useState(null);
  const [performance,  setPerformance]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [analyticsRes, performanceRes] = await Promise.all([
          api.get("/seller/analytics"),
          api.get("/analytics/seller-performance"),
        ]);
        setAnalytics(analyticsRes.data);
        setPerformance(performanceRes.data);
      } catch (err) {
        setError("Failed to load your dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const maxCityCount = performance ? Math.max(...performance.by_city.map(c => c.listings)) : 1;

  return (
    <div className="sd-wrap">

      {/* ── HEADER ── */}
      <div className="sd-header">
        <div>
          <span className="sd-eyebrow">Seller Portal</span>
          <h2 className="sd-title">Your Dashboard</h2>
          <p className="sd-subtitle">Live overview of your listings and performance</p>
        </div>
      </div>

      {loading && (
        <div className="sd-loading">
          <div className="sd-spinner" />
          <span>Loading your dashboard…</span>
        </div>
      )}

      {error && <div className="sd-error">{error}</div>}

      {!loading && !error && analytics && performance && (
        <>
          {/* ── SUMMARY CARDS — all 9 stats merged ── */}
          <div className="sd-summary-grid">

            <div className="sd-stat-card sd-stat--blue">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="sd-stat-num">{Number(performance.summary.total_listings).toLocaleString()}</span>
              <span className="sd-stat-label">Total Listings</span>
            </div>

            <div className="sd-stat-card sd-stat--green">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <span className="sd-stat-num">{Number(performance.summary.active_listings).toLocaleString()}</span>
              <span className="sd-stat-label">Active Listings</span>
            </div>

            <div className="sd-stat-card sd-stat--amber">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <span className="sd-stat-num">{Number(performance.summary.draft_listings).toLocaleString()}</span>
              <span className="sd-stat-label">Drafts</span>
            </div>

            <div className="sd-stat-card sd-stat--pink">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <span className="sd-stat-num">{Number(performance.summary.total_saves).toLocaleString()}</span>
              <span className="sd-stat-label">Total Saves</span>
            </div>

            <div className="sd-stat-card sd-stat--teal">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <span className="sd-stat-num">EGP {(analytics.summary.avg_price / 1_000_000).toFixed(2)}M</span>
              <span className="sd-stat-label">Avg. Price</span>
            </div>

            <div className="sd-stat-card sd-stat--purple">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <span className="sd-stat-num">{Number(performance.summary.sold_listings).toLocaleString()}</span>
              <span className="sd-stat-label">Sold</span>
            </div>

            <div className="sd-stat-card sd-stat--blue">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <span className="sd-stat-num">{analytics.summary.avg_area} m²</span>
              <span className="sd-stat-label">Avg. Area</span>
            </div>

            <div className="sd-stat-card sd-stat--green">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <span className="sd-stat-num">{Number(performance.summary.average_active_listing_age_days).toFixed(1)}d</span>
              <span className="sd-stat-label">Avg. Listing Age</span>
            </div>

            <div className="sd-stat-card sd-stat--amber">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <span className="sd-stat-num">EGP {(analytics.summary.min_price / 1_000_000).toFixed(2)}M</span>
              <span className="sd-stat-label">Lowest Price</span>
            </div>

            <div className="sd-stat-card sd-stat--purple">
              <div className="sd-stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <span className="sd-stat-num">EGP {(analytics.summary.max_price / 1_000_000).toFixed(2)}M</span>
              <span className="sd-stat-label">Highest Price</span>
            </div>

          </div>

          {/* ── MOST SAVED SPOTLIGHT ── */}
          {analytics.most_saved && (
            <div className="sd-spotlight">
              <div className="sd-spotlight-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff4d6d" stroke="#ff4d6d" strokeWidth="1">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Most Saved Property
              </div>
              <div className="sd-spotlight-body">
                <div>
                  <div className="sd-spotlight-name">
                    {analytics.most_saved.type.charAt(0).toUpperCase() + analytics.most_saved.type.slice(1)} · {analytics.most_saved.city}
                  </div>
                  <div className="sd-spotlight-price">EGP {Number(analytics.most_saved.price).toLocaleString()}</div>
                </div>
                <div className="sd-spotlight-right">
                  <div className="sd-spotlight-saves-num">{analytics.most_saved.saves}</div>
                  <div className="sd-spotlight-saves-label">saves</div>
                  {onNavigate && (
                    <button
                      className="sd-spotlight-btn"
                      onClick={() => onNavigate("propertyDetails", { id: analytics.most_saved.id, propertyId: analytics.most_saved.id, fromPage: "profile", isSeller: true })}
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MY TOP PROPERTIES ── */}
          {performance.top_properties?.length > 0 && (
            <div className="sd-listings-section">
              <div className="sd-section-header">
                <h3 className="sd-chart-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  My Top Properties
                </h3>
                <span className="sd-section-sub">Sorted by saves · click any card to view details</span>
              </div>
              <div className="sd-prop-grid">
                {performance.top_properties.map((prop, i) => {
                  const status = STATUS_STYLE[prop.listing_status] || STATUS_STYLE.listed;
                  return (
                    <div
                      key={prop.id}
                      className="sd-prop-card"
                      style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => onNavigate && onNavigate("propertyDetails", { id: prop.id, propertyId: prop.id, fromPage: "profile", isSeller: true })}
                    >
                      <div className="sd-prop-accent" style={{ background: CITY_COLORS[i % CITY_COLORS.length] }} />
                      <div className="sd-prop-body">
                        <div className="sd-prop-top-row">
                          <span className="sd-prop-type-badge">
                            {TYPE_ICONS[prop.type] || "🏠"} {prop.type.charAt(0).toUpperCase() + prop.type.slice(1)}
                          </span>
                          <span className="sd-prop-status" style={{ color: status.color, background: status.bg }}>
                            {status.label}
                          </span>
                        </div>
                        <div className="sd-prop-location">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {prop.district}, {prop.city}
                        </div>
                        <div className="sd-prop-price">EGP {Number(prop.price).toLocaleString()}</div>
                        <div className="sd-prop-footer">
                          <span className="sd-prop-saves">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={prop.saves > 0 ? "#ff4d6d" : "none"} stroke="#ff4d6d" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            {prop.saves} {prop.saves === 1 ? "save" : "saves"}
                          </span>
                          <span className="sd-prop-age">{prop.listing_age_days.toFixed(1)}d old</span>
                        </div>
                      </div>
                      <div className="sd-prop-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CHARTS ROW ── */}
          <div className="sd-charts-row">

            {/* By City */}
            <div className="sd-chart-card">
              <h3 className="sd-chart-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Listings by City
              </h3>
              <div className="sd-bar-list">
                {performance.by_city.slice(0, 12).map((item, i) => (
                  <div className="sd-bar-row" key={item.city}>
                    <span className="sd-bar-label">{item.city}</span>
                    <div className="sd-bar-track">
                      <div
                        className="sd-bar-fill"
                        style={{
                          width: `${(item.listings / maxCityCount) * 100}%`,
                          background: CITY_COLORS[i % CITY_COLORS.length],
                          animationDelay: `${i * 40}ms`,
                        }}
                      />
                    </div>
                    <div className="sd-bar-count-wrap">
                      <span className="sd-bar-count">{item.listings}</span>
                      {item.saves > 0 && (
                        <span className="sd-bar-saves">♥ {item.saves}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Type */}
            <div className="sd-chart-card">
              <h3 className="sd-chart-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="9"/><rect x="3" y="14" width="7" height="9"/>
                </svg>
                Listings by Type
              </h3>
              <div className="sd-type-list">
                {performance.by_type.map((item, i) => {
                  const pct = Math.round((item.listings / performance.summary.total_listings) * 100);
                  return (
                    <div className="sd-type-row" key={item.type}>
                      <span className="sd-type-icon">{TYPE_ICONS[item.type] || "🏠"}</span>
                      <span className="sd-type-label">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                      <div className="sd-bar-track">
                        <div
                          className="sd-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: CITY_COLORS[i % CITY_COLORS.length],
                            animationDelay: `${i * 40}ms`,
                          }}
                        />
                      </div>
                      <div className="sd-bar-count-wrap">
                        <span className="sd-bar-count">{item.listings}</span>
                        {item.saves > 0 && (
                          <span className="sd-bar-saves">♥ {item.saves}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import { api } from "../components/Axios";
import { BUCKET_url } from "../components/vars";
import "./SearchResults.css";

const SORT_OPTIONS  = ["New", "Price ascending", "Price descending"];
const PROP_TYPES    = ["Apartment", "Villa", "Duplex", "Townhouse", "Studio", "Chalet", "Office", "Shop"];
const CONDITIONS    = ["finished", "unfinished", "off-plan"];
const BED_OPTIONS   = [1, 2, 3, 4, 5];

function formatPrice(n) {
  if (n >= 1000000) return `EGP ${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  return `EGP ${Number(n).toLocaleString()}`;
}

export default function SearchResults({
  onNavigate, theme, toggleTheme, isLoggedIn,
  initialFilters = {},  // { city, district, propType, bedrooms, bathrooms, floor, results, params }
}) {
  /* ── Track whether we've already consumed the initial seeded results ── */
  const didSkipInitialFetch = useRef(false);

  /* ── Filter state (seeded from HomePage search) ── */
  const [city,       setCity]       = useState(initialFilters.city      || "");
  const [district,   setDistrict]   = useState(initialFilters.district  || "");
  const [selTypes,   setSelTypes]   = useState(
    initialFilters.propType ? [initialFilters.propType] : []
  );
  const [conditions, setConditions] = useState([...CONDITIONS]);
  const [selBeds,    setSelBeds]    = useState(
    initialFilters.bedrooms ? [Number(initialFilters.bedrooms)] : []
  );
  const [selBaths,   setSelBaths]   = useState(
    initialFilters.bathrooms ? [Number(initialFilters.bathrooms)] : []
  );
  const [maxPrice,   setMaxPrice]   = useState(50_000_000);
  const [sortBy,     setSortBy]     = useState("New");

  /* ── UI state ── */
  const [typeOpen,      setTypeOpen]      = useState(true);
  const [showMoreBeds,  setShowMoreBeds]  = useState(false);
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [favs,          setFavs]          = useState([]);

  /* ── API state ── */
  const [results,  setResults]  = useState(initialFilters.results || []);
  const [loading,  setLoading]  = useState(!initialFilters.results);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);

  /* ── Build query params from current sidebar state ── */
  const buildParams = useCallback((pageNum = 1) => {
    const p = { page: pageNum };
    if (city)            p.city      = city;
    if (district)        p.district  = district;
    if (selTypes.length  === 1) p.type = selTypes[0];    // API takes a single type string
    if (selBeds.length   === 1) p.bedrooms  = selBeds[0];
    if (selBaths.length  === 1) p.bathrooms = selBaths[0];

    // Map sort to API params
    if (sortBy === "Price ascending")  { p.orderBy = "price"; p.orderDirection = "asc";  }
    if (sortBy === "Price descending") { p.orderBy = "price"; p.orderDirection = "desc"; }

    return p;
  }, [city, district, selTypes, selBeds, selBaths, sortBy]);

  /* ── Fetch whenever filters change ── */
  useEffect(() => {
    // Skip only the very first fetch if the HomePage already sent results
    if (initialFilters.results && !didSkipInitialFetch.current) {
      didSkipInitialFetch.current = true;
      setResults(initialFilters.results);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/search", { params: buildParams(1) });
        setResults(res.data);
        setPage(1);
        setHasMore(res.data.length > 0);
      } catch (err) {
        console.error(err);
        setError("Failed to load properties. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, district, selTypes, selBeds, selBaths, sortBy]);

  /* ── Load more (pagination) ── */
  const loadMore = async () => {
    const nextPage = page + 1;
    try {
      setLoading(true);
      const res = await api.get("/search", { params: buildParams(nextPage) });
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setResults(prev => [...prev, ...res.data]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load more properties.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Favourites ── */
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get("/favorites")
      .then(res => setFavs(res.data.map(item => item.property_id)))
      .catch(console.error);
  }, [isLoggedIn]);

  const toggleFav = async (id) => {
    if (!isLoggedIn) { onNavigate("signin"); return; }
    const isFav = favs.includes(id);
    setFavs(f => isFav ? f.filter(x => x !== id) : [...f, id]);
    try {
      if (!isFav) await api.post(`/favorites/${id}`);
      else        await api.delete(`/favorites/${id}`);
    } catch (err) {
      console.error(err);
      setFavs(f => isFav ? [...f, id] : f.filter(x => x !== id));
    }
  };

  /* ── Toggle helpers ── */
  const toggleType = (t) => setSelTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleCond = (c) => setConditions(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleBed  = (b) => setSelBeds(p  => p.includes(b)  ? p.filter(x => x !== b)  : [...p, b]);

  /* ── Active keyword tags ── */
  const activeTags = [
    ...(city     ? [city]     : []),
    ...(district ? [district] : []),
    ...selTypes,
  ];
  const removeTag = (tag) => {
    if (tag === city)     setCity("");
    if (tag === district) setDistrict("");
    setSelTypes(p => p.filter(t => t !== tag));
  };

  /* ── Client-side price filter (slider) applied on top of API results ── */
  const displayed = results.filter(p => Number(p.price) <= maxPrice);

  const visibleBeds = showMoreBeds ? BED_OPTIONS : BED_OPTIONS.slice(0, 3);

  const resetFilters = () => {
    setCity(""); setDistrict(""); setSelTypes([]);
    setConditions([...CONDITIONS]); setSelBeds([]); setSelBaths([]);
    setMaxPrice(50_000_000); setSortBy("New");
  };

  return (
    <div className="sr-page">
      <Navbar onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} isLoggedIn={isLoggedIn} hideThemeToggle={true} />

      {/* Mobile filter toggle */}
      <div className="sr-mobile-bar">
        <button className="sr-filter-toggle" onClick={() => setFilterOpen(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {filterOpen ? "Hide Filters" : "Show Filters"}
          {(selTypes.length + selBeds.length + (city ? 1 : 0)) > 0 && (
            <span className="sr-filter-badge">{selTypes.length + selBeds.length + (city ? 1 : 0)}</span>
          )}
        </button>

        {/* Sort (mobile) */}
        <select className="sr-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginLeft: "auto" }}>
          {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {filterOpen && <div className="sr-overlay" onClick={() => setFilterOpen(false)} />}

      <div className="sr-body">

        {/* ══════ LEFT SIDEBAR ══════ */}
        <aside className={`sr-sidebar ${filterOpen ? "sr-sidebar-open" : ""}`}>

          {/* Keywords / active tags */}
          <div className="sr-section">
            <div className="sr-section-title">Keywords</div>
            <div className="sr-tags">
              {activeTags.map(tag => (
                <span key={tag} className="sr-tag">
                  {tag}
                  <button className="sr-tag-x" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
              {activeTags.length === 0 && <span className="sr-no-tags">No filters applied</span>}
            </div>
          </div>

          {/* Property type */}
          <div className="sr-section">
            <div className="sr-section-label">Residential</div>
            <button className="sr-dropdown-btn" onClick={() => setTypeOpen(v => !v)}>
              <span>type</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: typeOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {typeOpen && (
              <div className="sr-dropdown-list">
                {PROP_TYPES.map(t => (
                  <label key={t} className="sr-check-item">
                    <span className={`sr-cb ${selTypes.includes(t) ? "on" : ""}`} onClick={() => toggleType(t)}>
                      {selTypes.includes(t) && (
                        <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>
                    <span className="sr-check-label">{t}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price slider (client-side) */}
          <div className="sr-section">
            <div className="sr-price-row">
              <span className="sr-section-label">Max Price</span>
              <span className="sr-price-val">EGP {(maxPrice / 1_000_000).toFixed(0)}M</span>
            </div>
            <input
              type="range" className="sr-slider"
              min={500_000} max={50_000_000} step={500_000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
            />
            <div className="sr-price-minmax"><span>EGP 0</span><span>EGP 50M</span></div>
          </div>

          {/* Condition (client-side filter) */}
          <div className="sr-section">
            <div className="sr-section-label">Condition</div>
            {CONDITIONS.map(c => (
              <label key={c} className="sr-check-item">
                <span className={`sr-cb ${conditions.includes(c) ? "on" : ""}`} onClick={() => toggleCond(c)}>
                  {conditions.includes(c) && (
                    <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </span>
                <span className="sr-check-label">{c}</span>
              </label>
            ))}
          </div>

          {/* Beds */}
          <div className="sr-section">
            <div className="sr-section-title sr-beds-title">Beds</div>
            {visibleBeds.map(b => (
              <label key={b} className="sr-check-item">
                <span className={`sr-cb ${selBeds.includes(b) ? "on" : ""}`} onClick={() => toggleBed(b)}>
                  {selBeds.includes(b) && (
                    <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </span>
                <span className="sr-check-label">{b}</span>
              </label>
            ))}
            <button className="sr-see-more" onClick={() => setShowMoreBeds(v => !v)}>
              {showMoreBeds ? "▲ see less" : "▼ see more"}
            </button>
          </div>

          {/* City */}
          <div className="sr-section">
            <div className="sr-section-label">City</div>
            <select className="sr-select" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All Cities</option>
              <option>Cairo</option><option>Giza</option><option>Alexandria</option>
              <option>New Cairo</option><option>Sheikh Zayed</option>
              <option>6th of October</option><option>New Capital</option>
              <option>North Coast</option><option>Red Sea</option>
            </select>
          </div>

          {/* District */}
          <div className="sr-section">
            <div className="sr-section-label">District</div>
            <select className="sr-select" value={district} onChange={e => setDistrict(e.target.value)}>
              <option value="">All Districts</option>
              <option>Maadi</option><option>Zamalek</option><option>Heliopolis</option>
              <option>Nasr City</option><option>Mohandiseen</option>
              <option>Madinaty</option><option>5th Settlement</option><option>Downtown</option>
            </select>
          </div>

        </aside>

        {/* ══════ RIGHT CONTENT ══════ */}
        <div className="sr-content">

          {/* Sort bar (desktop) */}
          <div className="sr-sort-bar">
            <span className="sr-result-count">
              {loading ? "Loading…" : `${displayed.length} propert${displayed.length === 1 ? "y" : "ies"} found`}
            </span>
            <select className="sr-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="sr-empty">
              <p style={{ color: "#ff4d6d" }}>{error}</p>
              <button className="sr-reset-btn" onClick={resetFilters}>Reset filters</button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && results.length === 0 && (
            <div className="sr-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="sr-card sr-card-skeleton" key={i}>
                  <div className="sr-card-img-wrap sr-skeleton-img" />
                  <div className="sr-card-body">
                    <div className="sr-skeleton-line" style={{ width: "80%" }} />
                    <div className="sr-skeleton-line" style={{ width: "50%", marginTop: 8 }} />
                    <div className="sr-skeleton-line" style={{ width: "65%", marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayed.length === 0 && (
            <div className="sr-empty">
              <svg width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No properties match your filters.</p>
              <button className="sr-reset-btn" onClick={resetFilters}>Reset filters</button>
            </div>
          )}

          {/* Results grid */}
          {displayed.length > 0 && (
            <>
              <div className="sr-grid">
                {displayed.map(p => (
                  <div className="sr-card" key={p.id}>
                    <div className="sr-card-img-wrap">
                      <div
                        className="sr-card-img"
                        style={{
                          backgroundImage: `url(${BUCKET_url}/media/${p.id}/${p.media})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                      <span className="sr-type-badge">{p.type}</span>
                      <button
                        className={`sr-fav-btn ${favs.includes(p.id) ? "active" : ""}`}
                        onClick={() => toggleFav(p.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24"
                          fill={favs.includes(p.id) ? "#e53935" : "none"}
                          stroke={favs.includes(p.id) ? "#e53935" : "#fff"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="sr-card-body">
                      <p className="sr-card-title">{p.type} in {p.district}</p>
                      <div className="sr-card-price">{formatPrice(p.price)}</div>
                      <div className="sr-card-location">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {p.city}{p.district ? `, ${p.district}` : ""}
                      </div>
                      <div className="sr-card-meta">
                        <span>{p.rooms ?? p.bedrooms ?? "–"} bd</span>
                        <span>· {p.bathrooms} ba</span>
                        <span>· {p.area} m²</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: "32px" }}>
                  <button
                    className="sr-reset-btn"
                    onClick={loadMore}
                    disabled={loading}
                    style={{ padding: "10px 32px", opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
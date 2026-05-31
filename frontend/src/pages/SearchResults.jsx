import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import { api } from "../components/Axios";
import { BUCKET_url } from "../components/vars";
import "./SearchResults.css";

const SORT_OPTIONS = ["New", "Price ascending", "Price descending"];
const DEBOUNCE_MS  = 500; // wait 500ms after last price keystroke before firing

function formatPrice(n) {
  if (n >= 1_000_000) return `EGP ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  return `EGP ${Number(n).toLocaleString()}`;
}

export default function SearchResults({
  onNavigate, theme, toggleTheme, isLoggedIn, currentUser,
  initialFilters = {},
}) {
  /* ── Property types from API ── */
  const [propTypes, setPropTypes] = useState([]);

  /* ── Cities & districts from API ── */
  const [cities,           setCities]           = useState([]);
  const [districts,        setDistricts]        = useState([]);
  const [citiesLoading,    setCitiesLoading]    = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  /* ── Filter state ── */
  const [city,     setCity]     = useState(initialFilters.city     || "");
  const [district, setDistrict] = useState(initialFilters.district || "");
  const [selType,      setSelType]      = useState(initialFilters.propType  || ""); // single string
  const [selCondition, setSelCondition] = useState(initialFilters.condition || ""); // single string
  /* beds: raw input string debounced */
  const [bedsInput, setBedsInput] = useState(
    initialFilters.bedrooms ? String(initialFilters.bedrooms) : ""
  );
  const [beds, setBeds] = useState(
    initialFilters.bedrooms ? String(initialFilters.bedrooms) : ""
  );
  const [selBaths, setSelBaths] = useState(
    initialFilters.bathrooms ? [Number(initialFilters.bathrooms)] : []
  );
  const [sortBy, setSortBy] = useState("New");

  /* ── Price: raw input strings → debounced committed values ── */
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [minPrice,      setMinPrice]      = useState(""); // committed → triggers fetch
  const [maxPrice,      setMaxPrice]      = useState(""); // committed → triggers fetch

  /* ── UI ── */
  const [typeOpen,      setTypeOpen]      = useState(true);
  const [conditionOpen, setConditionOpen] = useState(true);
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [favs,         setFavs]         = useState([]);

  /* ── API state ── */
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ── Build params — all filters go to the API ── */
  const buildParams = useCallback((pageNum = 1) => {
    const p = { page: pageNum };
    if (city)     p.city     = city;
    if (district) p.district = district;
    if (selType)      p.type      = selType;
    if (selCondition) p.condition = selCondition;
    if (beds)                   p.bedrooms  = Number(beds);
    if (selBaths.length === 1) p.bathrooms = selBaths[0];
    if (minPrice) p.minPrice = Number(minPrice);
    if (maxPrice) p.maxPrice = Number(maxPrice);
    if (sortBy === "Price ascending")  { p.orderBy = "price"; p.orderDirection = "asc";  }
    if (sortBy === "Price descending") { p.orderBy = "price"; p.orderDirection = "desc"; }
    return p;
  }, [city, district, selType, selCondition, beds, selBaths, minPrice, maxPrice, sortBy]);

  /* ── Fetch property types on mount ── */
  useEffect(() => {
    api.get("/properties/types")
      .then(res => setPropTypes(res.data))
      .catch(err => console.error("Failed to load property types:", err));
  }, []);

  /* ── Fetch cities on mount ── */
  useEffect(() => {
    setCitiesLoading(true);
    api.get("/cities")
      .then(res => setCities(res.data))
      .catch(err => console.error("Failed to load cities:", err))
      .finally(() => setCitiesLoading(false));
  }, []);

  /* ── Fetch districts when city changes ── */
  // Track the city value at mount time so we never wipe a seeded district
  const initialCityRef = useRef(initialFilters.city || "");
  useEffect(() => {
    // Only reset district when city changes AFTER mount (user-driven change)
    if (city !== initialCityRef.current) {
      setDistrict("");
      initialCityRef.current = city; // update so next change also resets
    }
    setDistricts([]);
    if (!city) return;
    setDistrictsLoading(true);
    api.get(`/cities/${city}/districts`)
      .then(res => setDistricts(res.data))
      .catch(err => console.error("Failed to load districts:", err))
      .finally(() => setDistrictsLoading(false));
  }, [city]);

  /* ── Debounce price text inputs ── */
  useEffect(() => {
    const t = setTimeout(() => setMinPrice(minPriceInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [minPriceInput]);

  useEffect(() => {
    const t = setTimeout(() => setMaxPrice(maxPriceInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [maxPriceInput]);

  /* debounce beds input */
  useEffect(() => {
    const t = setTimeout(() => setBeds(bedsInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [bedsInput]);

  /* ── Re-fetch on every filter change ── */
  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/search", { params: buildParams(1) });
        if (!cancelled) {
          setResults(res.data);
          setPage(1);
          setHasMore(res.data.length > 0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          const status = err.response?.status;
          // Treat 404 / 400 as "no results", only show error for server faults
          if (status && status < 500) {
            setResults([]);
            setHasMore(false);
          } else {
            setError("Failed to load properties. Please try again.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doFetch();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, district, selType, selCondition, beds, selBaths, minPrice, maxPrice, sortBy]);

  /* ── Load more ── */
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
      .then(res => setFavs(res.data.map(i => i.property_id)))
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

  /* ── Active tags ── */
  const activeTags = [
    ...(city     ? [{ label: city,     clear: () => setCity("")     }] : []),
    ...(district ? [{ label: district, clear: () => setDistrict("") }] : []),
    ...(selType      ? [{ label: selType,      clear: () => setSelType("")      }] : []),
    ...(selCondition ? [{ label: selCondition, clear: () => setSelCondition("") }] : []),
    ...(beds ? [{ label: `${beds} bed${Number(beds) !== 1 ? 's' : ''}`, clear: () => { setBeds(""); setBedsInput(""); } }] : []),
    ...selBaths.map(b => ({ label: `${b} bath`, clear: () => setSelBaths(p => p.filter(x => x !== b)) })),
    ...(minPrice ? [{ label: `Min ${formatPrice(minPrice)}`, clear: () => { setMinPrice(""); setMinPriceInput(""); } }] : []),
    ...(maxPrice ? [{ label: `Max ${formatPrice(maxPrice)}`, clear: () => { setMaxPrice(""); setMaxPriceInput(""); } }] : []),
  ];

  const resetFilters = () => {
    // Reset initialCityRef BEFORE setting city so the city useEffect
    // sees city==initialCityRef.current and skips the district wipe
    // (district is already being cleared explicitly below)
    initialCityRef.current = "";
    setError(null);
    setCity("");
    setDistrict("");
    setSelType("");
    setSelCondition("");
    setBedsInput("");
    setBeds("");
    setSelBaths([]);
    setMinPriceInput("");
    setMaxPriceInput("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("New");
  };

  return (
    <div className="sr-page">
      <Navbar onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} isLoggedIn={isLoggedIn} currentUser={currentUser} hideThemeToggle={true} />

      {/* Mobile filter toggle */}
      <div className="sr-mobile-bar">
        <button className="sr-filter-toggle" onClick={() => setFilterOpen(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {filterOpen ? "Hide Filters" : "Show Filters"}
          {activeTags.length > 0 && (
            <span className="sr-filter-badge">{activeTags.length}</span>
          )}
        </button>
        <select className="sr-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginLeft: "auto" }}>
          {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {filterOpen && <div className="sr-overlay" onClick={() => setFilterOpen(false)} />}

      <div className="sr-body">

        {/* ══════ SIDEBAR ══════ */}
        <aside className={`sr-sidebar ${filterOpen ? "sr-sidebar-open" : ""}`}>

          {/* Active filter tags */}
          <div className="sr-section">
            <div className="sr-section-title">Active Filters</div>
            <div className="sr-tags">
              {activeTags.map(tag => (
                <span key={tag.label} className="sr-tag">
                  {tag.label}
                  <button className="sr-tag-x" onClick={tag.clear}>×</button>
                </span>
              ))}
              {activeTags.length === 0 && <span className="sr-no-tags">No filters applied</span>}
            </div>
            {activeTags.length > 0 && (
              <button className="sr-reset-link" onClick={resetFilters}>Clear all</button>
            )}
          </div>

          {/* ── Property Type — radio single select ── */}
          <div className="sr-section">
            <div className="sr-section-label">Property Type</div>
            <button className="sr-dropdown-btn" onClick={() => setTypeOpen(v => !v)}>
              <span>{selType || (propTypes.length === 0 ? "Loading…" : "All types")}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: typeOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {typeOpen && (
              <div className="sr-dropdown-list">
                {/* "Any" clears the type */}
                <label className="sr-check-item" onClick={() => setSelType("")}>
                  <span className={`sr-radio ${selType === "" ? "on" : ""}`}>
                    {selType === "" && <span className="sr-radio-dot" />}
                  </span>
                  <span className="sr-check-label">Any</span>
                </label>
                {propTypes.map(t => (
                  <label key={t} className="sr-check-item" onClick={() => setSelType(prev => prev === t ? "" : t)}>
                    <span className={`sr-radio ${selType === t ? "on" : ""}`}>
                      {selType === t && <span className="sr-radio-dot" />}
                    </span>
                    <span className="sr-check-label">{t}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Condition — radio single select ── */}
          <div className="sr-section">
            <div className="sr-section-label">Condition</div>
            <button className="sr-dropdown-btn" onClick={() => setConditionOpen(v => !v)}>
              <span>{selCondition || "Any condition"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: conditionOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {conditionOpen && (
              <div className="sr-dropdown-list">
                <label className="sr-check-item" onClick={() => setSelCondition("")}>
                  <span className={`sr-radio ${selCondition === "" ? "on" : ""}`}>
                    {selCondition === "" && <span className="sr-radio-dot" />}
                  </span>
                  <span className="sr-check-label">Any</span>
                </label>
                {["not finished", "semi finished", "fully finished", "luxury finished"].map(c => (
                  <label key={c} className="sr-check-item" onClick={() => setSelCondition(prev => prev === c ? "" : c)}>
                    <span className={`sr-radio ${selCondition === c ? "on" : ""}`}>
                      {selCondition === c && <span className="sr-radio-dot" />}
                    </span>
                    <span className="sr-check-label">{c}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Price — min / max number inputs ── */}
          <div className="sr-section">
            <div className="sr-section-label">Price (EGP)</div>
            <div className="sr-price-inputs">
              <div className="sr-price-input-wrap">
                <label className="sr-price-input-label">Min</label>
                <input
                  type="number"
                  className="sr-price-input"
                  placeholder="0"
                  min={0}
                  value={minPriceInput}
                  onChange={e => setMinPriceInput(e.target.value)}
                />
              </div>
              <span className="sr-price-dash">—</span>
              <div className="sr-price-input-wrap">
                <label className="sr-price-input-label">Max</label>
                <input
                  type="number"
                  className="sr-price-input"
                  placeholder="Any"
                  min={0}
                  value={maxPriceInput}
                  onChange={e => setMaxPriceInput(e.target.value)}
                />
              </div>
            </div>
            {(minPrice || maxPrice) && (
              <p className="sr-price-preview">
                {minPrice ? formatPrice(minPrice) : "EGP 0"} → {maxPrice ? formatPrice(maxPrice) : "no limit"}
              </p>
            )}
          </div>

          {/* ── Beds ── */}
          <div className="sr-section">
            <div className="sr-section-label">Bedrooms</div>
            <input
              type="number"
              className="sr-price-input"
              placeholder="Any"
              min={1}
              max={20}
              value={bedsInput}
              onChange={e => setBedsInput(e.target.value)}
            />
          </div>

          {/* ── City ── */}
          <div className="sr-section">
            <div className="sr-section-label">City</div>
            <select className="sr-select" value={city} onChange={e => setCity(e.target.value)} disabled={citiesLoading}>
              <option value="">{citiesLoading ? "Loading…" : "All Cities"}</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* ── District ── */}
          <div className="sr-section">
            <div className="sr-section-label">District</div>
            <select className="sr-select" value={district} onChange={e => setDistrict(e.target.value)} disabled={!city || districtsLoading}>
              <option value="">
                {!city ? "Select a city first" : districtsLoading ? "Loading…" : "All Districts"}
              </option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

        </aside>

        {/* ══════ CONTENT ══════ */}
        <div className="sr-content">

          {/* Sort + count bar */}
          <div className="sr-sort-bar">
            <span className="sr-result-count">
              {loading
                ? <span className="sr-loading-pulse">Searching…</span>
                : `${results.length} propert${results.length === 1 ? "y" : "ies"} found`}
            </span>
            <select className="sr-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Subtle re-fetch bar when results already exist */}
          {loading && results.length > 0 && (
            <div className="sr-refetch-bar">
              <span className="sr-spinner" /> Updating results…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="sr-empty">
              <p style={{ color: "#ff4d6d" }}>{error}</p>
              <button className="sr-reset-btn" onClick={resetFilters}>Reset filters</button>
            </div>
          )}

          {/* Loading skeleton — first load only */}
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
          {!loading && !error && results.length === 0 && (
            <div className="sr-empty">
              <svg width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No properties match your filters.</p>
              <button className="sr-reset-btn" onClick={resetFilters}>Reset filters</button>
            </div>
          )}

          {/* Results grid */}
          {results.length > 0 && (
            <>
              <div className={`sr-grid ${loading ? "sr-grid-dim" : ""}`}>
                {results.map(p => (
                  <div className="sr-card" key={p.id} onClick={() =>onNavigate("propertyDetails", { propertyId: p.id,fromPage: "search",})}>
                    <div className="sr-card-img-wrap">
                      <div
                        className="sr-card-img"
                        style={{
                          backgroundImage: `url(${BUCKET_url}/media/${p.id}/${p.media})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          width: "100%", height: "100%",
                        }}
                      />
                      <span className="sr-type-badge">{p.type}</span>
                      {p.sold_at && (
                        <span className="sr-sold-badge">SOLD</span>
                      )}
                      <button className={`sr-fav-btn ${favs.includes(p.id) ? "active" : ""}`}
                        onClick={(e) => {e.stopPropagation(); toggleFav(p.id);}}>
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
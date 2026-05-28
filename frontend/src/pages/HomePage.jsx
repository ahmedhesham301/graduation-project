import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { api } from "../components/Axios";
import { BUCKET_url } from "../components/vars";
import "./HomePage.css";

const COLORS = ["#1a3a4a","#1a2a1a","#2a1a1a","#1a1a3a","#2a2a1a","#1a2a2a","#2a1a2a","#1a3a3a"];

const POPULAR = {
  sale: [
    { title:"Apartments",  links:["Apartments for sale in Egypt","Apartments for sale in Cairo","Apartments for sale in Alexandria","Apartments for sale in 6th of October","Apartments for sale in Nasr City"] },
    { title:"Villas",      links:["Villas for sale in Egypt","Villas for sale in Cairo","Villas for sale in Alexandria","Villas for sale in 6th of October","Villas for sale in Matruh"] },
    { title:"Chalets",     links:["Chalets for sale in Egypt","Chalets for sale in Matruh","Chalets for sale in North Coast","Chalets for sale in Ain Sukhna","Chalets for sale in Suez"] },
    { title:"Duplexes",    links:["Duplexes for sale in Egypt","Duplexes for sale in Cairo","Duplexes for sale in Giza","Duplexes for sale in Matruh","Duplexes for sale in Red Sea"] },
    { title:"Townhouses",  links:["Townhouses for sale in Egypt","Townhouses for sale in Cairo","Townhouses for sale in Giza","Townhouses for sale in Matruh","Townhouses for sale in Red Sea"] },
    { title:"Shops",       links:["Shops for sale in Egypt","Shops for sale in Alexandria","Shops for sale in Nasr City","Shops for sale in Sheikh Zayed","Shops for sale in New Capital City"] },
  ],
};

export default function HomePage({ onNavigate, theme, toggleTheme, isLoggedIn, onSearch }) {
  const [favs, setFavs]             = useState([]);
  const [popularTab, setPopularTab] = useState("sale");
  const [showRow2, setShowRow2]     = useState(false);

  const [city,      setCity]      = useState("");
  const [district,  setDistrict]  = useState("");
  const [propType,  setPropType]  = useState("");
  const [bedrooms,  setBedrooms]  = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [floor,     setFloor]     = useState("");

  // Cities, districts & property types from API
  const [cities,    setCities]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [propTypes, setPropTypes] = useState([]);
  const [citiesLoading,    setCitiesLoading]    = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // API state (featured properties)
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Market trends
  const [trends,        setTrends]        = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const trendsScrollRef = useRef(null);

  const scrollTrends = (dir) => {
    if (!trendsScrollRef.current) return;
    trendsScrollRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/search", { params: { page: 1, city: "cairo" } });
        setProperties(res.data);
      } catch (err) {
        setError("Failed to load properties. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch market trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setTrendsLoading(true);
        const res = await api.get("/analytics/market-trends");
        setTrends(res.data);
      } catch (err) {
        console.error("Failed to load market trends:", err);
      } finally {
        setTrendsLoading(false);
      }
    };
    fetchTrends();
  }, []);

  // Fetch all cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setCitiesLoading(true);
        const res = await api.get("/cities");
        setCities(res.data);
      } catch (err) {
        console.error("Failed to load cities:", err);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, []);

  // Fetch property types on mount
  useEffect(() => {
    api.get("/properties/types")
      .then(res => setPropTypes(res.data))
      .catch(err => console.error("Failed to load property types:", err));
  }, []);

  // Fetch districts whenever city changes
  useEffect(() => {
    setDistrict("");        // reset district when city changes
    setDistricts([]);
    if (!city) return;
    const fetchDistricts = async () => {
      try {
        setDistrictsLoading(true);
        const res = await api.get(`/cities/${city}/districts`);
        setDistricts(res.data);
      } catch (err) {
        console.error("Failed to load districts:", err);
      } finally {
        setDistrictsLoading(false);
      }
    };
    fetchDistricts();
  }, [city]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get("/favorites");
        const favIds = res.data.map(item => item.property_id);
        setFavs(favIds);
      } catch (err) {
        console.error(err);
      }
    };
    if (isLoggedIn) {
      fetchFavorites();
    }
  }, [isLoggedIn]);

  const toggleFav = async (id) => {
    if (!isLoggedIn) {
      onNavigate("signin");
      return;
    }
    const isFav = favs.includes(id);
    setFavs(f => isFav ? f.filter(x => x !== id) : [...f, id]);
    try {
      if (!isFav) {
        await api.post(`/favorites/${id}`);
      } else {
        await api.delete(`/favorites/${id}`);
      }
    } catch (err) {
      console.error(err);
      setFavs(f => isFav ? [...f, id] : f.filter(x => x !== id));
    }
  };

  /* ── SEARCH HANDLER ─────────────────────────────────────────────────────────────────────── */
  const handleSearch = () => {
    // Just pass filter values — SearchResults owns all API fetching
    onSearch({ city, district, propType, bedrooms, bathrooms, floor });
  };
  /* ──────────────────────────────────────────────────────────────────────────────── */

  const cats = POPULAR[popularTab];

  return (
    <div className="home">
      <Navbar onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} isLoggedIn={isLoggedIn} />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg"><div className="hero-gradient" /></div>
        <div className="hero-content">
          <p className="hero-eyebrow">3KARATI REAL ESTATE</p>
          <h1 className="hero-title">
            Explore Our <em>Hidden Gems</em><br />for Sale and Rent
          </h1>

          {/* Search Card — 2 rows × 3 dropdowns */}
          <div className="search-card">
            <p className="search-card-label">Find your perfect property</p>
            <div className="search-row">
              <div className="dropdown-wrap">
                <label className="dropdown-label">City</label>
                <select className="filter-select" value={city} onChange={e => setCity(e.target.value)} disabled={citiesLoading}>
                  <option value="">{citiesLoading ? "Loading…" : "All Cities"}</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="dropdown-wrap">
                <label className="dropdown-label">District</label>
                <select className="filter-select" value={district} onChange={e => setDistrict(e.target.value)} disabled={!city || districtsLoading}>
                  <option value="">
                    {!city ? "Select a city first" : districtsLoading ? "Loading…" : "All Districts"}
                  </option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="dropdown-wrap">
                <label className="dropdown-label">Property Type</label>
                <select className="filter-select" value={propType} onChange={e => setPropType(e.target.value)}>
                  <option value="">{propTypes.length === 0 ? "Loading…" : "All Types"}</option>
                  {propTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="search-row">
              <div className="dropdown-wrap">
                <label className="dropdown-label">Bedrooms</label>
                <select className="filter-select" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
                  <option value="">Any</option>
                  <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
                </select>
              </div>
              <div className="dropdown-wrap">
                <label className="dropdown-label">Bathrooms</label>
                <select className="filter-select" value={bathrooms} onChange={e => setBathrooms(e.target.value)}>
                  <option value="">Any</option>
                  <option>1</option><option>2</option><option>3</option><option>4+</option>
                </select>
              </div>
              <div className="dropdown-wrap">
                <label className="dropdown-label">Floor</label>
                <select className="filter-select" value={floor} onChange={e => setFloor(e.target.value)}>
                  <option value="">Any floor</option>
                  <option>Garden</option><option>1</option>
                  <option>2</option><option>3</option>
                  <option>4</option><option>5</option>
                </select>
              </div>
            </div>
            <button className="search-btn" onClick={handleSearch}>
              Search Properties
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section">
        <div className="stats-header">
          <h2 className="section-title">What's Happening in Your Area</h2>
          <p className="section-sub">Whether you're searching for a new residence or an investment opportunity, we're here to help.</p>
          <p className="stats-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Maadi, Cairo
          </p>
        </div>
        <div className="stats-grid">
          {[{n:"165",l:"Homes For Rent"},{n:"416",l:"Homes For Sale"},{n:"740",l:"Real Estate Agents"},{n:"251",l:"Apartments Available"}].map(s => (
            <div className="stat-card" key={s.l}>
              <div className="stat-num">{s.n}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARKET TRENDS ── */}
      <section className="trends-section">
        <div className="trends-header">
          <div className="trends-header-left">
            <span className="trends-eyebrow">Live Data</span>
            <h2 className="section-title">Market Trends</h2>
            <p className="section-sub">Real-time snapshot of Egypt's hottest real estate markets</p>
          </div>
          {trends && (
            <div className="trends-summary-pills">
              <div className="trends-pill">
                <span className="trends-pill-num">{Number(trends.summary.total_listings).toLocaleString()}</span>
                <span className="trends-pill-label">Total Listings</span>
              </div>
              <div className="trends-pill">
                <span className="trends-pill-num">{Number(trends.summary.active_listings).toLocaleString()}</span>
                <span className="trends-pill-label">Active Now</span>
              </div>
              <div className="trends-pill">
                <span className="trends-pill-num">EGP {(trends.summary.average_listing_price / 1_000_000).toFixed(1)}M</span>
                <span className="trends-pill-label">Avg. Price</span>
              </div>
            </div>
          )}
        </div>

        {trendsLoading && <div className="trends-loading"><span className="trends-spinner" />Loading market data…</div>}

        {!trendsLoading && trends && (
          <div className="trends-carousel">
            <button className="trends-arrow trends-arrow-left" onClick={() => scrollTrends(-1)} aria-label="Scroll left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="trends-scroll-track" ref={trendsScrollRef}>
              {trends.hotspots.slice(0, 10).map((spot, i) => (
              <div className="trend-card" key={spot.city} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="trend-card-rank">#{i + 1}</div>
                <div className="trend-card-city">{spot.city}</div>
                <div className="trend-card-price">
                  EGP {(spot.average_price / 1_000_000).toFixed(2)}M
                  <span className="trend-card-price-label">avg price</span>
                </div>
                <div className="trend-card-divider" />
                <div className="trend-card-listings">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>{Number(spot.active_listings).toLocaleString()} active</span>
                </div>
              </div>
            ))}
            </div>
            <button className="trends-arrow trends-arrow-right" onClick={() => scrollTrends(1)} aria-label="Scroll right">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* ── LISTINGS ── */}
      <section className="listings-section">
        <h2 className="section-title">Featured Properties</h2>
        <p className="section-sub">Hand-picked listings across Egypt's finest locations</p>

        {loading && <p className="listings-status">Loading properties...</p>}
        {error   && <p className="listings-status listings-error">{error}</p>}
        {!loading && !error && properties.length === 0 && <p className="listings-status">No properties found.</p>}

        {!loading && !error && properties.length > 0 && (
          <div className="listings-grid">
            {properties.slice(0, 8).map((p, i) => (
              <div className="prop-card" key={p.id}   onClick={() => onNavigate("propertyDetails", { id: p.id , from: "home" })} style={{ cursor: "pointer" }}>
                <div className="prop-img" style={{backgroundImage: `url(${BUCKET_url}/media/${p.id}/${p.media})`, backgroundSize: "cover", backgroundPosition: "center"}}>
                  <div className="prop-img-overlay" />
                  <span className="prop-type-badge">{p.type}</span>
                  <button className={`fav-btn ${favs.includes(p.id) ? "active" : ""}`}   onClick={(e) => {e.stopPropagation();toggleFav(p.id);}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favs.includes(p.id) ? "#ff4d6d" : "none"} stroke={favs.includes(p.id) ? "#ff4d6d" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <div className="prop-info">
                  <div className="prop-price">EGP {Number(p.price).toLocaleString()}</div>
                  <div className="prop-title">{p.type} in {p.district}</div>
                  <div className="prop-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {p.city}, {p.district}
                  </div>
                  <div className="prop-meta">
                    <span>{p.rooms} bed</span><span>{p.bathrooms} bath</span><span>{p.area} m²</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── POPULAR SEARCHES ── */}
      <section className="popular-section">
        <h2 className="popular-title">Popular searches in Egypt</h2>
        <div className="popular-tabs">
          {["sale"].map(t => (
            <button key={t} className={`popular-tab ${popularTab === t ? "active" : ""}`}
              onClick={() => { setPopularTab(t); setShowRow2(false); }}>
              {t === "sale" ? "For Sale" : "For Rent"}
            </button>
          ))}
        </div>
        <div className="popular-grid">
          {cats.slice(0, 3).map(cat => (
            <div className="popular-col" key={cat.title}>
              <h3 className="popular-col-title">{cat.title}</h3>
              <ul className="popular-links">
                {cat.links.map(l => <li key={l}><a href="#" className="popular-link">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="popular-divider">
          <button className="view-all-btn" onClick={() => setShowRow2(v => !v)}>
            {showRow2 ? "View less ▲" : "View all ▼"}
          </button>
        </div>
        {showRow2 && (
          <div className="popular-grid" style={{ marginTop: "32px" }}>
            {cats.slice(3, 6).map(cat => (
              <div className="popular-col" key={cat.title}>
                <h3 className="popular-col-title">{cat.title}</h3>
                <ul className="popular-links">
                  {cat.links.map(l => <li key={l}><a href="#" className="popular-link">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-logo">
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
            <path d="M5 34V19L13 11H27L35 19V34" stroke="#0fc4ff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 34V27H25V34" stroke="#1a8cca" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 19L20 7L35 19" stroke="#0fc4ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>3KARATI REAL ESTATE</span>
        </div>
        <p className="footer-copy">© 2025 3Karati Real Estate. All rights reserved.</p>
      </footer>
    </div>
  );
}
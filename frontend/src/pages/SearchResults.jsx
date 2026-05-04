import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import "./SearchResults.css";

/* ── Full property dataset ── */
const ALL_PROPERTIES = [
  { id:1,  title:"Badya Palm Hills Compound, 6th...",       price:1199000,  type:"Villa",      condition:"finished",   beds:3, baths:2, area:1500, city:"6th of October", img:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&q=80" },
  { id:2,  title:"Own your luxury standalone villa...",     price:4000000,  type:"Villa",      condition:"finished",   beds:4, baths:3, area:2200, city:"New Cairo",      img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&q=80" },
  { id:3,  title:"Villa for sale, ready to move in...",     price:11309900, type:"Villa",      condition:"finished",   beds:5, baths:4, area:3200, city:"Sheikh Zayed",   img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80" },
  { id:4,  title:"Villa Town House Same Price As ...",      price:4000000,  type:"Townhouse",  condition:"finished",   beds:4, baths:2, area:2800, city:"Cairo",          img:"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80" },
  { id:5,  title:"Villa for sale at the real price fully...",price:3599900, type:"Villa",      condition:"finished",   beds:3, baths:2, area:1900, city:"Giza",           img:"https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=500&q=80" },
  { id:6,  title:"Finished villa in New Cairo, wall...",    price:1099000,  type:"Villa",      condition:"finished",   beds:2, baths:2, area:1300, city:"New Cairo",      img:"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&q=80" },
  { id:7,  title:"Modern apartment in Downtown Cairo...",   price:850000,   type:"Apartment",  condition:"finished",   beds:2, baths:1, area:120,  city:"Cairo",          img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80" },
  { id:8,  title:"Penthouse with private pool, Zamalek...", price:6200000,  type:"Apartment",  condition:"finished",   beds:5, baths:4, area:4200, city:"Cairo",          img:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=80" },
  { id:9,  title:"Studio apartment in New Capital...",      price:650000,   type:"Studio",     condition:"unfinished", beds:1, baths:1, area:65,   city:"New Capital",    img:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80" },
  { id:10, title:"Duplex with garden in Sheikh Zayed...",   price:3200000,  type:"Duplex",     condition:"finished",   beds:4, baths:3, area:3100, city:"Sheikh Zayed",   img:"https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&q=80" },
  { id:11, title:"Apartment for sale in Alexandria...",     price:900000,   type:"Apartment",  condition:"off-plan",   beds:3, baths:2, area:140,  city:"Alexandria",     img:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&q=80" },
  { id:12, title:"Chalet in North Coast with sea view...",  price:2500000,  type:"Chalet",     condition:"finished",   beds:3, baths:2, area:180,  city:"North Coast",    img:"https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=500&q=80" },
];

const SORT_OPTIONS = ["New", "Price ascending", "Price descending", "Rating"];

const PROP_TYPES = ["Apartment", "Villa", "Duplex", "Townhouse", "Studio", "Chalet", "Office", "Shop"];
const CONDITIONS = ["finished", "unfinished", "off-plan"];
const BED_OPTIONS = [1, 2, 3, 4, 5];

function formatPrice(n) {
  if (n >= 1000000) return `EGP ${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  return `EGP ${n.toLocaleString()}`;
}

export default function SearchResults({ onNavigate, theme, toggleTheme, isLoggedIn, initialFilters = {} }) {

  /* ── Filter state (seeded from home page search) ── */
  const [keyword,    setKeyword]    = useState(initialFilters.propType  || "");
  const [city,       setCity]       = useState(initialFilters.city      || "");
  const [district,   setDistrict]   = useState(initialFilters.district  || "");
  const [selTypes,   setSelTypes]   = useState(initialFilters.propType ? [initialFilters.propType] : []);
  const [conditions, setConditions] = useState([...CONDITIONS]);
  const [selBeds,    setSelBeds]    = useState(initialFilters.bedrooms ? [Number(initialFilters.bedrooms)] : []);
  const [maxPrice,   setMaxPrice]   = useState(50000000);
  const [sortBy,     setSortBy]     = useState("New");
  const [showMoreBeds, setShowMoreBeds] = useState(false);
  const [typeOpen,   setTypeOpen]   = useState(true);
  const [favs,       setFavs]       = useState([]);

  /* ── Active keyword tags ── */
  const activeTags = [
    ...(city       ? [city]       : []),
    ...(district   ? [district]   : []),
    ...selTypes,
  ];
  const removeTag = (tag) => {
    if (tag === city)     setCity("");
    if (tag === district) setDistrict("");
    setSelTypes(p => p.filter(t => t !== tag));
  };

  /* ── Toggle helpers ── */
  const toggleType = (t) => setSelTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleCond = (c) => setConditions(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleBed  = (b) => setSelBeds(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);
  const toggleFav  = (id) => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  /* ── Live filtered + sorted results ── */
  const results = useMemo(() => {
    let list = ALL_PROPERTIES.filter(p => {
      if (city      && p.city !== city)              return false;
      if (selTypes.length  && !selTypes.includes(p.type))       return false;
      if (conditions.length && !conditions.includes(p.condition)) return false;
      if (selBeds.length   && !selBeds.includes(p.beds))        return false;
      if (p.price > maxPrice)                        return false;
      return true;
    });

    if (sortBy === "Price ascending")  list = [...list].sort((a,b) => a.price - b.price);
    if (sortBy === "Price descending") list = [...list].sort((a,b) => b.price - a.price);

    return list;
  }, [city, selTypes, conditions, selBeds, maxPrice, sortBy]);

  const visibleBeds = showMoreBeds ? BED_OPTIONS : BED_OPTIONS.slice(0, 3);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="sr-page">
      <Navbar onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} isLoggedIn={isLoggedIn} hideThemeToggle={true} />

      {/* Mobile filter toggle bar */}
      <div className="sr-mobile-bar">
        <button className="sr-filter-toggle" onClick={() => setFilterOpen(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          {filterOpen ? "Hide Filters" : "Show Filters"}
          {(selTypes.length + selBeds.length + (city ? 1 : 0)) > 0 && (
            <span className="sr-filter-badge">{selTypes.length + selBeds.length + (city ? 1 : 0)}</span>
          )}
        </button>
      </div>
      {filterOpen && <div className="sr-overlay" onClick={() => setFilterOpen(false)} />}
      <div className="sr-body">

        {/* ══════ LEFT SIDEBAR ══════ */}
        <aside className={`sr-sidebar ${filterOpen ? "sr-sidebar-open" : ""}`}>

          {/* Keywords */}
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

          {/* Residential type dropdown */}
          <div className="sr-section">
            <div className="sr-section-label">Residential</div>
            <button className="sr-dropdown-btn" onClick={() => setTypeOpen(v => !v)}>
              <span>type</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: typeOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {typeOpen && (
              <div className="sr-dropdown-list">
                {PROP_TYPES.map(t => (
                  <label key={t} className="sr-check-item">
                    <span className={`sr-cb ${selTypes.includes(t) ? "on" : ""}`}
                      onClick={() => toggleType(t)}>
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

          {/* Price slider */}
          <div className="sr-section">
            <div className="sr-price-row">
              <span className="sr-section-label">Price</span>
              <span className="sr-price-val">EGP {(maxPrice / 1000000).toFixed(0)}M</span>
            </div>
            <input
              type="range" className="sr-slider"
              min={500000} max={50000000} step={500000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
            />
            <div className="sr-price-minmax">
              <span>EGP 0</span><span>EGP 50M</span>
            </div>
          </div>

          {/* Condition */}
          <div className="sr-section">
            <div className="sr-section-label">Condition</div>
            {CONDITIONS.map(c => (
              <label key={c} className="sr-check-item">
                <span className={`sr-cb ${conditions.includes(c) ? "on" : ""}`}
                  onClick={() => toggleCond(c)}>
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
                <span className={`sr-cb ${selBeds.includes(b) ? "on" : ""}`}
                  onClick={() => toggleBed(b)}>
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

          {/* City dropdown */}
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

          {/* District dropdown */}
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
          {/* Grid */}
          {results.length === 0 ? (
            <div className="sr-empty">
              <svg width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No properties match your filters.</p>
              <button className="sr-reset-btn" onClick={() => {
                setSelTypes([]); setConditions([...CONDITIONS]);
                setSelBeds([]); setMaxPrice(50000000); setCity(""); setDistrict("");
              }}>Reset filters</button>
            </div>
          ) : (
            <div className="sr-grid">
              {results.map(p => (
                <div className="sr-card" key={p.id}>
                  <div className="sr-card-img-wrap">
                    <img src={p.img} alt={p.title} className="sr-card-img" />
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
                    <p className="sr-card-title">{p.title}</p>
                    <div className="sr-card-price">EGP <strong>{p.price.toLocaleString()}</strong></div>
                    <div className="sr-card-meta">
                      <span>{p.type}</span>
                      <span>· {p.beds} bd</span>
                      <span>· {p.baths} ba</span>
                      <span>· {p.area} m²</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

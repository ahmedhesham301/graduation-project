import { useState } from "react";
import Navbar from "../components/Navbar";
import "./HomePage.css";
// console.log("isLoggedIn:", isLoggedIn); // for test

const PROPERTIES = [
  { id:1, price:"EGP 1,199,000",  title:"Villa in Palm Hills Compound",    location:"6th of October, Giza",     beds:4, baths:2, sqft:1500, type:"House" },
  { id:2, price:"EGP 1,099,000",  title:"Finished Villa in New Cairo",      location:"New Cairo, Cairo",         beds:4, baths:3, sqft:2944, type:"House" },
  { id:3, price:"EGP 39,000,000", title:"Row Golf Villa at Launch Price",   location:"New Capital, Cairo",       beds:6, baths:3, sqft:3094, type:"Villa" },
  { id:4, price:"EGP 4,000,000",  title:"Villa For Sale With Installments", location:"Sheikh Zayed, Giza",      beds:4, baths:2, sqft:3033, type:"Villa" },
  { id:5, price:"EGP 2,500,000",  title:"Luxury Apartment Sea View",        location:"North Coast, Alexandria", beds:3, baths:2, sqft:1800, type:"Apartment" },
  { id:6, price:"EGP 850,000",    title:"Modern Studio in Downtown",        location:"Downtown, Cairo",         beds:1, baths:1, sqft:620,  type:"Apartment" },
  { id:7, price:"EGP 6,200,000",  title:"Penthouse with Private Pool",      location:"Zamalek, Cairo",          beds:5, baths:4, sqft:4200, type:"Apartment" },
  { id:8, price:"EGP 3,100,000",  title:"Twin House with Garden",           location:"Madinaty, Cairo",         beds:4, baths:3, sqft:2600, type:"House" },
];
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
  // rent: [
  //   { title:"Apartments",           links:["Apartments for rent in Cairo","Apartments for rent in Alexandria","Apartments for rent in Heliopolis","Apartments for rent in Sheikh Zayed","Apartments for rent in Madinaty"] },
  //   { title:"Villas",               links:["Villas for rent in Cairo","Villas for rent in Sheikh Zayed","Villas for rent in Giza","Villas for rent in Madinaty","Villas for rent in New Cairo"] },
  //   { title:"Shops",                links:["Shops for rent in Egypt","Shops for rent in Alexandria","Shops for rent in Nasr City","Shops for rent in Heliopolis","Shops for rent in 5th Settlement"] },
  //   { title:"Studio Apartments",    links:["Studio Apartments for Rent in Egypt","Studio Apartments for Rent in Cairo","Studio Apartments for Rent in Madinaty","Studio Apartments for Rent in 5th Settlement","Studio Apartments for Rent in Sheikh Zayed"] },
  //   { title:"Furnished Apartments", links:["Furnished Apartments for Rent in Egypt","Furnished Apartments for Rent in Nasr City","Furnished Apartments for Rent in Cairo","Furnished Apartments for Rent in Mohandiseen","Furnished Apartments for Rent in Alexandria"] },
  //   { title:"Offices",              links:["Offices for rent in Sheikh Zayed","Offices for rent in New Cairo","Offices for rent in 5th Settlement","Offices for rent in Heliopolis","Offices for rent in Nasr City"] },
  // ],
};

export default function HomePage({ onNavigate, theme, toggleTheme, isLoggedIn  }) {
  const [favs, setFavs]             = useState([]);
  const [popularTab, setPopularTab] = useState("sale");
  const [showRow2, setShowRow2]     = useState(false);

  const [city,      setCity]      = useState("");
  const [district,  setDistrict]  = useState("");
  const [propType,  setPropType]  = useState("");
  const [bedrooms,  setBedrooms]  = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [price,     setPrice]     = useState("");

  const toggleFav = id => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  const cats = POPULAR[popularTab];

  return (
    <div className="home">
      {/* Navbar receives theme + toggleTheme */}
      <Navbar onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} isLoggedIn={isLoggedIn}  />

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
                <select className="filter-select" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">All Cities</option>
                  <option>Cairo</option><option>Giza</option><option>Alexandria</option>
                  <option>New Cairo</option><option>Sheikh Zayed</option>
                  <option>6th of October</option><option>New Capital</option>
                  <option>North Coast</option><option>Red Sea</option>
                </select>
              </div>
              <div className="dropdown-wrap">
                <label className="dropdown-label">District</label>
                <select className="filter-select" value={district} onChange={e => setDistrict(e.target.value)}>
                  <option value="">All Districts</option>
                  <option>Maadi</option><option>Zamalek</option><option>Heliopolis</option>
                  <option>Nasr City</option><option>Mohandiseen</option>
                  <option>Madinaty</option><option>5th Settlement</option><option>Downtown</option>
                </select>
              </div>
              <div className="dropdown-wrap">
                <label className="dropdown-label">Property Type</label>
                <select className="filter-select" value={propType} onChange={e => setPropType(e.target.value)}>
                  <option value="">All Types</option>
                  <option>Apartment</option><option>Villa</option><option>Chalet</option>
                  <option>Duplex</option><option>Townhouse</option>
                  <option>Studio</option><option>Shop</option><option>Office</option>
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
                <select className="filter-select" value={price} onChange={e => setPrice(e.target.value)}>
                  <option value="">Any floor</option>
                  <option>Garden</option><option>1</option>
                  <option>2</option><option>3</option>
                  <option>4</option><option>5</option>
                </select>
              </div>
            </div>
            <button className="search-btn">Search Properties</button>
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

      {/* ── LISTINGS ── */}
      <section className="listings-section">
        <h2 className="section-title">Featured Properties</h2>
        <p className="section-sub">Hand-picked listings across Egypt's finest locations</p>
        <div className="listings-grid">
          {PROPERTIES.map((p, i) => (
            <div className="prop-card" key={p.id}>
              <div className="prop-img" style={{ background: COLORS[i % COLORS.length] }}>
                <div className="prop-img-overlay" />
                <span className="prop-type-badge">{p.type}</span>
                <button className={`fav-btn ${favs.includes(p.id) ? "active" : ""}`} onClick={() => toggleFav(p.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={favs.includes(p.id) ? "#ff4d6d" : "none"} stroke={favs.includes(p.id) ? "#ff4d6d" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className="prop-info">
                <div className="prop-price">{p.price}</div>
                <div className="prop-title">{p.title}</div>
                <div className="prop-location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {p.location}
                </div>
                <div className="prop-meta">
                  <span>{p.beds} bed</span><span>{p.baths} bath</span><span>{p.sqft.toLocaleString()} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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

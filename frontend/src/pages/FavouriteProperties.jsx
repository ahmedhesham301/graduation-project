import { useState } from "react";
import Navbar from "../components/Navbar";
import "./FavouriteProperties.css";

const PROPERTIES = [
  {
    id: 1,
    price: "EGP 64,199,000",
    type: "Villa",
    beds: 4, baths: 2, area: 1600,
    title: "Villa For Sale In October, Ready To Move (5 Rooms), From Palm Hills, With ...",
    location: "Badya Palm Hills Compound, 6th Of October, Giza",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80",
    tag: null,
  },
  {
    id: 2,
    price: "EGP 7,000,000",
    type: "Apartment",
    beds: 3, baths: 2, area: 150,
    title: "An Apartment With The Leading Percentage In The New Administrative ...",
    location: "Pukka, New Capital City, Cairo",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
    tag: null,
  },
  {
    id: 3,
    price: "EGP 47,000,000",
    type: "Villa",
    beds: 3, baths: 3, area: 200,
    title: "Villa For Sale With A View Of The Sea And The Marina, Fully Finished ...",
    location: "Gouna, Red Sea",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    tag: null,
  },
];

const MORE_PROPERTIES = [
  {
    id: 4,
    price: "EGP 6,500,000",
    type: "Duplex",
    beds: 4, baths: 4, area: 350,
    title: "Villa For Sale Directly With A View Of The Sea And The Marina, Fully Finished ...",
    location: "Gouna, Red Sea",
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80",
    tag: null,
  },
  {
    id: 5,
    price: "EGP 64,199,000",
    type: "Apartment",
    beds: 2, baths: 2, area: 130,
    title: "Fully Finished Apartment For Sale In Kayan Compound Very, Prime Location ...",
    location: "Kayan, 6th Of October, Giza",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    tag: null,
  },
];

const RECOMMENDED = [
  "Studio Properties For Sale In Egypt",
  "1 Bedroom Properties For Sale In Egypt",
  "Townhouses For Sale In Egypt",
  "Villas For Sale In Egypt",
  "Roofs For Sale In Egypt",
  "Chalets For Sale In Egypt",
];

const PAGES = [1, 2, 3, 4, 5];

export default function FavouriteProperties({ onNavigate, theme, toggleTheme, user }) {
  const [favs, setFavs] = useState([1, 2, 3, 4, 5]);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleFav = (id) =>
    setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  return (
    <div className="fp-page">

      <div className="fp-body">

        {/* ── Left main content ── */}
        <div className="fp-main">

          {/* Saved listings */}
          {PROPERTIES.map(p => (
            <div className="fp-card" key={p.id}>
              <div className="fp-card-img-wrap">
                <img src={p.img} alt={p.title} className="fp-card-img" />
                {p.tag && <span className="fp-tag">{p.tag}</span>}
              </div>
              <div className="fp-card-info">
                <div className="fp-card-top">
                  <div>
                    <div className="fp-card-price">{p.price}</div>
                    <div className="fp-card-meta">
                      <span className="fp-card-type">{p.type}</span>
                      <span className="fp-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        {p.beds}
                      </span>
                      <span className="fp-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V12h18v10"/><path d="M3 12V7a4 4 0 014-4h10a4 4 0 014 4v5"/></svg>
                        {p.baths}
                      </span>
                      <span className="fp-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        Area: {p.area} Sq.M
                      </span>
                    </div>
                  </div>
                  <button
                    className={`fp-fav-btn ${favs.includes(p.id) ? "active" : ""}`}
                    onClick={() => toggleFav(p.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24"
                      fill={favs.includes(p.id) ? "#e53935" : "none"}
                      stroke={favs.includes(p.id) ? "#e53935" : "#aaa"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                </div>

                <p className="fp-card-title">{p.title}</p>

                <div className="fp-card-location">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {p.location}
                </div>

                <div className="fp-card-actions">
                  <button className="fp-action-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email
                  </button>
                  <button className="fp-action-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.13 12.13 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.13 12.13 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    Call
                  </button>
                  <button className="fp-action-btn fp-whatsapp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                  <button className="fp-delete-btn" onClick={() => toggleFav(p.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Discover more */}
          <div className="fp-discover-title">Discover More Residential Properties For Sale</div>

          {MORE_PROPERTIES.map(p => (
            <div className="fp-card" key={p.id}>
              <div className="fp-card-img-wrap">
                <img src={p.img} alt={p.title} className="fp-card-img" />
              </div>
              <div className="fp-card-info">
                <div className="fp-card-top">
                  <div>
                    <div className="fp-card-price">{p.price}</div>
                    <div className="fp-card-meta">
                      <span className="fp-card-type">{p.type}</span>
                      <span className="fp-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        {p.beds}
                      </span>
                      <span className="fp-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V12h18v10"/><path d="M3 12V7a4 4 0 014-4h10a4 4 0 014 4v5"/></svg>
                        {p.baths}
                      </span>
                      <span className="fp-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        Area: {p.area} Sq.M
                      </span>
                    </div>
                  </div>
                  <button
                    className={`fp-fav-btn ${favs.includes(p.id) ? "active" : ""}`}
                    onClick={() => toggleFav(p.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24"
                      fill={favs.includes(p.id) ? "#e53935" : "none"}
                      stroke={favs.includes(p.id) ? "#e53935" : "#aaa"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                </div>

                <p className="fp-card-title">{p.title}</p>

                <div className="fp-card-location">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {p.location}
                </div>

                <div className="fp-card-actions">
                  <button className="fp-action-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email
                  </button>
                  <button className="fp-action-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.13 12.13 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.13 12.13 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    Call
                  </button>
                  <button className="fp-action-btn fp-whatsapp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="fp-pagination">
            <div className="fp-pages">
              {PAGES.map(p => (
                <button
                  key={p}
                  className={`fp-page-btn ${currentPage === p ? "active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >{p}</button>
              ))}
              <button className="fp-page-btn fp-page-next">&#9654;&#9654;</button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="fp-aside">

          {/* Ad banner 1 */}
          <div className="fp-ad-card fp-ad-dark">
            <div className="fp-ad-badge">NEW ERA</div>
            <p className="fp-ad-tagline">Start smart with</p>
            <h3 className="fp-ad-title">5% <span>Down</span><br/>Payment</h3>
            <button className="fp-ad-btn">Call To Now<br/><strong>t 19467</strong></button>
            <span className="fp-ad-limited">limited offer</span>
          </div>

          {/* Recommended Searches */}
          <div className="fp-recommended">
            <h4 className="fp-rec-title">Recommended Searches</h4>
            {RECOMMENDED.map(r => (
              <a key={r} href="#" className="fp-rec-link">{r}</a>
            ))}
            <a href="#" className="fp-rec-view-more">View More</a>
          </div>

          {/* Ad banner 2 */}
          <div className="fp-ad-card fp-ad-dark">
            <div className="fp-ad-badge">NEW ERA</div>
            <p className="fp-ad-tagline">On Top of</p>
            <h3 className="fp-ad-title-2">the Hills</h3>
            <button className="fp-ad-btn">Book Now:<br/><strong>wesend.ag</strong></button>
          </div>

          {/* Ad banner 3 */}
          <div className="fp-ad-card fp-ad-blue">
            <p className="fp-ad-opportunity">An Opportunity You Can't Miss</p>
            <h3 className="fp-ad-percent">5%</h3>
            <p className="fp-ad-down">Down Payment,<br/>Up to 10 Years</p>
            <span className="fp-ad-limited-2">Limited Offer</span>
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer className="fp-footer">
        <div className="fp-footer-inner">
          <div className="fp-footer-links">
            <span>ABOUT US</span><span className="fp-dot">|</span>
            <span>CONTACT US</span><span className="fp-dot">|</span>
            <span>TERMS &amp; PRIVACY POLICY</span>
          </div>
          <div className="fp-footer-icons">
            <span className="fp-social"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></span>
            <span className="fp-social"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></span>
            <span className="fp-social"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></span>
            <span className="fp-social"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg></span>
          </div>
          <p className="fp-footer-copy">© 2025 - 2026 3karati.eg</p>
        </div>
      </footer>
    </div>
  );
}

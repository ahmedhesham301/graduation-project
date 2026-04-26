import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

export default function Navbar({ onNavigate, theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = ["Buy", "Sell", "Apartments", "Townhomes", "Favourite"];

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => onNavigate("home")}>
        <div className="nav-logo-icon">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <path d="M5 34V19L13 11H27L35 19V34" stroke="#0fc4ff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 34V27H25V34" stroke="#1a8cca" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 19L20 7L35 19" stroke="#0fc4ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="nav-logo-text">
          <span className="nav-logo-name">3KARATI</span>
          <span className="nav-logo-sub">REAL ESTATE</span>
        </div>
      </div>

      {/* Desktop nav links */}
      <ul className="nav-links">
        {links.map(l => <li key={l}><a className="nav-link" href="#">{l}</a></li>)}
      </ul>

      {/* Right actions */}
      <div className="nav-actions">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <button className="nav-signin-btn" onClick={() => onNavigate("signin")}>Sign In</button>

        {/* Profile icon — navigates to profile page */}
        <button className="nav-icon-btn" title="Profile" onClick={() => onNavigate("profile")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>

        {/* Hamburger */}
        <button className="nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span className={`ham-line ${menuOpen ? "open" : ""}`} />
          <span className={`ham-line ${menuOpen ? "open" : ""}`} />
          <span className={`ham-line ${menuOpen ? "open" : ""}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`nav-drawer ${menuOpen ? "open" : ""}`}>
        {links.map(l => (
          <a key={l} className="drawer-link" href="#" onClick={() => setMenuOpen(false)}>{l}</a>
        ))}
        <button className="drawer-link" style={{textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:"15px",fontFamily:"inherit",padding:"12px 14px",borderRadius:"8px"}}
          onClick={() => { onNavigate("profile"); setMenuOpen(false); }}>
          Profile
        </button>
        <div className="drawer-bottom">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button className="drawer-signin" onClick={() => { onNavigate("signin"); setMenuOpen(false); }}>Sign In</button>
        </div>
      </div>
    </nav>
  );
}

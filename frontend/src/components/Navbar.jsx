import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

export default function Navbar({ onNavigate, theme, toggleTheme, isLoggedIn, hideThemeToggle = false}) {
  // console.log("Navbar isLoggedIn:", isLoggedIn); //for test
  const [menuOpen, setMenuOpen] = useState(false);
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

     <div className="nav-actions">
  {!hideThemeToggle && (<ThemeToggle theme={theme} toggleTheme={toggleTheme} />)}

  {/* لو مش عامل login */}
  {!isLoggedIn && (
    <button className="nav-signin-btn" onClick={() => onNavigate("signin")}>
      Sign In
    </button>
  )}

  {/* لو عامل login */}
  {isLoggedIn && (
    <button
      className="nav-icon-btn"
      title="Profile"
      onClick={() => onNavigate("profile")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    </button>
  )}
  </div>
  </nav>
  );
}

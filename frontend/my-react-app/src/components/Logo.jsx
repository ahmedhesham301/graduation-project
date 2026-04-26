import "./Logo.css";

export default function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
          <path d="M5 34V19L13 11H27L35 19V34" stroke="#0fc4ff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 34V27H25V34" stroke="#1a8cca" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 19L20 7L35 19" stroke="#0fc4ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="logo-words">
        <div className="logo-name">3Karati</div>
        <div className="logo-sub">Real Estate</div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { api } from "./Axios";
import "./MaintenanceScreen.css";

const MaintenanceIcon = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background Glow */}
    <circle cx="60" cy="60" r="45" fill="rgba(26, 140, 202, 0.08)" />
    
    {/* Rotating Gear */}
    <g className="gear-spin" style={{ transformOrigin: "60px 60px" }}>
      <circle cx="60" cy="60" r="20" stroke="#1a8cca" strokeWidth="6" strokeDasharray="8 6" />
      <circle cx="60" cy="60" r="12" stroke="#1a8cca" strokeWidth="4" />
    </g>
    
    {/* Server/Database Shape */}
    <rect x="38" y="65" width="44" height="24" rx="4" fill="var(--card)" stroke="#1a8cca" strokeWidth="3" />
    <line x1="46" y1="73" x2="54" y2="73" stroke="#1a8cca" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="81" x2="66" y2="81" stroke="#1a8cca" strokeWidth="3" strokeLinecap="round" />
    
    {/* Pulsing indicator */}
    <circle cx="74" cy="73" r="3.5" fill="#16a34a" className="pulse-light" />
  </svg>
);

export default function MaintenanceScreen({ onRetrySuccess }) {
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMsg({ type: "active", text: "Checking system status..." });
    
    try {
      // Small artificial timeout so the user sees it actually checking
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data } = await api.get("/health");
      
      if (data && data.maintenance === false) {
        setStatusMsg({ type: "success", text: "System is online! Reconnecting..." });
        setTimeout(() => {
          onRetrySuccess();
        }, 1000);
      } else {
        setStatusMsg({ type: "active", text: "Maintenance is still in progress. Please check back shortly." });
        setTimeout(() => {
          setStatusMsg({ type: "", text: "" });
        }, 4000);
      }
    } catch (err) {
      setStatusMsg({ type: "active", text: "Unable to reach the server. Please check your internet connection." });
      setTimeout(() => {
        setStatusMsg({ type: "", text: "" });
      }, 4000);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="maintenance-screen">
      <div className="maintenance-card">
        <div className="maintenance-tag">System Update</div>
        <MaintenanceIcon />
        <div>
          <h1 className="maintenance-title">We'll Be Right Back</h1>
          <p className="maintenance-desc">
            We are currently performing scheduled upgrades and performance optimizations. 
            Your session is safe and you won't need to log in again.
          </p>
        </div>
        
        <div className="maintenance-progress-container">
          <div className="maintenance-progress-bar"></div>
        </div>

        <button 
          className="maintenance-btn" 
          onClick={handleCheckStatus} 
          disabled={checking}
        >
          {checking ? "Checking..." : "Check System Status"}
        </button>

        {statusMsg.text && (
          <div className={`maintenance-status-msg ${statusMsg.type}`}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { api } from "./Axios";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

export default function Navbar({ onNavigate, theme, toggleTheme, isLoggedIn, currentUser, hideThemeToggle = false}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
        setUnreadCount(data.unreadCount);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    let socket;
    try {
      socket = io("http://localhost:8080", {
        transports: ["polling", "websocket"],
        withCredentials: true,
        reconnectionAttempts: 3,
      });
    } catch (_) {}
    if (socket) {
      socket.emit("register_user", currentUser.id);
      socket.on("new_notification", (notif) => {
        setUnreadCount((c) => c + 1);
        setNotifications((prev) => [notif, ...prev]);
      });
      socket.on("connect_error", () => {});
    }

    return () => {
      clearInterval(interval);
      socket?.disconnect();
    };
  }, [isLoggedIn, currentUser?.id]);

  useEffect(() => {
    if (!showNotifs) return;
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifs]);

  const openNotifs = async () => {
    setShowNotifs((v) => !v);
    if (!showNotifs) {
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch (_) {}
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (_) {}
  };

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

  {!isLoggedIn && (
    <button className="nav-signin-btn" onClick={() => onNavigate("signin")}>
      Sign In
    </button>
  )}

  {isLoggedIn && (
    <div className="nav-logged-actions">
      {currentUser?.role === "admin" && (
        <button className="nav-admin-link" onClick={() => onNavigate("admin")}>
          Admin
        </button>
      )}

      {/* Notification Bell */}
      <div className="nav-notif-wrap" ref={notifRef}>
        <button className="nav-icon-btn" title="Notifications" onClick={openNotifs}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {unreadCount > 0 && <span className="nav-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </button>

        {showNotifs && (
          <div className="nav-notif-dropdown">
            <div className="nav-notif-header">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button className="nav-notif-mark-read" onClick={markAllRead}>Mark all read</button>
              )}
            </div>
            <div className="nav-notif-list">
              {notifications.length === 0 ? (
                <div className="nav-notif-empty">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`nav-notif-item ${!n.is_read ? "unread" : ""}`}
                    onClick={async () => {
                      if (!n.is_read) {
                        await api.put(`/notifications/${n.id}/read`);
                        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
                        setUnreadCount((c) => Math.max(0, c - 1));
                      }
                      setShowNotifs(false);
                      const offerTypes = ['new_offer', 'offer_accepted', 'offer_rejected', 'offer_countered'];
                      const tab = offerTypes.includes(n.type) ? "offers" : "chat";
                      onNavigate("profile", { tab });
                    }}>
                    <div className="nav-notif-dot-col">
                      {!n.is_read && <span className="nav-notif-dot" />}
                    </div>
                    <div className="nav-notif-content">
                      <div className="nav-notif-title">{n.title}</div>
                      <div className="nav-notif-message">{n.message}</div>
                      <div className="nav-notif-time">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button className="nav-icon-btn" title="Profile" onClick={() => onNavigate("profile")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </button>
    </div>
  )}
  </div>
  </nav>
  );
}

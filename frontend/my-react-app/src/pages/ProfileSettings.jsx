import { useState } from "react";
import AddProperty from "./AddProperty";
import "./ProfileSettings.css";

/* ── Icons ── */
const IconChevronLeft = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconEditPen = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IconHeart = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const IconPlusCircle = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const IconHelp = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconLogout = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconInfo = () => (
  <svg width="15" height="15" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconPhone = () => (
  <svg width="17" height="17" fill="none" stroke="#1a8cca" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg width="17" height="17" fill="none" stroke="#1a8cca" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

/* ── Main Component ── */
export default function ProfileSettings({ onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("edit");
  const [editMode, setEditMode]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const defaultData = { fullName: "Farouk Mohamed", phone: "" };
  const [formData, setFormData]   = useState(defaultData);
  const [savedData, setSavedData] = useState(defaultData);

  const firstName = savedData.fullName.trim().split(" ")[0] || "User";
  const initials  = savedData.fullName.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const navItems = [
    { id:"edit",        label:"Edit profile",  Icon: IconEditPen },
    { id:"favourite",   label:"Favourite",     Icon: IconHeart },
    { id:"addproperty", label:"Add Property",  Icon: IconPlusCircle },
    { id:"help",        label:"Help",          Icon: IconHelp },
  ];

  const handleEdit   = () => setEditMode(true);
  const handleCancel = () => { setFormData(savedData); setEditMode(false); };
  const handleSave   = () => { setSavedData(formData); setEditMode(false); };

  const today = new Date().toLocaleDateString("en-US", { weekday:"short", day:"numeric", month:"short", year:"numeric" });

  return (
    <div className="ps-app">

      {/* ── Sidebar — fixed ── */}
      <aside className={`ps-sidebar ${menuOpen ? "ps-sidebar-open" : ""}`}>
        <div className="ps-sidebar-back" onClick={() => onNavigate("home")}>
          <IconChevronLeft /> Back to Home
        </div>
        <nav className="ps-sidebar-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`ps-nav-item${activeNav === id ? " active" : ""}`}
              onClick={() => { setActiveNav(id); setMenuOpen(false); }}
            >
              <Icon /> {label}
            </button>
          ))}
          <button className="ps-nav-item logout" onClick={onLogout}>
            <IconLogout /> Log out
          </button>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && <div className="ps-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ── Main ── */}
      <main className="ps-main">

        {/* Topbar */}
        <div className="ps-topbar">
          <div className="ps-topbar-left">
            <button className="ps-menu-btn" onClick={() => setMenuOpen(v => !v)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h2 className="ps-welcome-title">Welcome, {firstName}</h2>
              <p className="ps-welcome-date">{today}</p>
            </div>
          </div>
          <div className="ps-topbar-right">
            <div className="ps-avatar-circle">{initials}</div>
          </div>
        </div>
        


        {/* ── Content area — switches by activeNav ── */}
        <div className="ps-content">

          {/* ── ADD PROPERTY ── */}
          {activeNav === "addproperty" && (
            <AddProperty onBack={() => setActiveNav("edit")} />
          )}

          {/* ── EDIT PROFILE ── */}
          {activeNav === "edit" && (
            <>
              <div className="ps-profile-header">
                <div className="ps-profile-avatar-wrap">
                  <div className="ps-profile-avatar">{initials}</div>
                </div>
                <div className="ps-profile-row">
                  <div className="ps-profile-info">
                    <div className="ps-profile-name">{savedData.fullName}</div>
                  </div>
                  {!editMode ? (
                    <button className="ps-edit-btn" onClick={handleEdit}>Edit</button>
                  ) : (
                    <div className="ps-btn-group">
                      <button className="ps-cancel-btn" onClick={handleCancel}>Cancel</button>
                      <button className="ps-save-btn" onClick={handleSave}>Save</button>
                    </div>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="ps-edit-banner">
                  <IconInfo /> You are now editing your profile. Click Save when done.
                </div>
              )}

              <div className="ps-form-stack">
                <div className="ps-field-group">
                  <label className="ps-field-label">Full Name</label>
                  <input className="ps-field-input" type="text" placeholder="Your Full Name"
                    value={formData.fullName} disabled={!editMode}
                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div className="ps-field-group">
                  <label className="ps-field-label">Phone Number</label>
                  <div className="ps-phone-row">
                    <div className={`ps-phone-code${!editMode ? " disabled" : ""}`}>🇪🇬 +20</div>
                    <input className="ps-field-input ps-phone-input" type="tel" placeholder="e.g. 1012345678"
                      value={formData.phone} disabled={!editMode}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} />
                  </div>
                </div>
              </div>

              <div className="ps-contact-section">
                <div className="ps-section-title">My Contact Info</div>
                <div className="ps-contact-card">
                  <div className="ps-contact-icon"><IconMail /></div>
                  <div>
                    <div className="ps-contact-text">faroukmol23@gmail.com</div>
                    <div className="ps-contact-sub">Email · verified 1 month ago</div>
                  </div>
                </div>
                <div className="ps-contact-card">
                  <div className="ps-contact-icon"><IconPhone /></div>
                  <div>
                    <div className="ps-contact-text">
                      {savedData.phone ? `+20 ${savedData.phone}` : "No phone number added"}
                    </div>
                    <div className="ps-contact-sub">Phone number</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── FAVOURITE ── */}
          {activeNav === "favourite" && (
            <div className="ps-placeholder">
              <IconHeart />
              <h3>Saved Properties</h3>
              <p>Properties you favourite will appear here.</p>
            </div>
          )}

          {/* ── HELP ── */}
          {activeNav === "help" && (
            <div className="ps-placeholder">
              <IconHelp />
              <h3>Help &amp; Support</h3>
              <p>Contact us at support@3karati.com or call +20 100 000 0000</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

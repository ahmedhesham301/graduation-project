import { useState, useEffect } from "react";
import AddProperty from "./AddProperty";
import FavouriteProperties from "./FavouriteProperties";
import SellerDashboard from "./sellerDashboard";
import ChatHistory from "./ChatHistory";
import MyProperties from "./MyProperties";
import PropertyOffers from "./PropertyOffers";
import "./ProfileSettings.css";
import { api } from "../components/Axios";

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
const IconChat = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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
const IconStorefront = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M3 9l1-5h16l1 5" />
    <path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
    <path d="M5 9v11h14V9" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);
const IconDashboard = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);
const IconBuilding = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18" />
    <path d="M4 22h16" />
    <path d="M10 22v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4" />
    <path d="M14 8h.01M10 8h.01M14 12h.01M10 12h.01" />
  </svg>
);
const IconDollarSign = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);

/* ── Main Component ── */
export default function ProfileSettings({ onNavigate, onLogout, initialTab, currentUser }) {
  const [activeNav, setActiveNav]         = useState(initialTab || "edit");
  const [editMode, setEditMode]           = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [loading, setLoading]             = useState(true);
  const [saveError, setSaveError]         = useState(null);
  const [isSeller, setIsSeller]           = useState(localStorage.getItem("isSeller") === "true");
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerError, setSellerError]     = useState(null);
  const [userRole, setUserRole]           = useState("buyer");

  useEffect(() => {
    if (initialTab) setActiveNav(initialTab);
  }, [initialTab]);

  const defaultData = { fullName: "", phone: "", email: "" };
  const [formData, setFormData]   = useState(defaultData);
  const [savedData, setSavedData] = useState(defaultData);

  /* ── Fetch user on mount ── */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/user/me");
        const mapped = {
          fullName: data.fullName ?? data.full_name ?? data.name ?? "",
          phone:    data.phone    ?? data.phoneNumber ?? "",
          email:    data.email    ?? "",
        };
        setFormData(mapped);
        setSavedData(mapped);
        setUserRole(data.role);

        if (data.role === "seller") {
          setIsSeller(true);
          localStorage.setItem("isSeller", "true");
        }
      } catch (err) {
        console.error(err.response?.data?.message ?? err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const firstName = savedData.fullName.trim().split(" ")[0] || "User";
  const initials  = savedData.fullName.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const navItems = [
    { id: "edit",      label: "Edit profile", Icon: IconEditPen },
    { id: "favourite", label: "Favourite",    Icon: IconHeart },
    { id: "offers",    label: "My Offers",    Icon: IconDollarSign },
    ...(currentUser?.role === "admin" ? [
      { id: "admin", label: "Admin Panel", Icon: IconDashboard },
    ] : []),
    ...(isSeller ? [
      { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
      { id: "addproperty", label: "Add Property", Icon: IconPlusCircle },
      { id: "myproperties", label: "My Properties", Icon: IconBuilding },
    ] : []),
    { id: "chat",      label: "My Chats",    Icon: IconChat },
    { id: "help",      label: "Help",         Icon: IconHelp },
  ];

  const handleEdit   = () => setEditMode(true);
  const handleCancel = () => { setFormData(savedData); setEditMode(false); setSaveError(null); };

  /* ── Save profile ── */
  const handleSave = async () => {
      const phone = formData.phone.replace("+20", "");
      if (phone.length !== 10 || phone.startsWith("0")) {
        setSaveError("Phone number must be 10 digits and cannot start with 0");
        return;
      }
    setSaveError(null);
    try {
      await api.patch("/user/me", {
        fullName: formData.fullName,
        phone:    formData.phone,
      });
      setSavedData(formData);
      setEditMode(false);
    } catch (err) {
      setSaveError(err.response?.data?.message ?? "Failed to save changes. Please try again.");
    }
  };

  /* ── Become a seller ── */
  const [sellerForm, setSellerForm] = useState({ businessName: "", businessType: "", nationalId: "" });
  const [sellerStatus, setSellerStatus] = useState(null);
  const [showSellerForm, setShowSellerForm] = useState(false);

  useEffect(() => {
    if (isSeller) return;
    const fetchStatus = async () => {
      try {
        const { data } = await api.get("/user/seller-status");
        setSellerStatus(data);
      } catch (err) {
        console.error("Failed to fetch seller status:", err);
      }
    };
    fetchStatus();
  }, [isSeller]);

  const handleBecomeSeller = async () => {
    if (!sellerForm.businessName || !sellerForm.nationalId) {
      setSellerError("Business name and national ID are required");
      return;
    }
    setSellerLoading(true);
    setSellerError(null);
    try {
      await api.post("/user/become-seller", sellerForm);
      setSellerStatus({ status: 'pending', business_name: sellerForm.businessName, submitted_at: new Date().toISOString() });
      setShowSellerForm(false);
    } catch (err) {
      setSellerError(err.response?.data?.error ?? "Request failed. Please try again.");
    } finally {
      setSellerLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="ps-app" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Loading profile…</p>
      </div>
    );
  }
 const countryCode = formData.phone.startsWith("+20") ? "+20" : "+20";
 
  return (
    <div className="ps-app">

      {/* ── Sidebar ── */}
      <aside className={`ps-sidebar ${menuOpen ? "ps-sidebar-open" : ""}`}>
        <div className="ps-sidebar-back" onClick={() => onNavigate("home")}>
          <IconChevronLeft /> Back to Home
        </div>
        <nav className="ps-sidebar-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`ps-nav-item${activeNav === id ? " active" : ""}`}
              onClick={() => {
                if (id === "admin") {
                  onNavigate("admin");
                } else {
                  setActiveNav(id);
                }
                setMenuOpen(false);
              }}
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

        {/* Hero banner */}
        {activeNav === "edit" && <div className="ps-hero" />}

        {/* ── Content ── */}
        <div className="ps-content">

          {activeNav === "dashboard" && (
            <SellerDashboard onNavigate={onNavigate} />
          )}

          {activeNav === "addproperty" && (
            <AddProperty onBack={() => setActiveNav("edit")} />
          )}

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

              {saveError && (
                <div className="ps-edit-banner" style={{ borderColor: "#dc2626", background: "#fef2f2", color: "#dc2626" }}>
                  {saveError}
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
                    <div className={`ps-phone-code${!editMode ? " disabled" : ""}`}> 🇪🇬 {countryCode}</div>
                    <input className="ps-field-input ps-phone-input" type="tel" placeholder="e.g. 1234567890"
                        value={formData.phone.startsWith("+20") ? formData.phone.slice(3) : formData.phone} disabled={!editMode}
                        onChange={(e) => {let numbersOnly = e.target.value.replace(/\D/g, "");
                        if (numbersOnly.length > 10) { numbersOnly = numbersOnly.slice(0, 10); }
                        setFormData(p => ({...p, phone: "+20" + numbersOnly}));}} />
                  </div>
                </div>
              </div>

              <div className="ps-contact-section">
                <div className="ps-section-title">My Contact Info</div>
                <div className="ps-contact-card">
                  <div className="ps-contact-icon"><IconMail /></div>
                  <div>
                    <div className="ps-contact-text">{savedData.email || "—"}</div>
                    <div className="ps-contact-sub">Email · verified 1 month ago</div>
                  </div>
                </div>
                <div className="ps-contact-card">
                  <div className="ps-contact-icon"><IconPhone /></div>
                  <div>
                    <div className="ps-contact-text">
                      {savedData.phone ? `${savedData.phone.slice(0, 3)} ${savedData.phone.slice(3)}` : "No phone number added"}
                    </div>
                    <div className="ps-contact-sub">Phone number</div>
                  </div>
                </div>
              </div> 
              {/* ── Become a Seller Section ── */}
              {!isSeller && (
                <div className="ps-seller-fab">
                  {sellerStatus?.status === 'pending' && (
                    <div className="ps-seller-status pending">
                      <strong>Seller Request Pending</strong>
                      <p>Your application is under review. We'll notify you once it's processed.</p>
                      <p className="ps-seller-submitted">Submitted: {new Date(sellerStatus.submitted_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {sellerStatus?.status === 'rejected' && (
                    <div className="ps-seller-status rejected">
                      <strong>Seller Request Rejected</strong>
                      <p className="ps-seller-reason">Reason: {sellerStatus.rejection_reason}</p>
                      <button onClick={() => setShowSellerForm(true)} className="ps-seller-btn">
                        <IconStorefront />
                        Reapply
                      </button>
                    </div>
                  )}
                  {(!sellerStatus || sellerStatus.status === 'none') && !showSellerForm && (
                    <button onClick={() => setShowSellerForm(true)} className="ps-seller-btn">
                      <IconStorefront />
                      Become a Seller
                    </button>
                  )}
                  {showSellerForm && (
                    <div className="ps-seller-form">
                      <h3>Seller Application</h3>
                      {sellerError && <div className="ps-seller-error">{sellerError}</div>}
                      <input
                        type="text"
                        placeholder="Business Name *"
                        value={sellerForm.businessName}
                        onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Business Type (e.g. Real Estate Agency)"
                        value={sellerForm.businessType}
                        onChange={(e) => setSellerForm({ ...sellerForm, businessType: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="National ID *"
                        value={sellerForm.nationalId}
                        onChange={(e) => setSellerForm({ ...sellerForm, nationalId: e.target.value })}
                      />
                      <div className="ps-seller-form-actions">
                        <button onClick={handleBecomeSeller} disabled={sellerLoading} className="ps-seller-btn">
                          {sellerLoading ? "Submitting…" : "Submit Application"}
                        </button>
                        <button onClick={() => { setShowSellerForm(false); setSellerError(null); }} className="ps-seller-cancel">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeNav === "favourite" && (
          <FavouriteProperties
          onBack={() => setActiveNav("edit")}
          onNavigate={onNavigate}/>
          )}

          {activeNav === "offers" && (
            <PropertyOffers 
              onBack={() => setActiveNav("edit")} 
              onNavigate={onNavigate} 
              userRole={userRole}
            />
          )}


          {activeNav === "chat" && (
            <ChatHistory onBack={() => setActiveNav("edit")} onNavigate={onNavigate} />
          )}

          {activeNav === "myproperties" && (
            <MyProperties onBack={() => setActiveNav("edit")} onNavigate={onNavigate} />
          )}

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
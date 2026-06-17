import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import { 
    LayoutDashboard, Users, Home, UserPlus, 
    MessageSquare, BarChart3, History, LogOut,
    Search, Bell, Settings, ChevronRight, PieChart, Shield, CheckCircle
} from "lucide-react";
import AdminUsers from "./AdminUsers";
import AdminProperties from "./AdminProperties";
import AdminSellerRequests from "./AdminSellerRequests";
import AdminContacts from "./AdminContacts";
import AdminActivityLog from "./AdminActivityLog";
import AdminSecurityLogs from "./AdminSecurityLogs";
import AdminSoldProperties from "./AdminSoldProperties";
import AdminSettings from "./AdminSettings";
import AdminAnalytics from "./AdminAnalytics";
import AdminReports from "./AdminReports";
import Skeleton from "../components/Skeleton";
import "./AdminDashboard.css";

export default function AdminDashboard({ onLogout, onNavigate, currentUser }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState({ users: [], properties: [] });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState({ pendingSellers: 0 });

    const handleLogoutClick = (e) => {
        e.preventDefault();
        if (onLogout) onLogout();
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get("/admin/notifications");
                setNotifications(data);
            } catch (err) {
                console.error("Failed to load notifications:", err);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab !== "overview") return;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, recentRes] = await Promise.all([
                    api.get("/admin/stats"),
                    api.get("/admin/recent")
                ]);
                setStats(statsRes.data);
                setRecent(recentRes.data);
            } catch (err) {
                console.error("Failed to load admin data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const navItems = [
        { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
        { id: "analytics", label: "Analytics", icon: <PieChart size={20} /> },
        { id: "reports", label: "Reports", icon: <BarChart3 size={20} /> },
        { id: "users", label: "Users", icon: <Users size={20} /> },
        { id: "properties", label: "Properties", icon: <Home size={20} /> },
        { id: "sold", label: "Sold", icon: <CheckCircle size={20} /> },
        { id: "sellers", label: "Seller Requests", icon: <UserPlus size={20} />, badge: notifications.pendingSellers },
        { id: "contacts", label: "Contacts", icon: <MessageSquare size={20} /> },
        { id: "activity", label: "Activity Log", icon: <History size={20} /> },
        { id: "security", label: "Security Logs", icon: <Shield size={20} /> },
        { id: "settings", label: "System Settings", icon: <Settings size={20} /> },
    ];

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <div className="admin-logo" onClick={() => setActiveTab("overview")} style={{ cursor: "pointer" }}>
                    <div className="logo-icon"></div>
                    <span>3akarati Admin</span>
                </div>
                
                <nav className="admin-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span className="item-content">
                                {item.icon}
                                <span>{item.label}</span>
                            </span>
                            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="admin-logout-btn" onClick={handleLogoutClick}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="topbar-search">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search for anything..." />
                    </div>
                    <div className="topbar-actions">
                        <button 
                            className="topbar-btn" 
                            onClick={() => setActiveTab("sellers")}
                            title="View Seller Requests"
                        >
                            <Bell size={20} />
                            {notifications.pendingSellers > 0 && <span className="dot"></span>}
                        </button>
                        <button 
                            className="topbar-btn" 
                            onClick={() => setActiveTab("settings")}
                            title="Go to System Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <div className="user-profile">
                            <div className="avatar" onClick={() => onNavigate("profile")} style={{ cursor: "pointer" }}>{currentUser?.name?.[0] || "A"}</div>
                            <div className="user-info">
                                <span className="name">{currentUser?.name || "Super Admin"}</span>
                                <span className="role">Administrator</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    {activeTab === "overview" && (
                        <div className="overview-container">
                            <div className="content-header">
                                <div>
                                    <h1>Dashboard Overview</h1>
                                    <p>Welcome back! Here's what's happening today.</p>
                                </div>
                                <button className="primary-action" onClick={() => setActiveTab("analytics")}>Detailed Analytics</button>
                            </div>

                            <section className="admin-stats">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="stat-card">
                                            <Skeleton height="80px" />
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="stat-card">
                                            <div className="stat-icon users"><Users size={24} /></div>
                                            <div className="stat-details">
                                                <span className="stat-label">Total Users</span>
                                                <span className="stat-value">{stats?.total_users || 0}</span>
                                                <span className="stat-trend positive">+{stats?.new_users_30d || 0} new (30d)</span>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-icon properties"><Home size={24} /></div>
                                            <div className="stat-details">
                                                <span className="stat-label">Properties</span>
                                                <span className="stat-value">{stats?.total_properties || 0}</span>
                                                <span className="stat-trend positive">+{stats?.new_properties_30d || 0} new (30d)</span>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-icon sold"><BarChart3 size={24} /></div>
                                            <div className="stat-details">
                                                <span className="stat-label">Sold Items</span>
                                                <span className="stat-value">{stats?.sold_properties || 0}</span>
                                                <span className="stat-trend positive">Active listings</span>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-icon contacts"><MessageSquare size={24} /></div>
                                            <div className="stat-details">
                                                <span className="stat-label">Total Contacts</span>
                                                <span className="stat-value">{stats?.total_contacts || 0}</span>
                                                <span className="stat-trend positive">Lead generation</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>

                            <div className="admin-grid-layout">
                                <section className="admin-section table-section">
                                    <div className="section-header">
                                        <h2>Recent Users</h2>
                                        <button className="text-btn" onClick={() => setActiveTab("users")}>
                                            View All <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="400px" />
                                    ) : (
                                        <div className="table-wrapper">
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>User</th>
                                                        <th>Role</th>
                                                        <th>Joined</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recent.users.map(user => (
                                                        <tr key={user.id}>
                                                            <td>
                                                                <div className="user-cell">
                                                                    <div className="mini-avatar">{user.full_name[0]}</div>
                                                                    <div className="user-meta">
                                                                        <span className="name">{user.full_name}</span>
                                                                        <span className="email">{user.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                <section className="admin-section table-section">
                                    <div className="section-header">
                                        <h2>Recent Listings</h2>
                                        <button className="text-btn" onClick={() => setActiveTab("properties")}>
                                            View All <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="400px" />
                                    ) : (
                                        <div className="table-wrapper">
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Location</th>
                                                        <th>Price</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recent.properties.map(prop => (
                                                        <tr key={prop.id}>
                                                            <td>
                                                                <div className="property-cell">
                                                                    <span className="district">{prop.district}</span>
                                                                    <span className="city">{prop.city}</span>
                                                                </div>
                                                            </td>
                                                            <td><span className="price">{Number(prop.price).toLocaleString()} EGP</span></td>
                                                            <td>
                                                                {prop.sold_at ? (
                                                                    <span className="status-badge sold">Sold</span>
                                                                ) : (
                                                                    <span className={`status-badge ${prop.moderation_status === 'pending' ? 'pending' : 'available'}`}>
                                                                        {prop.moderation_status === 'pending' ? 'Pending' : 'Approved'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === "analytics" && <AdminAnalytics />}
                    {activeTab === "reports" && <AdminReports />}
                    {activeTab === "users" && <AdminUsers />}
                    {activeTab === "properties" && <AdminProperties />}
                    {activeTab === "sold" && <AdminSoldProperties onNavigate={onNavigate} />}
                    {activeTab === "sellers" && <AdminSellerRequests />}
                    {activeTab === "contacts" && <AdminContacts />}
                    {activeTab === "activity" && <AdminActivityLog />}
                    {activeTab === "security" && <AdminSecurityLogs />}
                    {activeTab === "settings" && <AdminSettings />}
                </div>
            </main>
        </div>
    );
}

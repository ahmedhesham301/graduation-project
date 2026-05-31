import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import { Save, RefreshCw, AlertCircle } from "lucide-react";
import "./AdminSettings.css";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        site_name: "",
        contact_email: "",
        contact_phone: "",
        maintenance_mode: "false",
        allow_new_registrations: "true",
        featured_properties_limit: "6"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get("/admin/settings");
                setSettings(prev => ({ ...prev, ...data }));
            } catch (err) {
                console.error("Failed to load settings:", err);
                setMessage({ type: "error", text: "Failed to load settings" });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === "checkbox" ? String(checked) : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            await api.patch("/admin/settings", { settings });
            setMessage({ type: "success", text: "Settings updated successfully!" });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Failed to update settings" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="settings-loading">Loading configuration...</div>;

    return (
        <div className="admin-settings">
            <div className="settings-header">
                <div>
                    <h2>System Settings</h2>
                    <p>Configure global website parameters and behavior.</p>
                </div>
                <button 
                    className="save-btn" 
                    onClick={handleSubmit} 
                    disabled={saving}
                >
                    {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
            </div>

            {message.text && (
                <div className={`settings-message ${message.type}`}>
                    <AlertCircle size={20} />
                    <span>{message.text}</span>
                </div>
            )}

            <form className="settings-form" onSubmit={handleSubmit}>
                <section className="settings-section">
                    <h3>General Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Website Name</label>
                            <input
                                type="text"
                                name="site_name"
                                value={settings.site_name}
                                onChange={handleChange}
                                placeholder="3akarati"
                            />
                        </div>
                        <div className="form-group">
                            <label>Contact Email</label>
                            <input
                                type="email"
                                name="contact_email"
                                value={settings.contact_email}
                                onChange={handleChange}
                                placeholder="support@3akarati.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Contact Phone</label>
                            <input
                                type="text"
                                name="contact_phone"
                                value={settings.contact_phone}
                                onChange={handleChange}
                                placeholder="+20 123 456 789"
                            />
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <h3>System Behavior</h3>
                    <div className="form-grid">
                        <div className="form-group toggle-group">
                            <div className="toggle-info">
                                <label>Maintenance Mode</label>
                                <p>Disable public access to the website for maintenance.</p>
                            </div>
                            <input
                                type="checkbox"
                                name="maintenance_mode"
                                checked={settings.maintenance_mode === "true"}
                                onChange={(e) => setSettings({ ...settings, maintenance_mode: String(e.target.checked) })}
                                className="toggle-switch"
                            />
                        </div>
                        <div className="form-group toggle-group">
                            <div className="toggle-info">
                                <label>Allow New Registrations</label>
                                <p>Enable or disable new user signups.</p>
                            </div>
                            <input
                                type="checkbox"
                                name="allow_new_registrations"
                                checked={settings.allow_new_registrations === "true"}
                                onChange={(e) => setSettings({ ...settings, allow_new_registrations: String(e.target.checked) })}
                                className="toggle-switch"
                            />
                        </div>
                        <div className="form-group">
                            <label>Featured Properties Limit</label>
                            <input
                                type="number"
                                name="featured_properties_limit"
                                value={settings.featured_properties_limit}
                                onChange={handleChange}
                                min="1"
                                max="20"
                            />
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}

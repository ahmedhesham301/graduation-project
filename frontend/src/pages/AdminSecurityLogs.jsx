import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import "./AdminSecurityLogs.css";

export default function AdminSecurityLogs() {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/security-logs?page=${page}`);
            setLogs(data.logs);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load security logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const getEventBadgeClass = (type) => {
        switch (type) {
            case "successful_login":
                return "badge-success";
            case "failed_login":
                return "badge-danger";
            case "google_login":
                return "badge-purple";
            case "unauthorized_admin_access":
            case "unauthorized_property_access":
                return "badge-warning";
            default:
                return "badge-info";
        }
    };

    const formatEventType = (type) => {
        switch (type) {
            case "successful_login":
                return "Successful Login";
            case "failed_login":
                return "Failed Login Attempt";
            case "google_login":
                return "Google Sign-In";
            case "unauthorized_admin_access":
                return "Unauthorized Admin Page Access";
            case "unauthorized_property_access":
                return "Unauthorized Property Modification";
            default:
                return type.replace(/_/g, " ");
        }
    };

    const abbreviateUserAgent = (ua) => {
        if (!ua) return "Unknown Client";
        if (ua.includes("Chrome") && ua.includes("Safari") && !ua.includes("Edg")) return "Chrome Browser";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari Browser";
        if (ua.includes("Firefox")) return "Firefox Browser";
        if (ua.includes("Edg")) return "Edge Browser";
        if (ua.includes("Postman")) return "Postman client";
        return ua.substring(0, 30) + "...";
    };

    if (loading) return <div className="sec-log-loading">Loading security audit logs...</div>;

    return (
        <div className="admin-security-logs">
            <h2>Security Audit Logs</h2>
            <p className="sec-log-desc">
                Continuous tracking of authentication results, access control violations, and state changes.
            </p>

            <div className="sec-log-list">
                {logs.map(log => (
                    <div key={log.id} className="sec-log-entry">
                        <div className="sec-log-header">
                            <span className={`sec-log-badge ${getEventBadgeClass(log.event_type)}`}>
                                {formatEventType(log.event_type)}
                            </span>
                            <span className="sec-log-time">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        
                        <div className="sec-log-body">
                            <div className="sec-log-meta-item">
                                <span className="meta-label">User:</span>
                                <span className="meta-value">{log.user_name || log.email || "Guest"}</span>
                            </div>
                            <div className="sec-log-meta-item">
                                <span className="meta-label">IP Address:</span>
                                <span className="meta-value font-mono">{log.ip_address}</span>
                            </div>
                            <div className="sec-log-meta-item">
                                <span className="meta-label">Client:</span>
                                <span className="meta-value" title={log.user_agent}>{abbreviateUserAgent(log.user_agent)}</span>
                            </div>
                        </div>

                        {log.details && (
                            <div className="sec-log-details">
                                <strong>Log details:</strong> {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                            </div>
                        )}
                    </div>
                ))}
                {logs.length === 0 && <p className="no-sec-logs">No security events recorded yet.</p>}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}

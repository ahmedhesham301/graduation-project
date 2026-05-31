import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import "./AdminActivityLog.css";

export default function AdminActivityLog() {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/activity-log?page=${page}`);
            setLogs(data.logs);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load activity log:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [page]);

    const formatAction = (action) => {
        const map = {
            approve_seller: "Approved seller",
            reject_seller: "Rejected seller",
            delete_user: "Deleted user",
            delete_property: "Deleted property",
            change_role: "Changed role",
        };
        return map[action] || action;
    };

    if (loading) return <div className="log-loading">Loading...</div>;

    return (
        <div className="admin-activity-log">
            <h2>Activity Log</h2>

            <div className="log-list">
                {logs.map(log => (
                    <div key={log.id} className="log-entry">
                        <div className="log-time">{new Date(log.created_at).toLocaleString()}</div>
                        <div className="log-content">
                            <span className="log-admin">{log.admin_name}</span>
                            <span className="log-action">{formatAction(log.action)}</span>
                            <span className="log-target">{log.target_type} #{log.target_id}</span>
                        </div>
                        {log.details && <div className="log-details">{log.details}</div>}
                    </div>
                ))}
                {logs.length === 0 && <p className="no-logs">No activity recorded yet.</p>}
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

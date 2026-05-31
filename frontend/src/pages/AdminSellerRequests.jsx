import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import "./AdminSellerRequests.css";

export default function AdminSellerRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [filter, setFilter] = useState("all");

    const fetchRequests = async () => {
        try {
            const { data } = await api.get("/admin/seller-requests");
            setRequests(data);
        } catch (err) {
            console.error("Failed to load seller requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleApprove = async (userId, name) => {
        if (!confirm(`Approve "${name}" as a seller?`)) return;
        try {
            await api.post(`/admin/seller-requests/${userId}/approve`);
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to approve");
        }
    };

    const handleReject = async (userId) => {
        if (!rejectReason.trim()) {
            alert("Please provide a rejection reason");
            return;
        }
        try {
            await api.post(`/admin/seller-requests/${userId}/reject`, { reason: rejectReason });
            setRejectingId(null);
            setRejectReason("");
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to reject");
        }
    };

    if (loading) return <div className="requests-loading">Loading...</div>;

    const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        verified: requests.filter(r => r.status === 'verified').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="admin-seller-requests">
            <h2>Seller Requests</h2>

            <div className="requests-tabs">
                <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                    All ({counts.all})
                </button>
                <button className={`tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
                    Pending ({counts.pending})
                </button>
                <button className={`tab ${filter === "verified" ? "active" : ""}`} onClick={() => setFilter("verified")}>
                    Accepted ({counts.verified})
                </button>
                <button className={`tab ${filter === "rejected" ? "active" : ""}`} onClick={() => setFilter("rejected")}>
                    Rejected ({counts.rejected})
                </button>
            </div>

            {filtered.length === 0 && <p className="no-requests">No requests in this category.</p>}

            <div className="requests-list">
                {filtered.map(req => (
                    <div key={req.id} className={`request-card ${req.status}`}>
                        <div className="request-info">
                            <div className="request-name">
                                {req.full_name}
                                <span className={`status-tag ${req.status}`}>{req.status}</span>
                            </div>
                            <div className="request-detail">{req.email} | {req.phone || "No phone"}</div>
                            <div className="request-detail">Business: {req.business_name} ({req.business_type || "N/A"})</div>
                            <div className="request-detail">National ID: {req.national_id}</div>
                            <div className="request-detail">Submitted: {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : "—"}</div>
                            {req.reviewed_at && (
                                <div className="request-detail">Reviewed: {new Date(req.reviewed_at).toLocaleDateString()}</div>
                            )}
                            {req.rejection_reason && (
                                <div className="request-detail rejection-reason">Reason: {req.rejection_reason}</div>
                            )}
                        </div>
                        {req.status === 'pending' && (
                            <div className="request-actions">
                                <button className="approve-btn" onClick={() => handleApprove(req.user_id, req.full_name)}>
                                    Approve
                                </button>
                                <button className="reject-btn" onClick={() => setRejectingId(req.user_id)}>
                                    Reject
                                </button>
                            </div>
                        )}
                        {rejectingId === req.user_id && (
                            <div className="reject-form">
                                <textarea
                                    placeholder="Reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <div className="reject-form-actions">
                                    <button className="confirm-reject-btn" onClick={() => handleReject(req.user_id)}>
                                        Confirm Reject
                                    </button>
                                    <button className="cancel-btn" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

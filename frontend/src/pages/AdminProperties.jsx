import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import Skeleton from "../components/Skeleton";
import useDebounce from "../hooks/useDebounce";
import { Check, X, AlertCircle } from "lucide-react";
import "./AdminProperties.css";

export default function AdminProperties({ onNavigate }) {
    const [properties, setProperties] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [types, setTypes] = useState([]);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [propertyToReject, setPropertyToReject] = useState(null);

    const debouncedSearch = useDebounce(search, 500);
    const debouncedCity = useDebounce(cityFilter, 500);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                search: debouncedSearch,
                city: debouncedCity,
                typeId: typeFilter,
                status: statusFilter,
                sortBy,
                sortOrder
            });
            const { data } = await api.get(`/admin/properties?${params}`);
            setProperties(data.properties);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load properties:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const { data } = await api.get("/properties/types");
                setTypes(data);
            } catch (err) {
                console.error("Failed to load types:", err);
            }
        };
        fetchTypes();
    }, []);

    useEffect(() => { fetchProperties(); }, [page, debouncedSearch, debouncedCity, typeFilter, statusFilter, sortBy, sortOrder]);

    const handleDelete = async (id, city, district) => {
        if (!confirm(`Delete property in "${city}, ${district}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/properties/${id}`);
            fetchProperties();
            if (selectedProperty?.id === id) setSelectedProperty(null);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete property");
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/properties/${id}/approve`);
            fetchProperties();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to approve property");
        }
    };

    const handleApproveAll = async () => {
        if (!confirm("Are you sure you want to approve all pending properties? This will approve all listings awaiting review.")) return;
        try {
            await api.post("/admin/properties/approve-all");
            fetchProperties();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to approve all properties");
        }
    };


    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectionReason) return;
        try {
            await api.post(`/admin/properties/${propertyToReject}/reject`, { reason: rejectionReason });
            setShowRejectionModal(false);
            setPropertyToReject(null);
            setRejectionReason("");
            fetchProperties();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to reject property");
        }
    };

    const handleViewDetails = async (id) => {
        setDetailLoading(true);
        setIsEditing(false);
        try {
            const { data } = await api.get(`/admin/properties/${id}`);
            setSelectedProperty(data);
            setEditData(data);
        } catch (err) {
            console.error("Failed to load property details:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/admin/properties/${selectedProperty.id}`, editData);
            setSelectedProperty({ ...selectedProperty, ...editData });
            setIsEditing(false);
            fetchProperties();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update property");
        }
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
        } else {
            setSortBy(field);
            setSortOrder("DESC");
        }
        setPage(1);
    };

    return (
        <div className="admin-properties">
            <div className="properties-header">
                <div>
                    <h2>Property Moderation</h2>
                    <p>Review and manage property listings on the platform.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button className="approve-all-btn" onClick={handleApproveAll}>
                        Approve All Pending
                    </button>
                    <span className="properties-count">{total} properties found</span>
                </div>
            </div>

            <div className="properties-filters">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Search seller, city, district..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="search-input"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="status-filter"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="type-filter"
                    >
                        <option value="">All Types</option>
                        {types.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <table className="properties-table">
                <thead>
                    <tr>
                        <th onClick={() => toggleSort("id")} className="sortable">ID {sortBy === "id" && (sortOrder === "ASC" ? "↑" : "↓")}</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th onClick={() => toggleSort("price")} className="sortable">Price {sortBy === "price" && (sortOrder === "ASC" ? "↑" : "↓")}</th>
                        <th>Seller</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <tr key={i}>
                                <td colSpan="7"><Skeleton height="40px" /></td>
                            </tr>
                        ))
                    ) : (
                        properties.map(prop => (
                            <tr key={prop.id} onClick={() => handleViewDetails(prop.id)} className="clickable-row">
                                <td>#{prop.id}</td>
                                <td><span className="type-tag">{prop.type}</span></td>
                                <td>
                                    <div className="loc-cell">
                                        <span className="city">{prop.city}</span>
                                        <span className="district">{prop.district}</span>
                                    </div>
                                </td>
                                <td><span className="price-tag">{Number(prop.price).toLocaleString()} EGP</span></td>
                                <td>{prop.seller_name}</td>
                                <td>
                                    <span className={`status-badge ${prop.moderation_status}`}>
                                        {prop.moderation_status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                        {prop.moderation_status === 'pending' && (
                                            <>
                                                <button className="approve-icon" title="Approve" onClick={() => handleApprove(prop.id)}>
                                                    <Check size={18} />
                                                </button>
                                                <button className="reject-icon" title="Reject" onClick={() => { setPropertyToReject(prop.id); setShowRejectionModal(true); }}>
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                        <button className="delete-icon" title="Delete" onClick={() => handleDelete(prop.id, prop.city, prop.district)}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {!loading && totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            )}

            {showRejectionModal && (
                <div className="modal-overlay" onClick={() => setShowRejectionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Reject Property Listing</h3>
                        <p>Please provide a reason for rejecting this listing. The seller will be notified.</p>
                        <form onSubmit={handleReject}>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Incomplete information, blurry photos, etc."
                                required
                            />
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowRejectionModal(false)} className="cancel-btn">Cancel</button>
                                <button type="submit" className="confirm-reject-btn">Confirm Rejection</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(selectedProperty || detailLoading) && (
                <div className="property-modal-overlay" onClick={() => setSelectedProperty(null)}>
                    <div className="property-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedProperty(null)}>×</button>
                        {detailLoading ? (
                            <div className="modal-loading">
                                <Skeleton height="30px" width="200px" className="mb-20" />
                                <div className="modal-grid">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <Skeleton key={i} height="60px" />
                                    ))}
                                </div>
                            </div>
                        ) : selectedProperty && (
                            <>
                                <div className="modal-title">
                                    <h3>{isEditing ? `Edit Property #${selectedProperty.id}` : `Property Details #${selectedProperty.id}`}</h3>
                                    <span className={`status-badge ${selectedProperty.moderation_status}`}>{selectedProperty.moderation_status}</span>
                                </div>
                                {isEditing ? (
                                    <form onSubmit={handleUpdate} className="edit-form">
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <label>Price (EGP)</label>
                                                <input
                                                    type="number"
                                                    value={editData.price}
                                                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <label>Area (m²)</label>
                                                <input
                                                    type="number"
                                                    value={editData.area}
                                                    onChange={(e) => setEditData({ ...editData, area: e.target.value })}
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <label>Rooms</label>
                                                <input
                                                    type="number"
                                                    value={editData.rooms}
                                                    onChange={(e) => setEditData({ ...editData, rooms: e.target.value })}
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <label>Bathrooms</label>
                                                <input
                                                    type="number"
                                                    value={editData.bathrooms}
                                                    onChange={(e) => setEditData({ ...editData, bathrooms: e.target.value })}
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <label>Floors</label>
                                                <input
                                                    type="number"
                                                    value={editData.floors}
                                                    onChange={(e) => setEditData({ ...editData, floors: e.target.value })}
                                                />
                                            </div>
                                            <div className="modal-field">
                                                <label>Condition</label>
                                                <select
                                                    value={editData.condition}
                                                    onChange={(e) => setEditData({ ...editData, condition: e.target.value })}
                                                >
                                                    <option value="not finished">Not Finished</option>
                                                    <option value="semi finished">Semi Finished</option>
                                                    <option value="fully finished">Fully Finished</option>
                                                    <option value="luxury finished">Luxury Finished</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="modal-field full-width">
                                            <label>Description</label>
                                            <textarea
                                                value={editData.description}
                                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                                            <button type="submit" className="save-btn">Save Changes</button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        {selectedProperty.moderation_status === 'rejected' && (
                                            <div className="rejection-alert">
                                                <AlertCircle size={20} />
                                                <span>Rejected: {selectedProperty.rejection_reason}</span>
                                            </div>
                                        )}
                                        <div className="modal-grid">
                                            <div className="modal-field">
                                                <label>Type</label>
                                                <span>{selectedProperty.type}</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Location</label>
                                                <span>{selectedProperty.city}, {selectedProperty.district}</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Price</label>
                                                <span>{Number(selectedProperty.price).toLocaleString()} EGP</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Area</label>
                                                <span>{selectedProperty.area} m²</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Rooms</label>
                                                <span>{selectedProperty.rooms}</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Bathrooms</label>
                                                <span>{selectedProperty.bathrooms}</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Floors</label>
                                                <span>{selectedProperty.floors}</span>
                                            </div>
                                            <div className="modal-field">
                                                <label>Condition</label>
                                                <span>{selectedProperty.condition}</span>
                                            </div>
                                        </div>
                                        <div className="modal-seller">
                                            <label>Seller Information</label>
                                            <p>{selectedProperty.seller_name} ({selectedProperty.seller_email})</p>
                                        </div>
                                        <div className="modal-actions">
                                            {selectedProperty.moderation_status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApprove(selectedProperty.id)} className="approve-btn">Approve Listing</button>
                                                    <button onClick={() => { setPropertyToReject(selectedProperty.id); setShowRejectionModal(true); }} className="reject-btn">Reject Listing</button>
                                                </>
                                            )}
                                            <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Details</button>
                                            <button onClick={() => onNavigate("propertyDetails", { propertyId: selectedProperty.id, id: selectedProperty.id, fromPage: "admin" })} className="view-btn">View Property</button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import Skeleton from "../components/Skeleton";
import { ExternalLink } from "lucide-react";
import "./AdminProperties.css"; // Reuse existing styles

export default function AdminSoldProperties({ onNavigate }) {
    const [properties, setProperties] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchSoldProperties = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/sold-properties?page=${page}`);
            setProperties(data.properties);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load sold properties:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSoldProperties(); }, [page]);

    return (
        <div className="admin-properties">
            <div className="properties-header">
                <div>
                    <h2>Sold Properties</h2>
                    <span className="properties-count">{total} sales recorded</span>
                </div>
            </div>

            <table className="properties-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Sold Price</th>
                        <th>Seller</th>
                        <th>Buyer</th>
                        <th>Sold At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <tr key={i}>
                                <td colSpan="8"><Skeleton height="40px" /></td>
                            </tr>
                        ))
                    ) : (
                        properties.map(prop => (
                            <tr key={prop.id}>
                                <td>#{prop.id}</td>
                                <td>{prop.type}</td>
                                <td>
                                    <div className="property-cell">
                                        <span className="district">{prop.district}</span>
                                        <span className="city">{prop.city}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="price-stack">
                                        <span className="sold-price">{Number(prop.sold_price).toLocaleString()} EGP</span>
                                        <span className="list-price-small">Listed: {Number(prop.original_price).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="user-mini-info">
                                        <span className="name">{prop.seller_name}</span>
                                        <span className="email-small">{prop.seller_email}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="user-mini-info">
                                        <span className="name">{prop.buyer_name}</span>
                                        <span className="email-small">{prop.buyer_email}</span>
                                    </div>
                                </td>
                                <td>{new Date(prop.sold_at).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="view-btn-icon" 
                                        onClick={() => onNavigate("propertyDetails", { id: prop.id })}
                                        title="View Property"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
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
        </div>
    );
}

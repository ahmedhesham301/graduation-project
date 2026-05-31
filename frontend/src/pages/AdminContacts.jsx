import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import "./AdminContacts.css";

export default function AdminContacts() {
    const [events, setEvents] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page });
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            const { data } = await api.get(`/admin/contacts?${params}`);
            setEvents(data.events);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContacts(); }, [page]);

    const handleFilter = (e) => {
        e.preventDefault();
        setPage(1);
        fetchContacts();
    };

    return (
        <div className="admin-contacts">
            <div className="contacts-header">
                <h2>Contact Events</h2>
                <span className="contacts-count">{total} total</span>
            </div>

            <form className="contacts-filters" onSubmit={handleFilter}>
                <label>
                    From:
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label>
                    To:
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
                <button type="submit" className="filter-btn">Filter</button>
                {(from || to) && (
                    <button type="button" className="clear-btn" onClick={() => { setFrom(""); setTo(""); setPage(1); setTimeout(fetchContacts, 0); }}>
                        Clear
                    </button>
                )}
            </form>

            {loading ? (
                <div className="contacts-loading">Loading...</div>
            ) : (
                <>
                    <table className="contacts-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Buyer</th>
                                <th>Seller</th>
                                <th>Property</th>
                                <th>City</th>
                                <th>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(ev => (
                                <tr key={ev.id}>
                                    <td>{new Date(ev.contacted_at).toLocaleString()}</td>
                                    <td>{ev.buyer_name || "Guest"}</td>
                                    <td>{ev.seller_name}</td>
                                    <td>#{ev.property_id}</td>
                                    <td>{ev.city}</td>
                                    <td><span className={`method-badge ${ev.contact_method}`}>{ev.contact_method === 'chat' ? 'Chat Request' : ev.contact_method}</span></td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr><td colSpan="6" className="no-data">No contact events found</td></tr>
                            )}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                            <span>Page {page} of {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

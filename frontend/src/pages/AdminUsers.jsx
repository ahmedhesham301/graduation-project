import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import Skeleton from "../components/Skeleton";
import useDebounce from "../hooks/useDebounce";
import { Search, Filter, Trash2, UserCog, Mail, Phone, Calendar } from "lucide-react";
import "./AdminUsers.css";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [loading, setLoading] = useState(true);

    const debouncedSearch = useDebounce(search, 500);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                search: debouncedSearch,
                role: roleFilter,
                sortBy,
                sortOrder
            });
            const { data } = await api.get(`/admin/users?${params}`);
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [page, debouncedSearch, roleFilter, sortBy, sortOrder]);

    const handleRoleChange = async (userId, newRole) => {
        if (!confirm(`Change this user's role to "${newRole}"?`)) return;
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to change role");
        }
    };

    const handleDelete = async (userId, name) => {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete user");
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
        <div className="admin-users">
            <div className="users-header">
                <div>
                    <h2>User Management</h2>
                    <p>Manage permissions, roles, and accounts across the system.</p>
                </div>
                <span className="users-count">{total} total users</span>
            </div>

            <div className="users-filters">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="search-input"
                    />
                </div>
                <div className="filter-box">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="role-filter"
                    >
                        <option value="">All Roles</option>
                        <option value="buyer">Buyers</option>
                        <option value="seller">Sellers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th onClick={() => toggleSort("full_name")} className="sortable">Name {sortBy === "full_name" && (sortOrder === "ASC" ? "↑" : "↓")}</th>
                            <th onClick={() => toggleSort("email")} className="sortable">Contact Information {sortBy === "email" && (sortOrder === "ASC" ? "↑" : "↓")}</th>
                            <th onClick={() => toggleSort("role")} className="sortable">Account Role {sortBy === "role" && (sortOrder === "ASC" ? "↑" : "↓")}</th>
                            <th onClick={() => toggleSort("created_at")} className="sortable">Join Date {sortBy === "created_at" && (sortOrder === "ASC" ? "↑" : "↓")}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan="5"><Skeleton height="50px" /></td>
                                </tr>
                            ))
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-profile-cell">
                                            <div className="user-avatar">{user.full_name[0]}</div>
                                            <div className="user-name-info">
                                                <span className="user-name">{user.full_name}</span>
                                                <span className="user-id">ID: #{user.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-contact-cell">
                                            <div className="contact-item"><Mail size={14} /> {user.email}</div>
                                            {user.phone && <div className="contact-item"><Phone size={14} /> {user.phone}</div>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="role-cell">
                                            <UserCog size={16} />
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={`role-select role-${user.role}`}
                                            >
                                                <option value="buyer">Buyer</option>
                                                <option value="seller">Seller</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} />
                                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="delete-btn-icon"
                                            onClick={() => handleDelete(user.id, user.full_name)}
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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
